import type { ZodTypeAny } from "zod";
import type { IRepository } from "@/services/data/IRepository";
import type { AsyncValidator } from "@/services/rules/ValidationEngine";
import type { BaseRecord } from "@/types/entities";

/**
 * Universal Entity Engine (Blueprint Standard 17.3).
 *
 * Employee/Contractor/Visitor/Company/Organization are not five separate
 * codebases — each is a `EntitySchema<T>` config consumed by ONE set of
 * list/form/detail components (EntityListPage/EntityFormPage/EntityDetailPage
 * below). A future "Vendor" module becomes a new config object, not new
 * page code.
 *
 * Constrained to `BaseRecord` (not just `{ id: string }`) as of Stage 1:
 * building the first real schema (Employee) surfaced that EntityFormPage
 * needs to generate `id`/`createdAt`/`updatedAt`/`isActive` for every new
 * record — which only makes sense if every entity actually has those
 * fields. Tightening the constraint here lets the engine do that generically
 * for every future entity instead of each module reimplementing it.
 */
export interface EntityFieldDefinition<T> {
  key: keyof T & string;
  labelKey: string; // i18n key — never a literal label
  kind: "text" | "select" | "date" | "masterData" | "textarea";
  masterDataCategory?: string; // required when kind is "select" or "masterData"
  required?: boolean;
  /** UX polish pass: groups fields under a section heading in
   *  EntityFormPage (e.g. "employees.sections.identity"). Fields without a
   *  section render in a plain leading group. Purely presentational — has
   *  no effect on validation, storage, or the repository contract. */
  section?: string;
  /** UX polish pass: passed straight through to the underlying <input>'s
   *  `autoComplete` attribute so browsers can autofill (faster data entry). */
  autoComplete?: string;
  /** UX polish pass: overrides the native input `type` for `kind: "text"`
   *  fields (e.g. "email", "tel") — enables the right mobile keyboard and
   *  native browser validation without inventing a new field kind. */
  inputType?: string;
}

export interface EntityColumnDefinition<T> {
  key: keyof T & string;
  headerKey: string;
  /** Optional custom cell renderer — e.g. resolving a masterDataId to its
   *  bilingual label. Falls back to `String(row[key])` when omitted. */
  render?: (row: T) => string;
}

export interface EntitySchema<T extends BaseRecord> {
  entityKey: string; // e.g. "employee" — must match EntityType where applicable
  labelKey: string;
  repository: IRepository<T>;
  fields: EntityFieldDefinition<T>[];
  zodSchema: ZodTypeAny;
  asyncValidators?: AsyncValidator<T>[];
  searchableFields: (keyof T & string)[];
  columns: EntityColumnDefinition<T>[];
  /** Filters ALWAYS applied when listing — e.g. `{ type: "employee" }` so
   *  the shared `persons` table only shows employees on the Employee list,
   *  even though contractors/visitors live in the same table. */
  baseFilters?: Record<string, unknown>;
  /** Merged into a new record before `id`/timestamps are generated — e.g.
   *  the `{ type: "employee" }` discriminant for Person subtypes. */
  newRecordDefaults?: Partial<T>;
}
