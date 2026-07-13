import { personRepository, masterDataRepository } from "@/services/data/repositories";
import { isProfessionRestricted } from "@/services/rules/ComplianceRuleEngine";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import type { NotificationRule } from "../NotificationEngine";

/**
 * Restricted Profession notifications (05_BUSINESS_RULES: "When detected:
 * Display a red warning ... Include in Compliance Dashboard ... Include in
 * Reports"). Re-derives the full set of currently-restricted employees on
 * every call, so reassigning an employee away from a restricted profession
 * auto-resolves their notification via the engine's reconciliation.
 */
export const restrictedProfessionNotificationRule: NotificationRule = {
  code: "restrictedProfession",

  async evaluate() {
    const [{ items: employees }, { items: professions }] = await Promise.all([
      personRepository.list({ filters: { type: "employee", isActive: true } }),
      masterDataRepository.list({ filters: { category: MasterDataCategory.PROFESSION } }),
    ]);

    const professionById = new Map(professions.map((profession) => [profession.id, profession]));

    return employees
      .filter((employee) => isProfessionRestricted(professionById.get(employee.professionMasterDataId)))
      .map((employee) => ({
        category: "restrictedProfession" as const,
        entityType: "employee",
        entityId: employee.id,
        titleKey: "notifications.restrictedProfession",
      }));
  },
};
