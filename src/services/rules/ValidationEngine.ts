import { z } from "zod";
import { personRepository } from "@/services/data/repositories";

/**
 * Validation Engine framework (05_BUSINESS_RULES "Validation Rules";
 * Architecture doc "Validation Engine ... reusable validation services").
 *
 * Two layers, deliberately kept separate:
 *  1. Schema validation (shape/format) — plain Zod schemas, reusable by
 *     React Hook Form via @hookform/resolvers/zod.
 *  2. Business/async validation (uniqueness, cross-field) — cannot be
 *     expressed as a static Zod schema because it needs repository access.
 *     Exposed as named functions so the Entity Engine can compose exactly
 *     the checks a given entity needs.
 */

export const requiredString = (messageKey = "validation.required") => z.string().min(1, messageKey);

/** Split into a reusable shape + refinement (rather than one opaque
 *  ZodEffects) specifically so other forms that need MORE fields alongside
 *  an issue/expiry pair — e.g. DocumentPanel's documentNumber — can compose
 *  them without re-deriving the date-comparison logic themselves. */
export const dateRangeShape = {
  issueDate: z.string().min(1, "validation.required"),
  expiryDate: z.string().min(1, "validation.required"),
};

export function dateRangeRefinement(val: { issueDate: string; expiryDate: string }): boolean {
  return new Date(val.issueDate).getTime() < new Date(val.expiryDate).getTime();
}

export const dateRangeSchema = z
  .object(dateRangeShape)
  .refine(dateRangeRefinement, { message: "validation.invalidDateRange", path: ["expiryDate"] });

export async function isNationalIdUnique(nationalId: string, excludeId?: string): Promise<boolean> {
  const { items } = await personRepository.list({ filters: { nationalId } });
  return items.every((p) => p.id === excludeId);
}

/**
 * Context passed alongside form values to every async validator. Stage 1
 * addition: `currentId` lets a uniqueness check exclude the record
 * currently being edited (without it, editing a record without changing
 * its National ID would incorrectly flag itself as a duplicate).
 */
export interface AsyncValidatorContext {
  currentId?: string;
}

export type AsyncValidator<TValues> = (
  values: TValues,
  context: AsyncValidatorContext
) => Promise<string | undefined>; // returns an i18n error-message key, or undefined if valid

export async function runAsyncValidators<TValues>(
  values: TValues,
  validators: AsyncValidator<TValues>[],
  context: AsyncValidatorContext = {}
): Promise<string[]> {
  const results = await Promise.all(validators.map((v) => v(values, context)));
  return results.filter((r): r is string => Boolean(r));
}
