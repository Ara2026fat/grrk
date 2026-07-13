import { detectDuplicateNationalIds } from "@/services/rules/ComplianceRuleEngine";
import type { NotificationRule } from "../NotificationEngine";

/**
 * Duplicate Record notifications (05_BUSINESS_RULES "Duplicate Record
 * Detection"). One notification per DUPLICATE record (not one per group),
 * so an administrator can open any of the flagged records directly from
 * the Notification Center and decide which is correct. Auto-resolves once
 * only one record with that National ID remains active.
 */
export const duplicateRecordNotificationRule: NotificationRule = {
  code: "duplicateRecord",

  async evaluate() {
    const duplicateGroups = await detectDuplicateNationalIds();
    const results: { category: "duplicateRecord"; entityType: string; entityId: string; titleKey: string }[] = [];

    for (const group of duplicateGroups.values()) {
      for (const person of group) {
        results.push({
          category: "duplicateRecord",
          entityType: "employee",
          entityId: person.id,
          titleKey: "notifications.duplicateRecord",
        });
      }
    }

    return results;
  },
};
