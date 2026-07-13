import { documentRepository } from "@/services/data/repositories";
import { computeExpiryTier, getComplianceThresholds, ExpiryTier } from "@/services/rules/ComplianceRuleEngine";
import type { NotificationRule, NotificationRecord } from "../NotificationEngine";

/**
 * Document-expiry notifications, tiered (05_BUSINESS_RULES "Notification
 * Rules": Expired / 30-Day / 60-Day / 90-Day Expiry are each independently
 * listed). Re-derives the FULL set of currently-affected documents on
 * every call — it does not track state itself — so NotificationEngine's
 * reconciliation can both raise new notifications and auto-resolve stale
 * ones (e.g. a document crossing from the 90-day tier into the 60-day
 * tier retires its old notice and raises a more urgent one automatically,
 * since the category string itself changes).
 *
 * Reads its thresholds from Master Data via the Compliance Rule Engine
 * (Standard 17.5) — no hardcoded day counts here.
 */
const tierToCategory: Record<Exclude<ExpiryTier, "none">, NotificationRecord["category"]> = {
  expired: "expired",
  critical30: "expiringSoon30",
  warning60: "expiringSoon60",
  notice90: "expiringSoon90",
};

const tierToTitleKey: Record<Exclude<ExpiryTier, "none">, string> = {
  expired: "notifications.documentExpired",
  critical30: "notifications.documentExpiringSoon30",
  warning60: "notifications.documentExpiringSoon60",
  notice90: "notifications.documentExpiringSoon90",
};

export const documentExpiryNotificationRule: NotificationRule = {
  code: "documentExpiry",

  async evaluate() {
    const [{ items: documents }, thresholds] = await Promise.all([
      documentRepository.list({ filters: { isActive: true } }),
      getComplianceThresholds(),
    ]);

    return documents
      .map((document) => ({ document, tier: computeExpiryTier(document.expiryDate, thresholds) }))
      .filter((entry): entry is { document: typeof documents[number]; tier: Exclude<ExpiryTier, "none"> } =>
        entry.tier !== "none"
      )
      .map(({ document, tier }) => ({
        category: tierToCategory[tier],
        entityType: document.entityType,
        entityId: document.entityId,
        titleKey: tierToTitleKey[tier],
      }));
  },
};
