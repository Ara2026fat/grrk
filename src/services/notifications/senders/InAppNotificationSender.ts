import type { INotificationSender } from "../INotificationSender";
import type { NotificationRecord } from "../NotificationEngine";
import { notificationRepository } from "@/services/data/repositories";

/**
 * In-app delivery channel (Stage 1: now persists to IndexedDB via the
 * repository layer — Standard 17.1 — so the Dashboard's "Recent
 * Notifications" widget and a future Notification Center page have real
 * data to read. Stage 0 only logged to the console as a proof of the
 * engine's shape; this replaces that placeholder.)
 */
export class InAppNotificationSender implements INotificationSender {
  readonly channel = "inApp" as const;

  async send(notification: NotificationRecord): Promise<void> {
    await notificationRepository.create(notification);
  }
}
