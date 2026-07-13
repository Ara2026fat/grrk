import { personRepository, masterDataRepository } from "@/services/data/repositories";
import { detectMissingDocumentTypeCodes } from "@/services/rules/ComplianceRuleEngine";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import i18n from "@/i18n";
import type { NotificationRule } from "../NotificationEngine";

/**
 * Missing Document notifications (05_BUSINESS_RULES "Missing Document
 * Detection"). One notification per employee (not one per missing
 * document type) — the `detail` field lists which types are missing, so
 * the person doesn't get spammed with a separate notice per document.
 * Auto-resolves once every required, applicable document exists.
 *
 * Queries Master Data directly (not the `masterDataCache` bridge used by
 * static schema configs) since this rule can run before any component has
 * mounted `MasterDataProvider` — a service should never depend on a
 * UI-layer cache being warm.
 */
export const missingDocumentNotificationRule: NotificationRule = {
  code: "missingDocument",

  async evaluate() {
    const [{ items: employees }, { items: documentTypes }] = await Promise.all([
      personRepository.list({ filters: { type: "employee", isActive: true } }),
      masterDataRepository.list({ filters: { category: MasterDataCategory.DOCUMENT_TYPE } }),
    ]);

    const lang = i18n.resolvedLanguage === "ar" ? "ar" : "en";
    const labelByCode = new Map(
      documentTypes.map((record) => [record.code, lang === "ar" ? record.labelAr : record.labelEn])
    );

    const results = await Promise.all(
      employees.map(async (employee) => {
        const missingCodes = await detectMissingDocumentTypeCodes("employee", employee.id);
        if (missingCodes.length === 0) return undefined;
        const missingLabels = missingCodes.map((code) => labelByCode.get(code) ?? code);
        return {
          category: "missingDocument" as const,
          entityType: "employee",
          entityId: employee.id,
          titleKey: "notifications.missingDocument",
          detail: missingLabels.join(", "),
        };
      })
    );

    return results.filter((result): result is NonNullable<typeof result> => Boolean(result));
  },
};
