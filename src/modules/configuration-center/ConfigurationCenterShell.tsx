import { useTranslation } from "react-i18next";
import { Card } from "@/design-system/primitives";
import { useMasterData } from "@/modules/master-data/MasterDataProvider";
import { MasterDataCategory, MasterDataCategoryKey } from "@/modules/master-data/masterDataCategories";

/**
 * Configuration Center foundation (Blueprint Standard 17.10).
 *
 * Stage 0 delivers the SHELL: one screen listing every configurable
 * category (Master Data categories + the extended ones — Notification
 * Rules, Compliance Thresholds, Dashboard Defaults, Email Templates) with
 * live record counts. Category-specific editing UI (add/edit a profession,
 * adjust a 90-day threshold, etc.) is Stage 3/8 work, built as one generic
 * "MasterDataCategoryEditor" reusing the Entity Engine's form primitives —
 * not a bespoke screen per category, consistent with 17.3.
 *
 * System Settings (non-master-data platform behavior) and User Preferences
 * are called out per 17.10 but their stores are introduced alongside
 * Stage 8 (System Administration).
 */
const categoryLabelKeys: Record<MasterDataCategoryKey, string> = {
  [MasterDataCategory.COMPANY]: "nav.companies",
  [MasterDataCategory.ORGANIZATION]: "nav.organizations",
  [MasterDataCategory.DEPARTMENT]: "nav.configuration",
  [MasterDataCategory.NATIONALITY]: "nav.configuration",
  [MasterDataCategory.PROFESSION]: "nav.configuration",
  [MasterDataCategory.DOCUMENT_TYPE]: "nav.documents",
  [MasterDataCategory.VEHICLE_TYPE]: "nav.configuration",
  [MasterDataCategory.LOCATION]: "nav.configuration",
  [MasterDataCategory.STATUS_TYPE]: "nav.configuration",
  [MasterDataCategory.NOTIFICATION_RULE]: "nav.notifications",
  [MasterDataCategory.COMPLIANCE_THRESHOLD]: "nav.compliance",
  [MasterDataCategory.DASHBOARD_DEFAULT]: "nav.dashboard",
  [MasterDataCategory.EMAIL_TEMPLATE]: "nav.notifications",
  [MasterDataCategory.REQUIRED_DOCUMENT_TYPE]: "nav.compliance",
};

export function ConfigurationCenterShell() {
  const { t } = useTranslation();
  const { getByCategory, isLoading } = useMasterData();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-pageTitle font-bold text-text-primary">{t("nav.configuration")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.values(MasterDataCategory).map((category) => (
          <Card key={category}>
            <h3 className="text-sm font-semibold text-text-primary">{t(categoryLabelKeys[category])}</h3>
            <p className="text-xs text-text-secondary">{category}</p>
            <p className="mt-2 text-2xl font-bold text-brand-primary-500">
              {isLoading ? "…" : getByCategory(category).length}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
