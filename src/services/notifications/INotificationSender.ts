import type { NotificationRecord } from "./NotificationEngine";

/**
 * Delivery-channel abstraction (Section 8 / Blueprint Section 8: "delivery
 * channels ... as pluggable senders reading from the same queue"). Stage 0
 * ships only the in-app sender; Email/SMS/Push (Roadmap Phase 4 "Future")
 * are added later as additional classes implementing this same interface —
 * NotificationEngine never changes.
 */
export interface INotificationSender {
  readonly channel: "inApp" | "email" | "sms" | "push";
  send(notification: NotificationRecord): Promise<void>;
}
