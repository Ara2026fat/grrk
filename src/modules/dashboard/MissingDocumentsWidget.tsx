import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { personRepository } from "@/services/data/repositories";
import { detectMissingDocumentTypeCodes } from "@/services/rules/ComplianceRuleEngine";

/** Executive Compliance Widget: count of employees missing at least one
 *  required, applicable document (05_BUSINESS_RULES "Missing Document
 *  Detection"). */
export function MissingDocumentsWidget() {
  const { t } = useTranslation();
  const [count, setCount] = useState<number>();

  useEffect(() => {
    async function load() {
      const { items: employees } = await personRepository.list({ filters: { type: "employee", isActive: true } });
      const results = await Promise.all(
        employees.map((e) => detectMissingDocumentTypeCodes("employee", e.id))
      );
      setCount(results.filter((missing) => missing.length > 0).length);
    }
    load();
  }, []);

  return (
    <div className="flex items-center justify-center py-4">
      <span className="text-4xl font-bold text-status-expiringSoon">{count === undefined ? "…" : count}</span>
      <span className="ms-2 self-end pb-1 text-xs text-text-secondary">{t("compliance.employees")}</span>
    </div>
  );
}
