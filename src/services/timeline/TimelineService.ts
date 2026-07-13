import { auditEngine } from "@/services/audit/AuditEngine";
import { documentRepository, communicationRepository, notificationRepository } from "@/services/data/repositories";
import { attachmentRepository } from "@/services/data/repositories/AttachmentRepository";
import { getMasterDataLabel } from "@/services/master-data/masterDataCache";
import i18n from "@/i18n";
import type { TimelineEvent } from "@/shared/components/Timeline";
import type { Attachment } from "@/types/entities";

/**
 * Universal Timeline backend (Blueprint Standard 17.4).
 *
 * Aggregates every event source that already carries a polymorphic
 * `entityType + entityId` reference — Audit Log, Documents, Communication
 * entries, Notifications — into one merged, chronological feed for a
 * given entity. This is a READ-SIDE aggregator only: it introduces no new
 * data model, per 17.4 ("reuses the same polymorphic entityType+entityId
 * reference pattern already established").
 *
 * Stage 2 addition: document events are now sourced from each document's
 * OWN audit trail (`entityType: "document"`, keyed by the document's id —
 * every write already goes through the repository-level audit interceptor
 * from Stage 0) rather than a single synthetic "updated" snapshot. This is
 * what makes the per-document "Audit Log" requirement in the Document
 * Engine actually visible end-to-end on the owning entity's Timeline,
 * across every document TYPE generically — nothing here is National
 * ID/Iqama/Passport-specific.
 *
 * Attachment Preview addition: every currently-referenced attachment's own
 * audit trail (`entityType: "attachment"`) — upload, view (preview),
 * download, and the "update" recorded when it's superseded by a Replace —
 * is folded in the same way, labeled with the file name so "someone
 * previewed passport-scan.pdf" is visible on the owning entity's Timeline,
 * not just inside the Document panel.
 *
 * Workflow events (Standard 17.9) join this same aggregator once workflow
 * instances actually attach to entities in a later stage — the shape below
 * already reserves the "workflow" TimelineEventKind for that.
 */
export async function getEntityTimeline(entityType: string, entityId: string): Promise<TimelineEvent[]> {
  const [auditEntries, { items: documents }, { items: communications }, { items: notifications }] =
    await Promise.all([
      auditEngine.listForEntity(entityType, entityId),
      documentRepository.list({ filters: { entityType, entityId } }),
      communicationRepository.list({ filters: { entityType, entityId } }),
      notificationRepository.list({ filters: { entityType, entityId } }),
    ]);

  const documentAuditEntries = (
    await Promise.all(documents.map((document) => auditEngine.listForEntity("document", document.id)))
  ).flat();

  const attachmentIds = Array.from(new Set(documents.flatMap((document) => document.attachmentIds)));
  const [attachmentAuditEntries, attachmentRecords] = await Promise.all([
    Promise.all(attachmentIds.map((id) => auditEngine.listForEntity("attachment", id))).then((entries) =>
      entries.flat()
    ),
    Promise.all(attachmentIds.map((id) => attachmentRepository.getMetadata(id))),
  ]);

  const lang = i18n.resolvedLanguage === "ar" ? "ar" : "en";
  const documentLabelById = new Map(
    documents.map((document) => [
      document.id,
      `${getMasterDataLabel(document.documentTypeMasterDataId, lang)} — ${document.documentNumber}`,
    ])
  );
  const attachmentLabelById = new Map(
    attachmentRecords.filter((a): a is Attachment => Boolean(a)).map((a) => [a.id, a.fileName])
  );

  const events: TimelineEvent[] = [
    ...auditEntries.map(
      (entry): TimelineEvent => ({
        id: entry.id,
        kind: "audit",
        timestamp: entry.timestamp,
        title: `timeline.audit.${entry.action}`,
      })
    ),
    ...documentAuditEntries.map(
      (entry): TimelineEvent => ({
        id: entry.id,
        kind: "document",
        timestamp: entry.timestamp,
        title: `timeline.audit.${entry.action}`,
        description: documentLabelById.get(entry.entityId) ?? entry.entityId,
      })
    ),
    ...attachmentAuditEntries.map(
      (entry): TimelineEvent => ({
        id: entry.id,
        kind: "document",
        timestamp: entry.timestamp,
        title: `timeline.audit.${entry.action}`,
        description: attachmentLabelById.get(entry.entityId) ?? entry.entityId,
      })
    ),
    ...communications.map(
      (entry): TimelineEvent => ({
        id: entry.id,
        kind: "communication",
        timestamp: entry.occurredAt,
        title: `timeline.communication.${entry.category}`,
        description: entry.description,
      })
    ),
    ...notifications.map(
      (notification): TimelineEvent => ({
        id: notification.id,
        kind: "notification",
        timestamp: notification.createdAt,
        title: notification.titleKey,
      })
    ),
  ];

  return events;
}
