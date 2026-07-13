import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/design-system/primitives";
import { computeComplianceSnapshot, ComplianceSnapshot } from "@/services/rules/ComplianceRuleEngine";

/** Platform-wide document compliance counts, per Blueprint Standard 17.7
 *  (widget-based dashboard) — reads the same Compliance Rule Engine the
 *  Employee National ID panel and the Document Expiry report both use. */
export function ComplianceSnapshotWidget() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<ComplianceSnapshot>();

  useEffect(() => {
    computeComplianceSnapshot().then(setSnapshot);
  }, []);

  if (!snapshot) return <p className="text-sm text-text-secondary">…</p>;

  return (
    <ul className="flex flex-col gap-2 text-sm">
      <li className="flex items-center justify-between">
        <StatusBadge status="valid" label={t("status.valid")} />
        <span className="font-semibold text-text-primary">{snapshot.valid}</span>
      </li>
      <li className="flex items-center justify-between">
        <StatusBadge status="expiringSoon" label={t("status.expiringSoon")} />
        <span className="font-semibold text-text-primary">{snapshot.expiringSoon}</span>
      </li>
      <li className="flex items-center justify-between">
        <StatusBadge status="expired" label={t("status.expired")} />
        <span className="font-semibold text-text-primary">{snapshot.expired}</span>
      </li>
    </ul>
  );
}
