import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WidgetContainer } from "@/shared/components/WidgetContainer";
import { Timeline, TimelineEvent } from "@/shared/components/Timeline";
import { Card, StatusBadge } from "@/design-system/primitives";
import {
  computeOverallComplianceScore,
  computeExpiryBands,
  detectDuplicateNationalIds,
  detectMissingDocumentTypeCodes,
  isProfessionRestricted,
  getComplianceScoreTone,
  ExpiryBands,
} from "@/services/rules/ComplianceRuleEngine";
import { complianceScoreToneClass } from "@/shared/utils/complianceScoreTone";
import { getComplianceActivityFeed } from "@/services/timeline/ComplianceActivityFeed";
import { personRepository, masterDataRepository } from "@/services/data/repositories";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import type { Person } from "@/types/entities";

/**
 * Compliance Center (Roadmap Phase 3). One dedicated page pulling together
 * every Stage 3 detection function — nothing here computes a compliance
 * rule itself; it only calls into `ComplianceRuleEngine` and renders the
 * result, the same functions the Notification Engine and Reporting Engine
 * also call (one implementation, three consumers).
 */
export function ComplianceCenterShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.resolvedLanguage === "ar" ? "ar" : "en";

  const [score, setScore] = useState<number>();
  const [bands, setBands] = useState<ExpiryBands>();
  const [restrictedEmployees, setRestrictedEmployees] = useState<Person[]>([]);
  const [missingByEmployee, setMissingByEmployee] = useState<{ person: Person; missing: string[] }[]>([]);
  const [duplicates, setDuplicates] = useState<Person[]>([]);
  const [activity, setActivity] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        overallScore,
        expiryBands,
        { items: employees },
        { items: professions },
        { items: documentTypes },
        duplicateGroups,
        feed,
      ] = await Promise.all([
        computeOverallComplianceScore(),
        computeExpiryBands(),
        personRepository.list({ filters: { type: "employee", isActive: true } }),
        masterDataRepository.list({ filters: { category: MasterDataCategory.PROFESSION } }),
        masterDataRepository.list({ filters: { category: MasterDataCategory.DOCUMENT_TYPE } }),
        detectDuplicateNationalIds(),
        getComplianceActivityFeed(),
      ]);

      const professionById = new Map(professions.map((p) => [p.id, p]));
      const labelByCode = new Map(documentTypes.map((d) => [d.code, lang === "ar" ? d.labelAr : d.labelEn]));

      setScore(overallScore);
      setBands(expiryBands);
      setRestrictedEmployees(employees.filter((e) => isProfessionRestricted(professionById.get(e.professionMasterDataId))));

      const missingResults = await Promise.all(
        employees.map(async (person) => {
          const missing = await detectMissingDocumentTypeCodes("employee", person.id);
          return { person, missing: missing.map((code) => labelByCode.get(code) ?? code) };
        })
      );
      setMissingByEmployee(missingResults.filter((entry) => entry.missing.length > 0));

      setDuplicates(Array.from(duplicateGroups.values()).flat());
      setActivity(feed.map((event) => ({ ...event, title: t(event.title) })));
      setLoading(false);
    }
    load();
  }, [t, lang]);

  const scoreTone = complianceScoreToneClass(getComplianceScoreTone(score));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-pageTitle font-bold text-text-primary">{t("nav.compliance")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <WidgetContainer title={t("compliance.overallScore")}>
          <div className="flex items-center justify-center py-2">
            <span className={`text-4xl font-bold ${scoreTone}`}>{loading ? "…" : `${score}%`}</span>
          </div>
        </WidgetContainer>

        <WidgetContainer title={t("compliance.expiringWithin30")}>
          <div className="flex items-center justify-center py-2">
            <span className="text-4xl font-bold text-status-expired">{loading ? "…" : bands?.within30Days}</span>
          </div>
        </WidgetContainer>

        <WidgetContainer title={t("compliance.expiringWithin60")}>
          <div className="flex items-center justify-center py-2">
            <span className="text-4xl font-bold text-status-expiringSoon">{loading ? "…" : bands?.within60Days}</span>
          </div>
        </WidgetContainer>

        <WidgetContainer title={t("compliance.expiringWithin90")}>
          <div className="flex items-center justify-center py-2">
            <span className="text-4xl font-bold text-status-information">{loading ? "…" : bands?.within90Days}</span>
          </div>
        </WidgetContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sectionTitle font-semibold text-text-primary">{t("compliance.restrictedProfessionsList")}</h2>
          {restrictedEmployees.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("compliance.none")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {restrictedEmployees.map((person) => (
                <li key={person.id}>
                  <button
                    className="text-sm text-brand-primary-600 hover:underline"
                    onClick={() => navigate(`/employees/${person.id}`)}
                  >
                    {lang === "ar" ? person.fullNameAr : person.fullNameEn}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sectionTitle font-semibold text-text-primary">{t("compliance.missingDocumentsList")}</h2>
          {missingByEmployee.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("compliance.none")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {missingByEmployee.map(({ person, missing }) => (
                <li key={person.id} className="text-sm">
                  <button
                    className="font-medium text-brand-primary-600 hover:underline"
                    onClick={() => navigate(`/employees/${person.id}`)}
                  >
                    {lang === "ar" ? person.fullNameAr : person.fullNameEn}
                  </button>
                  <span className="text-text-secondary"> — {missing.join(", ")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sectionTitle font-semibold text-text-primary">{t("compliance.duplicateRecordsList")}</h2>
          {duplicates.length === 0 ? (
            <p className="text-sm text-text-secondary">{t("compliance.none")}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {duplicates.map((person) => (
                <li key={person.id} className="flex items-center gap-2 text-sm">
                  <StatusBadge status="expired" label={person.nationalId} />
                  <button
                    className="text-brand-primary-600 hover:underline"
                    onClick={() => navigate(`/employees/${person.id}`)}
                  >
                    {lang === "ar" ? person.fullNameAr : person.fullNameEn}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sectionTitle font-semibold text-text-primary">{t("compliance.timeline")}</h2>
          <Timeline events={activity} emptyState={t("common.noActivityYet")} />
        </Card>
      </div>
    </div>
  );
}
