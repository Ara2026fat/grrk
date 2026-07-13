/**
 * Bilingual text normalization for the centralized Search service
 * (05_BUSINESS_RULES: "Search should be fast and forgiving",
 * "Mixed language search"). Kept as pure functions so both the client-side
 * search (Phase 1) and a future server-side search index can share it.
 */
export function normalizeSearchText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // strip Arabic diacritics (tashkeel)
    .replace(/[إأآا]/g, "ا") // normalize alef variants
    .replace(/ة/g, "ه") // normalize taa marbuta
    .replace(/ى/g, "ي") // normalize alef maqsura
    .replace(/\s+/g, " ");
}

export function textMatches(haystack: string, needle: string): boolean {
  if (!needle) return true;
  return normalizeSearchText(haystack).includes(normalizeSearchText(needle));
}
