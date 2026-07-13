import { z } from "zod";
import { personRepository } from "@/services/data/repositories";
import { requiredString, isNationalIdUnique } from "@/services/rules/ValidationEngine";
import { getMasterDataLabel } from "@/services/master-data/masterDataCache";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import i18n from "@/i18n";
import type { EntitySchema } from "@/modules/entity-engine";
import type { Person } from "@/types/entities";

/**
 * Employee Management module (Roadmap Phase 1 "Employee Registration"),
 * built as ONE configuration of the Universal Entity Engine (17.3) rather
 * than a hand-written CRUD module — this file has no list/form/detail JSX
 * at all, only data-shape declarations.
 *
 * `persons` is a shared Dexie table across Employee/Contractor/Visitor
 * (Blueprint Section 5). `baseFilters: { type: "employee" }` is what keeps
 * the Employee list scoped to employees only — Contractor/Visitor modules
 * (Stage 1+) will be near-identical sibling schema files reusing the same
 * fields shape, filtered by their own `type`.
 */
const currentLang = () => (i18n.resolvedLanguage === "ar" ? "ar" : "en") as "ar" | "en";

export const employeeFormSchema = z.object({
  fullNameAr: requiredString(),
  fullNameEn: requiredString(),
  nationalId: requiredString(),
  professionMasterDataId: requiredString(),
  nationalityMasterDataId: requiredString(),
  mobileNumber: requiredString(),
  email: z.union([z.string().email("validation.invalidEmail"), z.literal("")]).optional(),
  departmentMasterDataId: z.string().optional(),
  notes: z.string().optional(),
});

export const employeeSchema: EntitySchema<Person> = {
  entityKey: "employee",
  labelKey: "nav.employees",
  repository: personRepository,
  baseFilters: { type: "employee" },
  newRecordDefaults: { type: "employee" },
  zodSchema: employeeFormSchema,
  searchableFields: ["fullNameAr", "fullNameEn", "nationalId", "mobileNumber"],

  fields: [
    {
      key: "fullNameAr",
      labelKey: "employees.fields.fullNameAr",
      kind: "text",
      required: true,
      section: "employees.sections.identity",
      autoComplete: "off",
    },
    {
      key: "fullNameEn",
      labelKey: "employees.fields.fullNameEn",
      kind: "text",
      required: true,
      section: "employees.sections.identity",
      autoComplete: "name",
    },
    {
      key: "nationalId",
      labelKey: "employees.fields.nationalId",
      kind: "text",
      required: true,
      section: "employees.sections.identity",
      autoComplete: "off",
      inputType: "text",
    },
    {
      key: "mobileNumber",
      labelKey: "employees.fields.mobileNumber",
      kind: "text",
      required: true,
      section: "employees.sections.contact",
      autoComplete: "tel",
      inputType: "tel",
    },
    {
      key: "email",
      labelKey: "employees.fields.email",
      kind: "text",
      section: "employees.sections.contact",
      autoComplete: "email",
      inputType: "email",
    },
    {
      key: "professionMasterDataId",
      labelKey: "employees.fields.profession",
      kind: "select",
      masterDataCategory: MasterDataCategory.PROFESSION,
      required: true,
      section: "employees.sections.employment",
    },
    {
      key: "nationalityMasterDataId",
      labelKey: "employees.fields.nationality",
      kind: "select",
      masterDataCategory: MasterDataCategory.NATIONALITY,
      required: true,
      section: "employees.sections.employment",
    },
    {
      key: "departmentMasterDataId",
      labelKey: "employees.fields.department",
      kind: "select",
      masterDataCategory: MasterDataCategory.DEPARTMENT,
      section: "employees.sections.employment",
    },
    { key: "notes", labelKey: "employees.fields.notes", kind: "textarea", section: "employees.sections.employment" },
  ],

  columns: [
    {
      key: "fullNameEn",
      headerKey: "employees.fields.fullNameEn",
      render: (row) => (currentLang() === "ar" ? row.fullNameAr : row.fullNameEn),
    },
    { key: "nationalId", headerKey: "employees.fields.nationalId" },
    {
      key: "professionMasterDataId",
      headerKey: "employees.fields.profession",
      render: (row) => getMasterDataLabel(row.professionMasterDataId, currentLang()),
    },
    { key: "mobileNumber", headerKey: "employees.fields.mobileNumber" },
  ],

  asyncValidators: [
    async (values, context) =>
      (await isNationalIdUnique(values.nationalId, context.currentId)) ? undefined : "validation.duplicateNationalId",
  ],
};
