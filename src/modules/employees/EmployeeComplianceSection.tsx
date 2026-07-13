import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/design-system/primitives";
import { DocumentEngineSection } from "@/modules/documents/DocumentEngineSection";
import { personRepository, masterDataRepository } from "@/services/data/repositories";
import { isProfessionRestricted, computeEntityComplianceScore, getComplianceScoreTone } from "@/services/rules/ComplianceRuleEngine";
import { complianceScoreToneClass } from "@/shared/utils/complianceScoreTone";
import type { MasterDataRecord } from "@/types/entities";

interface EmployeeComplianceSectionProps {
  employeeId: string;
  onChanged?: () => void;
}

/**
 * Employee-specific compliance surface: a per-employee Compliance Score
 * (Stage 3), the restricted-profession warning (05_BUSINESS_RULES: "When
 * detected: Display a red warning. Highlight the record."), and every
 * document type applicable to Employees — National ID, Iqama, Passport,
 * Driving License, Medical Insurance, Work Permit — rendered generically
 * through the Document Engine (Stage 2). Kept as a small Employee-module
 * component — rather than teaching the generic EntityDetailPage about
 * professions/scores — so Company/Organization detail pages stay simple
 * while Employee gets exactly the extra compliance context it needs.
 */
export function EmployeeComplianceSection({ employeeId, onChanged }: EmployeeComplianceSectionProps) {
  const { t } = useTranslation();
  const [profession, setProfession] = useState<MasterDataRecord>();
  const [score, setScore] = useState<number>();

  async function loadCompliance() {
    const person = await personRepository.getById(employeeId);
    if (person?.professionMasterDataId) {
      setProfession(await masterDataRepository.getById(person.professionMasterDataId));
    }
    setScore(await computeEntityComplianceScore("employee", employeeId));
  }

  useEffect(() => {
    loadCompliance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const restricted = isProfessionRestricted(profession);
  const scoreTone = complianceScoreToneClass(getComplianceScoreTone(score));

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{t("compliance.overallScore")}</span>
        <span className={`text-2xl font-bold ${scoreTone}`}>{score === undefined ? "…" : `${score}%`}</span>
      </Card>

      {restricted && (
        <Card className="border-status-expired bg-status-expired/5">
          <p className="text-sm font-medium text-status-expired">{t("compliance.restrictedProfessionWarning")}</p>
        </Card>
      )}
      <DocumentEngineSection
        entityType="employee"
        entityId={employeeId}
        onChanged={() => {
          loadCompliance();
          onChanged?.();
        }}
      />
    </div>
  );
}
