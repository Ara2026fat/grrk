import { reportingEngine } from "@/services/reporting/ReportingEngine";
import { personRepository, documentRepository, masterDataRepository } from "@/services/data/repositories";
import { getMasterDataLabel } from "@/services/master-data/masterDataCache";
import {
  computeDocumentStatus,
  getDocumentExpiryWarningDays,
  isProfessionRestricted,
  detectMissingDocumentTypeCodes,
  detectDuplicateNationalIds,
  computeEntityComplianceScore,
} from "@/services/rules/ComplianceRuleEngine";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import { currentUser } from "@/services/auth/authContext";
import i18n from "@/i18n";
import type { ReportData } from "@/services/reporting/IReportExporter";

const lang = () => (i18n.resolvedLanguage === "ar" ? "ar" : "en") as "ar" | "en";

/**
 * The first two Standard Reports (08_EXECUTIVE_REPORTING_AND_ANALYTICS:
 * "Employee Report", "Documents Expiring in 30/60/90 Days" / "Expired
 * Documents"), registered against the Reporting Engine framework built in
 * Stage 0. Every report is only a `ReportQueryDescriptor -> ReportData`
 * function — the Reporting Engine, header rendering, and CSV/PDF/Excel
 * export adapters are all reused as-is.
 */
export function registerDefaultReports(): void {
  reportingEngine.registerReport({
    code: "employeeDirectory",
    titleKey: "reports.employeeDirectory",
    async run(): Promise<ReportData> {
      const { items: employees } = await personRepository.list({ filters: { type: "employee", isActive: true } });
      return {
        title: "Employee Directory",
        generatedBy: currentUser()?.displayName ?? "System",
        generatedAt: new Date().toISOString(),
        filters: {},
        columns: [
          { key: "name", header: "Name" },
          { key: "nationalId", header: "National ID" },
          { key: "profession", header: "Profession" },
          { key: "mobileNumber", header: "Mobile" },
        ],
        rows: employees.map((employee) => ({
          name: lang() === "ar" ? employee.fullNameAr : employee.fullNameEn,
          nationalId: employee.nationalId,
          profession: getMasterDataLabel(employee.professionMasterDataId, lang()),
          mobileNumber: employee.mobileNumber,
        })),
      };
    },
  });

  reportingEngine.registerReport({
    code: "documentExpiry",
    titleKey: "reports.documentExpiry",
    async run(): Promise<ReportData> {
      const [{ items: documents }, warningDays, { items: employees }] = await Promise.all([
        documentRepository.list({ filters: { isActive: true } }),
        getDocumentExpiryWarningDays(),
        personRepository.list(),
      ]);

      const rows = documents
        .map((document) => ({ document, status: computeDocumentStatus(document.expiryDate, warningDays) }))
        .filter(({ status }) => status !== "valid")
        .map(({ document, status }) => {
          const owner = employees.find((e) => e.id === document.entityId);
          return {
            owner: owner ? (lang() === "ar" ? owner.fullNameAr : owner.fullNameEn) : document.entityId,
            documentType: getMasterDataLabel(document.documentTypeMasterDataId, lang()),
            documentNumber: document.documentNumber,
            expiryDate: document.expiryDate,
            status,
          };
        });

      return {
        title: "Document Expiry Report",
        generatedBy: currentUser()?.displayName ?? "System",
        generatedAt: new Date().toISOString(),
        filters: { warningDays },
        columns: [
          { key: "owner", header: "Owner" },
          { key: "documentType", header: "Document Type" },
          { key: "documentNumber", header: "Document Number" },
          { key: "expiryDate", header: "Expiry Date" },
          { key: "status", header: "Status" },
        ],
        rows,
      };
    },
  });

  reportingEngine.registerReport({
    code: "restrictedProfessions",
    titleKey: "reports.restrictedProfessions",
    async run(): Promise<ReportData> {
      const [{ items: employees }, { items: professions }] = await Promise.all([
        personRepository.list({ filters: { type: "employee", isActive: true } }),
        masterDataRepository.list({ filters: { category: MasterDataCategory.PROFESSION } }),
      ]);
      const professionById = new Map(professions.map((p) => [p.id, p]));

      const rows = employees
        .filter((employee) => isProfessionRestricted(professionById.get(employee.professionMasterDataId)))
        .map((employee) => ({
          name: lang() === "ar" ? employee.fullNameAr : employee.fullNameEn,
          nationalId: employee.nationalId,
          profession: getMasterDataLabel(employee.professionMasterDataId, lang()),
        }));

      return {
        title: "Restricted Professions Report",
        generatedBy: currentUser()?.displayName ?? "System",
        generatedAt: new Date().toISOString(),
        filters: {},
        columns: [
          { key: "name", header: "Name" },
          { key: "nationalId", header: "National ID" },
          { key: "profession", header: "Profession" },
        ],
        rows,
      };
    },
  });

  reportingEngine.registerReport({
    code: "missingDocuments",
    titleKey: "reports.missingDocuments",
    async run(): Promise<ReportData> {
      const [{ items: employees }, { items: documentTypes }] = await Promise.all([
        personRepository.list({ filters: { type: "employee", isActive: true } }),
        masterDataRepository.list({ filters: { category: MasterDataCategory.DOCUMENT_TYPE } }),
      ]);
      const labelByCode = new Map(documentTypes.map((d) => [d.code, lang() === "ar" ? d.labelAr : d.labelEn]));

      const rows = (
        await Promise.all(
          employees.map(async (employee) => {
            const missing = await detectMissingDocumentTypeCodes("employee", employee.id);
            if (missing.length === 0) return undefined;
            return {
              name: lang() === "ar" ? employee.fullNameAr : employee.fullNameEn,
              nationalId: employee.nationalId,
              missingDocuments: missing.map((code) => labelByCode.get(code) ?? code).join(", "),
            };
          })
        )
      ).filter((row): row is NonNullable<typeof row> => Boolean(row));

      return {
        title: "Missing Documents Report",
        generatedBy: currentUser()?.displayName ?? "System",
        generatedAt: new Date().toISOString(),
        filters: {},
        columns: [
          { key: "name", header: "Name" },
          { key: "nationalId", header: "National ID" },
          { key: "missingDocuments", header: "Missing Documents" },
        ],
        rows,
      };
    },
  });

  reportingEngine.registerReport({
    code: "complianceSummary",
    titleKey: "reports.complianceSummary",
    async run(): Promise<ReportData> {
      const [{ items: employees }, duplicateGroups] = await Promise.all([
        personRepository.list({ filters: { type: "employee", isActive: true } }),
        detectDuplicateNationalIds(),
      ]);
      const duplicateIds = new Set(Array.from(duplicateGroups.values()).flat().map((p) => p.id));

      const rows = await Promise.all(
        employees.map(async (employee) => ({
          name: lang() === "ar" ? employee.fullNameAr : employee.fullNameEn,
          nationalId: employee.nationalId,
          complianceScore: await computeEntityComplianceScore("employee", employee.id),
          duplicateFlag: duplicateIds.has(employee.id) ? "Yes" : "No",
        }))
      );

      return {
        title: "Compliance Summary Report",
        generatedBy: currentUser()?.displayName ?? "System",
        generatedAt: new Date().toISOString(),
        filters: {},
        columns: [
          { key: "name", header: "Name" },
          { key: "nationalId", header: "National ID" },
          { key: "complianceScore", header: "Compliance Score" },
          { key: "duplicateFlag", header: "Duplicate Record" },
        ],
        rows,
      };
    },
  });
}
