import { documentRepository, communicationRepository, notificationRepository } from "./repositories";
import { attachmentRepository } from "./repositories/AttachmentRepository";

/**
 * MVP bug fix: deleting an entity (Employee, Company, ...) previously left
 * its documents, attachments, communication entries, and unresolved
 * notifications orphaned — still referencing an entityId that no longer
 * existed. Worst symptom: `documentExpiryNotificationRule` doesn't know
 * the owning entity is gone, so it kept generating "expiring soon"
 * notifications forever for a deleted employee's documents, and the
 * Notification Center's click-through led nowhere.
 *
 * Audit Log entries are the ONE deliberate exception — left untouched.
 * A permanent record of "this existed and this happened to it" is the
 * entire point of an audit trail, even after the record itself is gone
 * (Audit Rules: every action is recorded — that doesn't stop being true
 * just because the entity was later deleted).
 *
 * Generic across every entity type — called once, from the Universal
 * Entity Engine's single delete path (EntityDetailPage), not duplicated
 * per module.
 */
export async function cascadeDeleteEntityData(entityType: string, entityId: string): Promise<void> {
  const [{ items: documents }, { items: communications }, { items: notifications }] = await Promise.all([
    documentRepository.list({ filters: { entityType, entityId } }),
    communicationRepository.list({ filters: { entityType, entityId } }),
    notificationRepository.list({ filters: { entityType, entityId } }),
  ]);

  await Promise.all([
    ...documents.flatMap((document) => [
      ...document.attachmentIds.map((attachmentId) => attachmentRepository.remove(attachmentId)),
      documentRepository.delete(document.id),
    ]),
    ...communications.map((entry) => communicationRepository.delete(entry.id)),
    ...notifications.map((notification) => notificationRepository.delete(notification.id)),
  ]);
}
