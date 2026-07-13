import type { INotificationSender } from "./INotificationSender";
import { notificationRepository } from "@/services/data/repositories";

/**
 * Notification Engine framework (Architecture doc "centralized notification
 * service"; Business Rules "Notification Rules").
 *
 * Stage 0 shipped the engine SHAPE only. Stage 3 (Compliance Engine)
 * registers the real rules: tiered document-expiry (30/60/90-day +
 * expired), restricted profession, missing document, and duplicate
 * record — all reading their thresholds from Master Data (Standard 17.5),
 * never hardcoded. The engine itself still knows nothing about any of
 * that; it only knows how to dedupe, deliver, and auto-resolve whatever a
 * `NotificationRule` reports.
 */
export interface NotificationRecord {
  id: string;
  category:
    | "expired"
    | "expiringSoon30"
    | "expiringSoon60"
    | "expiringSoon90"
    | "restrictedProfession"
    | "missingDocument"
    | "duplicateRecord"
    | "system";
  entityType: string;
  entityId: string;
  titleKey: string; // i18n key, never a literal string
  /** Optional plain-text elaboration for cases a static i18n key can't
   *  express — e.g. missing-document notifications list WHICH document
   *  types are missing (resolved from Master Data labels, so it's data,
   *  not interface copy). Never itself a translation key. */
  detail?: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationRule {
  code: string;
  /** Evaluated on a schedule; returns any newly-generated notifications. */
  evaluate: () => Promise<Omit<NotificationRecord, "id" | "createdAt" | "read">[]>;
}

class NotificationEngine {
  private senders: INotificationSender[] = [];
  private rules: NotificationRule[] = [];

  registerSender(sender: INotificationSender): void {
    this.senders.push(sender);
  }

  registerRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }

  /** Categories whose notifications are re-derived from scratch on every
   *  evaluation (as opposed to one-off events like "system"), so a
   *  condition that's no longer true (a document was renewed, a duplicate
   *  was fixed, a profession was reclassified) has its notification
   *  auto-resolved rather than sitting unread forever. This is every
   *  Stage 3 compliance category — "system" is the sole exception, since a
   *  one-off announcement was never derived from a re-checkable condition. */
  private readonly reconciledCategories: NotificationRecord["category"][] = [
    "expired",
    "expiringSoon30",
    "expiringSoon60",
    "expiringSoon90",
    "restrictedProfession",
    "missingDocument",
    "duplicateRecord",
  ];

  /** Called by a scheduled job (client-side interval in Stage 0/1, server
   *  cron post cloud-migration — Blueprint Section 8). Deliberately
   *  idempotent: re-running it (e.g. after every document save, in lieu of
   *  a real scheduler in Stage 1) must not pile up duplicate notifications
   *  for a condition that's already been raised and is still unread — and
   *  must clear notifications for conditions that are no longer true. */
  async runScheduledEvaluation(): Promise<NotificationRecord[]> {
    const { items: existingUnread } = await notificationRepository.list({ filters: { read: false } });
    const generated: NotificationRecord[] = [];
    const currentKeys = new Set<string>();

    for (const rule of this.rules) {
      const results = await rule.evaluate();
      for (const partial of results) {
        const key = `${partial.category}:${partial.entityType}:${partial.entityId}`;
        currentKeys.add(key);

        const alreadyRaised = existingUnread.some(
          (n) => n.category === partial.category && n.entityType === partial.entityType && n.entityId === partial.entityId
        );
        if (alreadyRaised) continue;

        const notification: NotificationRecord = {
          ...partial,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          read: false,
        };
        generated.push(notification);
        await Promise.all(this.senders.map((s) => s.send(notification)));
      }
    }

    // Auto-resolve reconciled-category notifications whose condition no
    // longer holds (e.g. a document was renewed past the warning window).
    const staleResolutions = existingUnread.filter(
      (n) =>
        this.reconciledCategories.includes(n.category) &&
        !currentKeys.has(`${n.category}:${n.entityType}:${n.entityId}`)
    );
    await Promise.all(staleResolutions.map((n) => notificationRepository.update(n.id, { read: true })));

    return generated;
  }
}

export const notificationEngine = new NotificationEngine();
