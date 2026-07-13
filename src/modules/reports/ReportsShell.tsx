import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, Button } from "@/design-system/primitives";
import { reportingEngine } from "@/services/reporting/ReportingEngine";
import { downloadBlob } from "@/shared/utils/download";
import { useToast } from "@/shared/components/Toast";

/**
 * Reports Center (08_EXECUTIVE_REPORTING_AND_ANALYTICS: "Users should be
 * able to preview reports, print reports, export PDF/Excel/CSV"). CSV
 * export is wired end-to-end for every report registered in
 * `reportDefinitions.ts`; PDF/Excel still return the Stage 0 placeholder
 * error until a later stage implements them — that error now surfaces as
 * a toast instead of failing silently (MVP bug fix).
 *
 * MVP usability pass: reports are grouped (Employee vs. Compliance) with a
 * one-line description each, so someone can tell what they're about to
 * download before they click — a flat list of titles didn't give enough
 * context for a Reports Center someone hasn't used before.
 */
const reportGroups = [
  {
    titleKey: "reports.groupEmployee",
    reports: [
      { code: "employeeDirectory", titleKey: "reports.employeeDirectory", descriptionKey: "reports.employeeDirectoryDescription" },
      { code: "documentExpiry", titleKey: "reports.documentExpiry", descriptionKey: "reports.documentExpiryDescription" },
    ],
  },
  {
    titleKey: "reports.groupCompliance",
    reports: [
      { code: "restrictedProfessions", titleKey: "reports.restrictedProfessions", descriptionKey: "reports.restrictedProfessionsDescription" },
      { code: "missingDocuments", titleKey: "reports.missingDocuments", descriptionKey: "reports.missingDocumentsDescription" },
      { code: "complianceSummary", titleKey: "reports.complianceSummary", descriptionKey: "reports.complianceSummaryDescription" },
    ],
  },
];

export function ReportsShell() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [busyCode, setBusyCode] = useState<string>();

  async function handleExportCsv(code: string) {
    setBusyCode(code);
    try {
      const blob = await reportingEngine.export(code, { module: code, filters: {} }, "csv");
      if (blob instanceof Blob) downloadBlob(blob, `${code}.csv`);
    } catch {
      showToast("error", t("reports.exportFailed"));
    } finally {
      setBusyCode(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-pageTitle font-bold text-text-primary">{t("nav.reports")}</h1>

      {reportGroups.map((group) => (
        <div key={group.titleKey} className="flex flex-col gap-3">
          <h2 className="text-sectionTitle font-semibold text-text-primary">{t(group.titleKey)}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.reports.map((report) => (
              <Card key={report.code} className="flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{t(report.titleKey)}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{t(report.descriptionKey)}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleExportCsv(report.code)}
                  loading={busyCode === report.code}
                  className="self-start"
                >
                  {t("reports.exportCsv")}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
