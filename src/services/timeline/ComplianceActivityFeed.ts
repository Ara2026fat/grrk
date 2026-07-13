import { notificationRepository } from "@/services/data/repositories";
import type { TimelineEvent } from "@/shared/components/Timeline";
import type { NotificationRecord } from "@/services/notifications/NotificationEngine";

/**
 * Compliance Timeline (Roadmap Phase 3). A platform-wide, compliance-only
 * view over the SAME notification data the per-entity Universal Timeline
 * already reads (Blueprint 17.4) — this is not a second event source, just
 * a different filter/audience over the one that exists. Reuses the
 * existing `Timeline` component as-is; no new rendering logic.
 */
const complianceCategories: NotificationRecord["category"][] = [
  "expired",
  "expiringSoon30",
  "expiringSoon60",
  "expiringSoon90",
  "restrictedProfession",
  "missingDocument",
  "duplicateRecord",
];

export async function getComplianceActivityFeed(limit = 25): Promise<TimelineEvent[]> {
  const { items } = await notificationRepository.list({
    page: 1,
    pageSize: limit,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  return items
    .filter((notification) => complianceCategories.includes(notification.category))
    .map((notification) => ({
      id: notification.id,
      kind: "notification",
      timestamp: notification.createdAt,
      title: notification.titleKey,
      description: notification.detail,
    }));
}
