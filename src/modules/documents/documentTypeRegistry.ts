import type { EntityType } from "@/types/entities";

/**
 * Document Type Registry — the config that makes the Document Engine
 * generic across every entity type (Blueprint Section 6, point 3 /
 * Roadmap Phase 2). Adding a new document type — or reassigning which
 * entities it applies to — is a one-row change here, never new component
 * code. This is the direct Document-Engine analogue of how
 * `employeeSchema.ts` configures the Universal Entity Engine (17.3):
 * behavior comes from data, not from writing a new `<XyzDocumentPanel />`
 * per document type.
 *
 * `code` MUST match a Master Data record's `code` under the
 * `documentType` category (see services/data/seed.ts) — the registry
 * defines WHERE a document type can appear in the UI; Master Data (17.5)
 * remains the source of truth for what document types exist at all, per
 * the Configuration Center standard (17.10).
 *
 * Entity-type assignment below reflects a reasonable operational default
 * (e.g. Vehicle Registration/Insurance belong to the fleet-owning
 * Company/Organization, not individual Employees) — it is a config
 * decision, changeable without touching the engine.
 */
export interface DocumentTypeDefinition {
  code: string;
  titleKey: string;
  applicableEntityTypes: EntityType[];
}

export const documentTypeRegistry: DocumentTypeDefinition[] = [
  { code: "nationalId", titleKey: "documents.types.nationalId", applicableEntityTypes: ["employee"] },
  { code: "iqama", titleKey: "documents.types.iqama", applicableEntityTypes: ["employee", "contractor"] },
  {
    code: "passport",
    titleKey: "documents.types.passport",
    applicableEntityTypes: ["employee", "contractor", "visitor"],
  },
  {
    code: "drivingLicense",
    titleKey: "documents.types.drivingLicense",
    applicableEntityTypes: ["employee", "contractor"],
  },
  {
    code: "vehicleRegistration",
    titleKey: "documents.types.vehicleRegistration",
    applicableEntityTypes: ["company", "organization"],
  },
  {
    code: "vehicleInsurance",
    titleKey: "documents.types.vehicleInsurance",
    applicableEntityTypes: ["company", "organization"],
  },
  {
    code: "medicalInsurance",
    titleKey: "documents.types.medicalInsurance",
    applicableEntityTypes: ["employee", "contractor"],
  },
  { code: "workPermit", titleKey: "documents.types.workPermit", applicableEntityTypes: ["employee", "contractor"] },
  {
    code: "companyDocument",
    titleKey: "documents.types.companyDocument",
    applicableEntityTypes: ["company", "organization"],
  },
];

export function getApplicableDocumentTypes(entityType: EntityType): DocumentTypeDefinition[] {
  return documentTypeRegistry.filter((definition) => definition.applicableEntityTypes.includes(entityType));
}
