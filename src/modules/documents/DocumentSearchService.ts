import { documentRepository } from "@/services/data/repositories";
import { textMatches } from "@/shared/utils/textNormalization";
import type { DocumentRecord } from "@/types/entities";

/**
 * Document Engine — Search Integration (05_BUSINESS_RULES: "Search by ...
 * Document Number"). Reuses the same centralized text-matching utility the
 * Search service (Stage 0) uses for names — never a second matching
 * implementation.
 *
 * Split into a fetch step and a pure, synchronous match step (MVP
 * performance pass): the original single `findEntityIdsByDocumentNumber`
 * re-queried IndexedDB for every keystroke a user typed into a list page's
 * search box. `EntityListPage` now fetches the document list ONCE per
 * mount (alongside its own entity list) and calls `matchDocumentNumbers`
 * — pure in-memory filtering — on every keystroke instead. This is
 * generic across every entity type: it returns owning entityIds
 * regardless of whether they're Employees, Contractors, Companies, etc.
 */
export async function fetchSearchableDocuments(): Promise<DocumentRecord[]> {
  const { items } = await documentRepository.list({ filters: { isActive: true } });
  return items;
}

export function matchDocumentNumbers(documents: DocumentRecord[], query: string): Set<string> {
  if (!query.trim()) return new Set();
  const matches = documents.filter((document) => textMatches(document.documentNumber, query));
  return new Set(matches.map((document) => document.entityId));
}

/** Convenience wrapper for any future one-off caller that doesn't already
 *  hold a fetched document list — NOT used by EntityListPage's hot path
 *  (see above). */
export async function findEntityIdsByDocumentNumber(query: string): Promise<Set<string>> {
  const documents = await fetchSearchableDocuments();
  return matchDocumentNumbers(documents, query);
}
