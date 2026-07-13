import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { personRepository, masterDataRepository } from "@/services/data/repositories";
import { isProfessionRestricted } from "@/services/rules/ComplianceRuleEngine";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";

/** Executive Compliance Widget: count of employees whose profession is on
 *  the Restricted Professions list (05_BUSINESS_RULES: "Include in
 *  Compliance Dashboard"). */
export function RestrictedProfessionsWidget() {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>();

  useEffect(() => {
    async function load() {
      const [{ items: employees }, { items: professions }] = await Promise.all([
        personRepository.list({ filters: { type: "employee", isActive: true } }),
        masterDataRepository.list({ filters: { category: MasterDataCategory.PROFESSION } }),
      ]);
      const professionById = new Map(professions.map((p) => [p.id, p]));
      const restrictedCount = employees.filter((e) => isProfessionRestricted(professionById.get(e.professionMasterDataId))).length;
      setCount(restrictedCount);
    }
    load();
  }, []);

  return (
    <div className="flex items-center justify-center py-4">
      <span className="text-4xl font-bold text-status-expired">{count === undefined ? "…" : count}</span>
      <span className="ms-2 self-end pb-1 text-xs text-text-secondary">{t("compliance.employees")}</span>
    </div>
  );
}
