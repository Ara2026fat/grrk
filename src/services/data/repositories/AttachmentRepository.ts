import { supabase } from "../supabaseClient";
import { auditEngine } from "@/services/audit/AuditEngine";
import { isAuthenticated } from "@/services/auth/authContext";
import type { Attachment, AuditAction } from "@/types/entities";

const BUCKET = "attachments";

function assertAuthenticated(): void {
  if (!isAuthenticated()) {
    throw new Error("Unauthorized: no authenticated user for attachment write");
  }
}

export interface AttachmentUploadInput {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadedBy?: string;
}

export const attachmentRepository = {
  async upload(input: AttachmentUploadInput, blob: Blob): Promise<Attachment> {
    assertAuthenticated();
    const blobKey = `${input.id}:${input.fileName}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(blobKey, blob, {
      contentType: input.mimeType,
      upsert: true,
    });
    if (uploadError) throw uploadError;

    const record: Attachment = {
      ...input,
      blobKey,
      uploadedAt: new Date().toISOString(),
      isActive: true,
    };

    const { data, error } = await supabase.from("attachments").insert(record).select().single();
    if (error) throw error;
    await auditEngine.record({ entityType: "attachment", entityId: record.id, action: "upload" });
    return data as Attachment;
  },

  /** Replaces an attachment: a brand-new Attachment is uploaded (new id,
   *  new Storage object) tagged with replacesAttachmentId; the old one is
   *  soft-archived (isActive: false), never deleted. */
  async replace(existingId: string, input: Omit<AttachmentUploadInput, "id">, blob: Blob): Promise<Attachment> {
    assertAuthenticated();
    const existing = await this.getMetadata(existingId);
    if (!existing) throw new Error(`Attachment not found: ${existingId}`);

    const replacement = await this.upload({ id: crypto.randomUUID(), ...input }, blob);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("attachments")
      .update({ replacesAttachmentId: existingId })
      .eq("id", replacement.id)
      .select()
      .single();
    if (error) throw error;

    await supabase.from("attachments").update({ isActive: false, updatedAt: now }).eq("id", existingId);
    await auditEngine.record({ entityType: "attachment", entityId: existingId, action: "update" });

    return data as Attachment;
  },

  async getBlob(blobKey: string): Promise<Blob | undefined> {
    const { data, error } = await supabase.storage.from(BUCKET).download(blobKey);
    if (error) return undefined;
    return data;
  },

  async getMetadata(id: string): Promise<Attachment | undefined> {
    const { data, error } = await supabase.from("attachments").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as Attachment | null) ?? undefined;
  },

  /** Preview and explicit Download are recorded as distinct audit actions —
   *  both read the same blob; only the audit trail differs. */
  async recordAccess(id: string, action: Extract<AuditAction, "view" | "download">): Promise<void> {
    await auditEngine.record({ entityType: "attachment", entityId: id, action });
  },

  async remove(id: string): Promise<void> {
    assertAuthenticated();
    const meta = await this.getMetadata(id);
    if (meta) {
      await supabase.storage.from(BUCKET).remove([meta.blobKey]);
      await supabase.from("attachments").delete().eq("id", id);
      await auditEngine.record({ entityType: "attachment", entityId: id, action: "delete" });
    }
  },
};
