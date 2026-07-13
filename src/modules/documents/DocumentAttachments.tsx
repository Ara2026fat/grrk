import { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/design-system/primitives";
import { useToast } from "@/shared/components/Toast";
import { attachmentRepository } from "@/services/data/repositories/AttachmentRepository";
import { formatFileSize } from "@/shared/utils/formatFileSize";
import { AttachmentPreviewDialog } from "./AttachmentPreviewDialog";
import type { Attachment } from "@/types/entities";

interface DocumentAttachmentsProps {
  attachmentIds: string[];
  onAttachmentIdsChange: (nextIds: string[]) => Promise<void>;
}

/**
 * Generic attachment manager (05_BUSINESS_RULES: every document supports
 * "Attachments"). Works against ANY DocumentRecord's `attachmentIds` — it
 * has no knowledge of National ID vs. Passport vs. anything else, so it is
 * shared as-is by every panel `DocumentEngineSection` renders.
 *
 * Binary storage goes through `attachmentRepository` (Standard 17.6:
 * IndexedDB, never localStorage) exactly as designed in Stage 0 — this
 * component only orchestrates upload/list/preview/download/remove, it
 * never touches IndexedDB directly (Repository-First, 17.1).
 *
 * Clicking a file name opens the Preview dialog (in-app PDF/image
 * preview, replace, and full metadata) rather than downloading straight
 * away — download is still one click away inside that dialog.
 */
export function DocumentAttachments({ attachmentIds, onAttachmentIdsChange }: DocumentAttachmentsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState<Attachment>();

  useEffect(() => {
    Promise.all(attachmentIds.map((id) => attachmentRepository.getMetadata(id))).then((results) =>
      setAttachments(results.filter((a): a is Attachment => Boolean(a)))
    );
  }, [attachmentIds]);

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file name later
    if (!file) return;

    setUploading(true);
    try {
      const meta = await attachmentRepository.upload(
        { id: crypto.randomUUID(), fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size },
        file
      );
      await onAttachmentIdsChange([...attachmentIds, meta.id]);
      showToast("success", t("documents.attachmentUploaded"));
    } catch {
      showToast("error", t("documents.attachmentUploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(attachment: Attachment) {
    await attachmentRepository.remove(attachment.id);
    await onAttachmentIdsChange(attachmentIds.filter((id) => id !== attachment.id));
  }

  /** After a "Replace" inside the preview dialog, swap the old attachment
   *  id for the new one in this document's `attachmentIds` — the
   *  repository already soft-archived the old record (see
   *  attachmentRepository.replace). */
  async function handleReplaced(next: Attachment) {
    const nextIds = attachmentIds.map((id) => (id === next.replacesAttachmentId ? next.id : id));
    await onAttachmentIdsChange(nextIds);
    setPreviewing(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-text-secondary">{t("documents.attachments")}</p>

      {attachments.length === 0 ? (
        <p className="text-sm text-text-secondary">{t("documents.noAttachments")}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center justify-between gap-2 rounded-md border border-surface-border px-3 py-2 text-sm"
            >
              <button
                type="button"
                className="min-w-0 truncate text-start text-brand-primary-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-300"
                onClick={() => setPreviewing(attachment)}
              >
                <span className="block truncate font-medium">{attachment.fileName}</span>
                <span className="block text-xs text-text-secondary">{formatFileSize(attachment.sizeBytes)}</span>
              </button>
              <button
                type="button"
                aria-label={t("actions.delete")}
                className="shrink-0 text-text-secondary hover:text-status-expired focus:outline-none focus-visible:ring-2 focus-visible:ring-status-expired/40"
                onClick={() => handleRemove(attachment)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-surface-border px-3 py-2 text-sm text-text-secondary hover:bg-surface-subtle">
        {uploading ? <Spinner size="sm" /> : t("documents.uploadFile")}
        <input type="file" className="hidden" onChange={handleFileSelect} disabled={uploading} />
      </label>

      <AttachmentPreviewDialog attachment={previewing} onClose={() => setPreviewing(undefined)} onReplaced={handleReplaced} />
    </div>
  );
}
