import { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, Button, Spinner } from "@/design-system/primitives";
import { attachmentRepository } from "@/services/data/repositories/AttachmentRepository";
import { downloadBlob } from "@/shared/utils/download";
import { formatFileSize } from "@/shared/utils/formatFileSize";
import { formatLocalizedDate } from "@/shared/utils/dateUtils";
import { resolveUserDisplayName } from "@/services/auth/authContext";
import { useToast } from "@/shared/components/Toast";
import type { Attachment } from "@/types/entities";

interface AttachmentPreviewDialogProps {
  attachment: Attachment | undefined;
  onClose: () => void;
  onReplaced: (next: Attachment) => void;
}

/**
 * Document Engine — Attachment Preview (Stage 2 completion).
 *
 * Renders PDFs and images inline via a Blob Object URL — no new
 * dependency; the `<iframe>` uses the browser's own native PDF viewer.
 * Every open records a "view" audit entry, kept distinct from an explicit
 * "download", so the Timeline/Audit Log can tell the two apart.
 *
 * Version-history readiness: see the `replacesAttachmentId` doc comment on
 * the `Attachment` type and `attachmentRepository.replace()` — this dialog
 * only calls that method and re-renders with whatever it returns; it has
 * no knowledge of versioning mechanics itself.
 */
export function AttachmentPreviewDialog({ attachment, onClose, onReplaced }: AttachmentPreviewDialogProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [blobUrl, setBlobUrl] = useState<string>();
  const [replacing, setReplacing] = useState(false);
  const lang = i18n.resolvedLanguage === "ar" ? "ar" : "en";

  useEffect(() => {
    if (!attachment) {
      setBlobUrl(undefined);
      return;
    }
    let objectUrl: string | undefined;
    attachmentRepository.getBlob(attachment.blobKey).then((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
    });
    attachmentRepository.recordAccess(attachment.id, "view");
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment]);

  if (!attachment) return null;

  const isPdf = attachment.mimeType === "application/pdf";
  const isImage = attachment.mimeType.startsWith("image/");
  const uploadedByLabel = resolveUserDisplayName(attachment.createdBy) ?? t("documents.unknownUploader");

  async function handleDownload() {
    if (!attachment) return;
    const blob = await attachmentRepository.getBlob(attachment.blobKey);
    if (blob) downloadBlob(blob, attachment.fileName);
    await attachmentRepository.recordAccess(attachment.id, "download");
  }

  async function handleReplaceFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !attachment) return;

    setReplacing(true);
    try {
      const next = await attachmentRepository.replace(
        attachment.id,
        { fileName: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size },
        file
      );
      showToast("success", t("documents.attachmentReplaced"));
      onReplaced(next);
    } catch {
      showToast("error", t("documents.attachmentReplaceFailed"));
    } finally {
      setReplacing(false);
    }
  }

  return (
    <Dialog open={Boolean(attachment)} title={attachment.fileName} onClose={onClose} size="lg">
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-text-secondary">{t("documents.fileSize")}</dt>
            <dd className="text-text-primary">{formatFileSize(attachment.sizeBytes)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">{t("documents.uploadedAt")}</dt>
            <dd className="text-text-primary">{formatLocalizedDate(new Date(attachment.createdAt), lang)}</dd>
          </div>
          <div className="col-span-2 sm:col-span-2">
            <dt className="text-xs text-text-secondary">{t("documents.uploadedBy")}</dt>
            <dd className="truncate text-text-primary">{uploadedByLabel}</dd>
          </div>
        </dl>

        <div className="flex min-h-[16rem] items-center justify-center rounded-md border border-surface-border bg-surface-subtle">
          {!blobUrl && <Spinner />}
          {blobUrl && isPdf && (
            <iframe title={attachment.fileName} src={blobUrl} className="h-[60vh] w-full rounded-md" />
          )}
          {blobUrl && isImage && (
            <img src={blobUrl} alt={attachment.fileName} className="max-h-[60vh] max-w-full rounded-md object-contain" />
          )}
          {blobUrl && !isPdf && !isImage && (
            <p className="p-6 text-center text-sm text-text-secondary">{t("documents.previewUnavailable")}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownload}>{t("actions.download")}</Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-surface-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-subtle">
            {replacing ? <Spinner size="sm" /> : t("documents.replaceFile")}
            <input type="file" className="hidden" onChange={handleReplaceFile} disabled={replacing} />
          </label>
          <Button variant="outline" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
