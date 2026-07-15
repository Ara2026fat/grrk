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
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdBy?: string;
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

    const now = new Date().toISOString();
    const record: Attachment = {
      id: input.id,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      blobKey,
      createdAt: now,
      updatedAt: now,
      createdBy: input.createdBy,
      isActive: true,
    };

    const { data, error } = await supabase.from("attachments").insert(record).select().single();
    if (error) throw error;
    await auditEngine.record({ entityType: "attachment", entityId: record.id, action: "upload" });
    return data as Attachment;
  },

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

  async recordAccess(id: string, action: Extract<AuditAction, "view" | "download">): Promise<void> {
    await auditEngine.record({ entityType: "attachment", entityId: id, action });
  },

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from("attachments")
      .select("*", { count: "exact", head: true })
      .eq("isActive", true);
    if (error) throw error;
    return count ?? 0;
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
