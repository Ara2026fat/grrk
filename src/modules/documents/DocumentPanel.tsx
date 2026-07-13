import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Card, Button, Input, Textarea, StatusBadge, Spinner, EmptyState } from "@/design-system/primitives";
import { requiredString, dateRangeShape, dateRangeRefinement } from "@/services/rules/ValidationEngine";
import { computeDocumentStatus, getDocumentExpiryWarningDays } from "@/services/rules/ComplianceRuleEngine";
import { documentRepository, masterDataRepository } from "@/services/data/repositories";
import { notificationEngine } from "@/services/notifications/NotificationEngine";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import { useToast } from "@/shared/components/Toast";
import { DocumentAttachments } from "./DocumentAttachments";
import { z } from "zod";
import type { DocumentRecord, EntityType } from "@/types/entities";

const documentFormSchema = z
  .object({
    documentNumber: requiredString(),
    ...dateRangeShape,
    notes: z.string().optional(),
  })
  .refine(dateRangeRefinement, { message: "validation.invalidDateRange", path: ["expiryDate"] });

type DocumentFormValues = { documentNumber: string; issueDate: string; expiryDate: string; notes?: string };

interface DocumentPanelProps {
  entityType: EntityType;
  entityId: string;
  documentTypeCode: string;
  titleKey: string;
  /** Called after a successful save so the parent (e.g. the Employee
   *  Timeline) can refresh — keeps this panel decoupled from how its
   *  parent chooses to react. */
  onChanged?: () => void;
}

/**
 * ONE reusable Document panel (Blueprint Section 6, point 3). Every
 * document type in the registry (`documentTypeRegistry.ts`) renders
 * through this exact component — National ID, Iqama, Passport, Vehicle
 * Insurance, all of it — parameterized only by `documentTypeCode`. There
 * is no per-document-type branching anywhere in this file.
 *
 * Covers every Stage 2 per-document requirement generically:
 *  - Issue/Expiry Date + Automatic Status: `computeDocumentStatus` (Compliance Rule Engine)
 *  - Attachments: delegated to `DocumentAttachments`
 *  - Notes: a plain field on the same record
 *  - Timeline + Audit Log: automatic — every repository write is audited
 *    (Stage 0) and surfaced by `TimelineService` (Stage 2 upgrade)
 *  - Notification: re-evaluated immediately after every save
 *  - Reporting + Search: the record this panel writes is exactly what
 *    `reportDefinitions.ts` and the document-number search integration
 *    (Stage 2) already read — no separate data path
 */
export function DocumentPanel({ entityType, entityId, documentTypeCode, titleKey, onChanged }: DocumentPanelProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [current, setCurrent] = useState<DocumentRecord | undefined>();
  const [warningDays, setWarningDays] = useState(90);
  const [documentTypeId, setDocumentTypeId] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
  });

  async function load() {
    const { items: types } = await masterDataRepository.list({
      filters: { category: MasterDataCategory.DOCUMENT_TYPE, code: documentTypeCode },
    });
    const typeId = types[0]?.id;
    setDocumentTypeId(typeId);
    if (!typeId) {
      setLoading(false);
      return;
    }

    const [{ items: documents }, days] = await Promise.all([
      documentRepository.list({ filters: { entityType, entityId, documentTypeMasterDataId: typeId } }),
      getDocumentExpiryWarningDays(),
    ]);
    const existing = documents[0];
    setCurrent(existing);
    setWarningDays(days);
    if (existing) {
      reset({
        documentNumber: existing.documentNumber,
        issueDate: existing.issueDate,
        expiryDate: existing.expiryDate,
        notes: existing.notes ?? "",
      });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, documentTypeCode]);

  // Keyboard: Escape backs out of edit mode without saving, consistent
  // with every other form in the platform.
  useEffect(() => {
    if (!editing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setEditing(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  async function reEvaluateAndNotify() {
    // Compliance + Notification integration: re-evaluate immediately so
    // the effect of this save (a status change, a new/cleared
    // notification) is visible right away rather than waiting for a
    // scheduler that doesn't exist yet in the browser-only build.
    await notificationEngine.runScheduledEvaluation();
  }

  async function onSubmit(values: DocumentFormValues) {
    if (!documentTypeId) return;
    const now = new Date().toISOString();

    try {
      if (current) {
        await documentRepository.update(current.id, { ...values, updatedAt: now });
      } else {
        const record: DocumentRecord = {
          id: crypto.randomUUID(),
          entityType,
          entityId,
          documentTypeMasterDataId: documentTypeId,
          attachmentIds: [],
          createdAt: now,
          updatedAt: now,
          isActive: true,
          ...values,
        };
        await documentRepository.create(record);
      }

      await reEvaluateAndNotify();

      showToast("success", t("messages.saved"));
      setEditing(false);
      await load();
      onChanged?.();
    } catch {
      showToast("error", t("messages.saveFailed"));
    }
  }

  async function handleAttachmentIdsChange(nextIds: string[]) {
    if (!current) return;
    const now = new Date().toISOString();
    await documentRepository.update(current.id, { attachmentIds: nextIds, updatedAt: now });
    setCurrent({ ...current, attachmentIds: nextIds, updatedAt: now });
    onChanged?.();
  }

  const status = current ? computeDocumentStatus(current.expiryDate, warningDays) : undefined;

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-8">
        <Spinner size="sm" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{t(titleKey)}</h3>
        {status && <StatusBadge status={status} label={t(`status.${status}`)} />}
      </div>

      {!editing && current && (
        <>
          <dl className="mb-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-text-secondary">{t("documents.documentNumber")}</dt>
              <dd className="text-text-primary">{current.documentNumber}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">{t("documents.issueDate")}</dt>
              <dd className="text-text-primary">{current.issueDate}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-secondary">{t("documents.expiryDate")}</dt>
              <dd className="text-text-primary">{current.expiryDate}</dd>
            </div>
          </dl>
          {current.notes && (
            <div className="mb-3">
              <dt className="text-xs text-text-secondary">{t("documents.notes")}</dt>
              <dd className="text-sm text-text-primary">{current.notes}</dd>
            </div>
          )}
          <Button variant="outline" onClick={() => setEditing(true)}>
            {t("actions.edit")}
          </Button>

          <div className="mt-4 border-t border-surface-border pt-3">
            <DocumentAttachments attachmentIds={current.attachmentIds} onAttachmentIdsChange={handleAttachmentIdsChange} />
          </div>
        </>
      )}

      {!editing && !current && (
        <EmptyState title={t("documents.none")} actionLabel={t("documents.add")} onAction={() => setEditing(true)} />
      )}

      {editing && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" noValidate>
          <Input
            label={t("documents.documentNumber")}
            required
            autoFocus
            error={errors.documentNumber ? t(String(errors.documentNumber.message)) : undefined}
            {...register("documentNumber")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              type="date"
              label={t("documents.issueDate")}
              required
              error={errors.issueDate ? t(String(errors.issueDate.message)) : undefined}
              {...register("issueDate")}
            />
            <Input
              type="date"
              label={t("documents.expiryDate")}
              required
              error={errors.expiryDate ? t(String(errors.expiryDate.message)) : undefined}
              {...register("expiryDate")}
            />
          </div>
          <Textarea label={t("documents.notes")} {...register("notes")} />
          <div className="flex gap-2">
            <Button type="submit" loading={isSubmitting}>
              {t("actions.save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={isSubmitting}>
              {t("actions.cancel")}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
