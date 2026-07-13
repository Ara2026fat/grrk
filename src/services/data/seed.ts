import { masterDataRepository } from "@/services/data/repositories";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import type { MasterDataRecord } from "@/types/entities";

/**
 * Initial Master Data seed. This does NOT violate "never hard-code these
 * values" (05_BUSINESS_RULES / Blueprint Standard 17.5) — the values below
 * are written as ordinary, editable Master Data ROWS through the same
 * repository every Configuration Center edit uses. Nothing in application
 * code branches on these specific strings; a rule service reads
 * `documentExpiryWarningDays` from whatever row currently has that code,
 * whether that row was created here or edited later by an administrator.
 *
 * Runs once — no-ops if any Master Data already exists, so a real
 * administrator's edits are never overwritten by re-running this.
 */
function record(
  category: string,
  code: string,
  labelAr: string,
  labelEn: string,
  metadata?: Record<string, unknown>
): MasterDataRecord {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), category, code, labelAr, labelEn, metadata, isActive: true, createdAt: now, updatedAt: now };
}

export async function seedMasterDataIfEmpty(): Promise<void> {
  const existing = await masterDataRepository.count();
  if (existing > 0) return;

  const records: MasterDataRecord[] = [
    // Nationalities
    record(MasterDataCategory.NATIONALITY, "saudi", "سعودي", "Saudi"),
    record(MasterDataCategory.NATIONALITY, "egyptian", "مصري", "Egyptian"),
    record(MasterDataCategory.NATIONALITY, "indian", "هندي", "Indian"),

    // Professions — one deliberately flagged isRestricted (05_BUSINESS_RULES
    // "Restricted Professions": Domestic Worker is a listed example).
    record(MasterDataCategory.PROFESSION, "engineer", "مهندس", "Engineer"),
    record(MasterDataCategory.PROFESSION, "accountant", "محاسب", "Accountant"),
    record(MasterDataCategory.PROFESSION, "governmentRelationsOfficer", "مسؤول علاقات حكومية", "Government Relations Officer"),
    record(MasterDataCategory.PROFESSION, "domesticWorker", "عامل منزلي", "Domestic Worker", { isRestricted: true }),

    // Departments
    record(MasterDataCategory.DEPARTMENT, "governmentRelations", "العلاقات الحكومية", "Government Relations"),
    record(MasterDataCategory.DEPARTMENT, "humanResources", "الموارد البشرية", "Human Resources"),

    // Document types (Roadmap Phase 2 — Stage 2 Document Engine). One row
    // per type; the Document Engine's registry (modules/documents/
    // documentTypeRegistry.ts) decides which entities each applies to —
    // this seed only declares that the type exists.
    record(MasterDataCategory.DOCUMENT_TYPE, "nationalId", "الهوية الوطنية", "National ID"),
    record(MasterDataCategory.DOCUMENT_TYPE, "iqama", "الإقامة", "Iqama"),
    record(MasterDataCategory.DOCUMENT_TYPE, "passport", "جواز السفر", "Passport"),
    record(MasterDataCategory.DOCUMENT_TYPE, "drivingLicense", "رخصة القيادة", "Driving License"),
    record(MasterDataCategory.DOCUMENT_TYPE, "vehicleRegistration", "استمارة المركبة", "Vehicle Registration"),
    record(MasterDataCategory.DOCUMENT_TYPE, "vehicleInsurance", "تأمين المركبة", "Vehicle Insurance"),
    record(MasterDataCategory.DOCUMENT_TYPE, "medicalInsurance", "التأمين الطبي", "Medical Insurance"),
    record(MasterDataCategory.DOCUMENT_TYPE, "workPermit", "تصريح العمل", "Work Permit"),
    record(MasterDataCategory.DOCUMENT_TYPE, "companyDocument", "مستندات الشركة", "Company Document"),

    // Compliance thresholds (05_BUSINESS_RULES "Notification Rules": Expired
    // / 30-Day / 60-Day / 90-Day Expiry). Stored as data so an administrator
    // can retune any of them later without a code change.
    record(MasterDataCategory.COMPLIANCE_THRESHOLD, "documentExpiryWarningDays", "فترة تنبيه انتهاء الوثيقة", "Document Expiry Warning Period", {
      value: 90,
    }),
    record(MasterDataCategory.COMPLIANCE_THRESHOLD, "documentExpiryNotify60Days", "تنبيه الانتهاء خلال 60 يوماً", "60-Day Expiry Notice", {
      value: 60,
    }),
    record(MasterDataCategory.COMPLIANCE_THRESHOLD, "documentExpiryNotify30Days", "تنبيه الانتهاء خلال 30 يوماً", "30-Day Expiry Notice", {
      value: 30,
    }),

    // Compliance scoring weights (Blueprint Standard 17.5). Defaults, not a
    // claimed industry standard — administrator-tunable.
    record(MasterDataCategory.COMPLIANCE_THRESHOLD, "scoreWeightExpiredDocument", "وزن المستند المنتهي", "Expired Document Score Weight", {
      value: 15,
    }),
    record(MasterDataCategory.COMPLIANCE_THRESHOLD, "scoreWeightMissingDocument", "وزن المستند المفقود", "Missing Document Score Weight", {
      value: 10,
    }),
    record(MasterDataCategory.COMPLIANCE_THRESHOLD, "scoreWeightRestrictedProfession", "وزن المهنة المقيدة", "Restricted Profession Score Weight", {
      value: 20,
    }),

    // Required document types (05_BUSINESS_RULES "Missing Document
    // Detection"). Presence of a row here — for a code that's also
    // applicable per the Document Type Registry — is what makes a document
    // type "required" rather than optional. Only National ID is seeded as
    // required by default: Iqama only applies to non-Saudi employees, and
    // this stage doesn't yet model nationality-conditional requirements
    // (that logic would live here, Master-Data-driven, in a later stage) —
    // marking it required now would incorrectly flag every Saudi employee
    // as non-compliant. An administrator can add more rows once that
    // conditional logic exists.
    record(MasterDataCategory.REQUIRED_DOCUMENT_TYPE, "nationalId", "الهوية الوطنية", "National ID"),
  ];

  await Promise.all(records.map((r) => masterDataRepository.create(r)));
}
