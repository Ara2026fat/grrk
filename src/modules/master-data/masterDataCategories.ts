/**
 * Master Data CATEGORY KEYS (structural, not business data — Blueprint
 * 17.5/17.10). These are stable machine identifiers the codebase branches
 * on; the actual VALUES within each category (which companies exist, which
 * professions are restricted, what the 90-day threshold is, etc.) are data
 * rows in the masterData table, entered by administrators through the
 * Configuration Center — never hardcoded here.
 */
export const MasterDataCategory = {
  COMPANY: "company",
  ORGANIZATION: "organization",
  DEPARTMENT: "department",
  NATIONALITY: "nationality",
  PROFESSION: "profession",
  DOCUMENT_TYPE: "documentType",
  VEHICLE_TYPE: "vehicleType",
  LOCATION: "location",
  STATUS_TYPE: "statusType",
  // Extended categories per Blueprint Standard 17.10 (Configuration Center):
  NOTIFICATION_RULE: "notificationRule",
  COMPLIANCE_THRESHOLD: "complianceThreshold",
  DASHBOARD_DEFAULT: "dashboardDefault",
  EMAIL_TEMPLATE: "emailTemplate",
  // Stage 3 (Compliance Engine): a row here, keyed by a documentType code,
  // means "this document type is required wherever it's applicable" — the
  // Missing Document detection rule reads this list; it never hardcodes
  // which document types matter.
  REQUIRED_DOCUMENT_TYPE: "requiredDocumentType",
} as const;

export type MasterDataCategoryKey = (typeof MasterDataCategory)[keyof typeof MasterDataCategory];
