import { db } from "../db";
import { auditEngine } from "@/services/audit/AuditEngine";
import { currentUser } from "@/services/auth/authContext";
import type { Attachment, AuditAction } from "@/types/entities";

/**
 * Binary attachments (documents, images, PDFs, voice recordings) need a
 * dedicated repository because the Blob payload is stored separately from
 * its metadata record (Standard 17.6) — this keeps `attachments.list()`
 * queries fast, since they never have to load blob bytes. Still
 * Repository-First (17.1): this is the ONLY place that touches
 * `db.attachments` / `db.attachmentBlobs` directly.
 */
export interface AttachmentUploadInput {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export const attachmentRepository = {
  async upload(input: AttachmentUploadInput, blob: Blob): Promise<Attachment> {
    const now = new Date().toISOString();
    const blobKey = `${input.id}:${input.fileName}`;
    await db.attachmentBlobs.put({ blobKey, blob });

    const record: Attachment = {
      ...input,
      blobKey,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: currentUser()?.id,
    };
    await db.attachments.add(record);
    await auditEngine.record({ entityType: "attachment", entityId: record.id, action: "upload" });
    return record;
  },

  /**
   * Replace an attachment's file content WITHOUT losing the old version
   * (version-history readiness — see the `replacesAttachmentId` doc
   * comment on the `Attachment` type). This never mutates the existing
   * blob or record in place:
   *   1. A brand-new Attachment is uploaded (new id, new blob), tagged
   *      with `replacesAttachmentId` pointing at the one being replaced.
   *   2. The old Attachment is soft-archived (`isActive: false`) — kept,
   *      not deleted, and its own audit trail is preserved untouched.
   * Callers (e.g. DocumentPanel's `attachmentIds`) are responsible for
   * swapping the old id for the new one wherever the attachment is
   * referenced — this repository only knows about attachments, never
   * about which document/entity holds the reference (Repository-First:
   * no upward knowledge of callers).
   */
  async replace(existingId: string, input: Omit<AttachmentUploadInput, "id">, blob: Blob): Promise<Attachment> {
    const existing = await db.attachments.get(existingId);
    if (!existing) throw new Error(`Attachment not found: ${existingId}`);

    const replacement = await this.upload({ id: crypto.randomUUID(), ...input }, blob);
    const withLineage: Attachment = { ...replacement, replacesAttachmentId: existingId };
    await db.attachments.put(withLineage);

    const now = new Date().toISOString();
    await db.attachments.update(existingId, { isActive: false, updatedAt: now });
    await auditEngine.record({ entityType: "attachment", entityId: existingId, action: "update" });

    return withLineage;
  },

  async getBlob(blobKey: string): Promise<Blob | undefined> {
    const row = await db.attachmentBlobs.get(blobKey);
    return row?.blob;
  },

  async getMetadata(id: string): Promise<Attachment | undefined> {
    return db.attachments.get(id);
  },

  /** Preview ("view") and explicit Download are recorded as distinct
   *  audit actions — Timeline/Audit Log integration for the Preview
   *  experience. Both read the SAME blob; only the audit trail differs. */
  async recordAccess(id: string, action: Extract<AuditAction, "view" | "download">): Promise<void> {
    await auditEngine.record({ entityType: "attachment", entityId: id, action });
  },

  async remove(id: string): Promise<void> {
    const meta = await db.attachments.get(id);
    if (meta) {
      await db.attachmentBlobs.delete(meta.blobKey);
      await db.attachments.delete(id);
      await auditEngine.record({ entityType: "attachment", entityId: id, action: "delete" });
    }
  },
};
