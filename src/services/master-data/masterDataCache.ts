import type { MasterDataRecord } from "@/types/entities";

/**
 * A plain (non-React) read cache of Master Data, kept in sync by
 * `MasterDataProvider` every time it (re)loads. It exists for exactly one
 * reason: `EntityColumnDefinition.render` functions live in static schema
 * config files (e.g. `modules/employees/employeeSchema.ts`) that are NOT
 * React components and therefore cannot call `useMasterData()`. Everywhere
 * inside a component tree should keep using the real `useMasterData()`
 * hook — this cache is strictly a bridge for that one non-component case.
 */
let cache: MasterDataRecord[] = [];

export function setMasterDataCache(records: MasterDataRecord[]): void {
  cache = records;
}

export function getMasterDataLabel(id: string | undefined, lang: "ar" | "en"): string {
  if (!id) return "—";
  const record = cache.find((r) => r.id === id);
  if (!record) return "—";
  return lang === "ar" ? record.labelAr : record.labelEn;
}
