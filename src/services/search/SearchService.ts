import { normalizeSearchText } from "@/shared/utils/textNormalization";
import { noOpIntelligentSearch } from "./intelligentSearchBinding";

/**
 * Centralized Search service (Architecture doc "SEARCH ENGINE — create one
 * centralized search engine"). Every module's search box (shared/components/
 * SearchBox) ultimately calls through here so Arabic/English/mixed/partial
 * matching behaves identically everywhere, per 05_BUSINESS_RULES.
 *
 * `search()` is storage-agnostic: it is handed a list of already-fetched
 * candidate records and a set of fields to match against. It does not know
 * about Person/Document/Company specifically, so it can be reused by every
 * future entity type registered in the Universal Entity Engine (17.3).
 */
export async function search<T>(records: T[], query: string, fields: (keyof T)[]): Promise<T[]> {
  const trimmed = query.trim();
  if (!trimmed) return records;

  // Performance: normalize the query ONCE per call rather than once per
  // (record × field) comparison inside `textMatches` — for a few hundred
  // rows across several searchable fields that's the difference between
  // normalizing a handful of characters once vs. thousands of times per
  // keystroke.
  const normalizedQuery = normalizeSearchText(trimmed);
  const matched = records.filter((record) =>
    fields.some((field) => {
      const value = record[field];
      return typeof value === "string" && normalizeSearchText(value).includes(normalizedQuery);
    })
  );

  // Intelligent re-ranking hook (AI-Ready Architecture, 17.8) — a no-op
  // pass-through today, becomes real relevance ranking in Stage 7 without
  // this function's signature changing.
  const ids = matched.map((_, i) => String(i));
  const ranked = await noOpIntelligentSearch.rank(normalizedQuery, ids);
  return ranked.map((id) => matched[Number(id)]);
}
