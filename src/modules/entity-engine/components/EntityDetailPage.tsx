import { ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button, Spinner, ConfirmDialog } from "@/design-system/primitives";
import { Timeline, TimelineEvent } from "@/shared/components/Timeline";
import { getEntityTimeline } from "@/services/timeline/TimelineService";
import { cascadeDeleteEntityData } from "@/services/data/cascadeDeleteEntity";
import { useToast } from "@/shared/components/Toast";
import type { EntitySchema } from "../EntitySchema.types";
import type { BaseRecord } from "@/types/entities";

interface EntityDetailPageProps<T extends BaseRecord> {
  schema: EntitySchema<T>;
  entityId: string;
  entityType: string;
  onEdit: () => void;
  onBack: () => void;
  /** Optional — when provided, a Delete action with a confirmation dialog
   *  is shown. Omitted entirely (no dead button) for entities that don't
   *  support deletion yet. Called AFTER the record is removed, so the
   *  parent only needs to handle navigation. */
  onDeleted?: () => void;
  /** Extra entity-specific sections (e.g. the National ID panel for
   *  Employees) rendered between the fields card and the Timeline. Keeps
   *  this component universal — it doesn't need to know Documents exist —
   *  while still letting a real module attach richer content without
   *  forking the page (Blueprint Section 6, points 3–4). */
  children?: ReactNode;
}

/**
 * ONE generic detail page. Every entity gets:
 *  - its field values rendered from `schema.fields`
 *  - a Universal Timeline (17.4) aggregating Audit Log, Documents,
 *    Communication, and Notification events for this entity
 *
 * UX polish pass: a real loading spinner instead of a bare "…", a
 * responsive fields grid (single column on mobile), and — when the parent
 * opts in via `onDeleted` — a Delete action behind a ConfirmDialog rather
 * than a silent destructive click.
 */
export function EntityDetailPage<T extends BaseRecord>({
  schema,
  entityId,
  entityType,
  onEdit,
  onBack,
  onDeleted,
  children,
}: EntityDetailPageProps<T>) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [record, setRecord] = useState<T | undefined>();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    schema.repository.getById(entityId).then(setRecord);
    setTimelineLoading(true);
    getEntityTimeline(entityType, entityId).then((raw) => {
      setEvents(raw.map((event) => ({ ...event, title: t(event.title) })));
      setTimelineLoading(false);
    });
  }, [schema, entityId, entityType, t]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await cascadeDeleteEntityData(entityType, entityId);
      await schema.repository.delete(entityId);
      showToast("success", t("messages.deleted"));
      onDeleted?.();
    } catch {
      showToast("error", t("messages.deleteFailed"));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (!record) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-pageTitle font-bold text-text-primary">{t(schema.labelKey)}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onBack}>
            {t("actions.cancel")}
          </Button>
          {onDeleted && (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              {t("actions.delete")}
            </Button>
          )}
          <Button onClick={onEdit}>{t("actions.edit")}</Button>
        </div>
      </div>

      <Card>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schema.fields.map((field) => (
            <div key={field.key}>
              <dt className="text-xs text-text-secondary">{t(field.labelKey)}</dt>
              <dd className="text-sm text-text-primary">{String((record as Record<string, unknown>)[field.key] ?? "—")}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {children}

      <div>
        <h2 className="mb-2 text-sectionTitle font-semibold text-text-primary">{t("common.timeline")}</h2>
        {timelineLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="sm" />
          </div>
        ) : (
          <Timeline events={events} emptyState={t("common.noActivityYet")} />
        )}
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title={t("messages.confirmDeleteTitle")}
        message={t("messages.confirmDeleteMessage")}
        confirmLabel={t("actions.delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
