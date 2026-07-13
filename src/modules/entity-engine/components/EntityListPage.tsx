import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Table, Button } from "@/design-system/primitives";
import { SearchBox } from "@/shared/components/SearchBox";
import { search } from "@/services/search/SearchService";
import { fetchSearchableDocuments, matchDocumentNumbers } from "@/modules/documents/DocumentSearchService";
import type { EntitySchema } from "../EntitySchema.types";
import type { BaseRecord, DocumentRecord } from "@/types/entities";

interface EntityListPageProps<T extends BaseRecord> {
  schema: EntitySchema<T>;
  onCreate: () => void;
  onSelect: (row: T) => void;
}

/**
 * ONE generic list page, configured per entity via `schema`
 * (Universal Entity Engine — Blueprint 17.3). This is what replaces five
 * near-duplicate "EmployeeList / ContractorList / VisitorList / ..." pages:
 * every entity module renders <EntityListPage schema={employeeSchema} .../>
 * and gets search, table, and creation wired for free.
 *
 * Document Engine — Search Integration (Stage 2): a query also matches
 * against any document NUMBER belonging to a row's entity (e.g. finding an
 * employee by their Iqama number), OR-combined with the schema's own
 * field matches. This works for every entity generically — this component
 * has no idea what a "document" is beyond the owning entityId, which is
 * exactly the polymorphic reference every document already carries.
 *
 * MVP performance pass: both the entity rows AND the document list are
 * fetched ONCE per mount; every keystroke after that filters purely
 * in-memory (no repository round-trip), which is what actually made
 * search feel slow on a real dataset — not the matching algorithm itself.
 *
 * UX polish pass: a real loading state while the initial fetch is in
 * flight, and two distinct empty states — "nothing exists yet" (with a
 * create call-to-action) vs. "your search matched nothing".
 */
export function EntityListPage<T extends BaseRecord>({ schema, onCreate, onSelect }: EntityListPageProps<T>) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<T[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [filteredRows, setFilteredRows] = useState<T[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      schema.repository.list({ pageSize: 100, page: 1, filters: { isActive: true, ...schema.baseFilters } }),
      fetchSearchableDocuments(),
    ]).then(([entityResult, documentList]) => {
      setRows(entityResult.items);
      setDocuments(documentList);
      setLoading(false);
    });
  }, [schema]);

  useEffect(() => {
    async function runSearch() {
      const byFields = await search(rows, query, schema.searchableFields);
      const matchingEntityIds = matchDocumentNumbers(documents, query);
      if (matchingEntityIds.size === 0) {
        setFilteredRows(byFields);
        return;
      }
      const byFieldIds = new Set(byFields.map((row) => row.id));
      const byDocuments = rows.filter((row) => matchingEntityIds.has(row.id) && !byFieldIds.has(row.id));
      setFilteredRows([...byFields, ...byDocuments]);
    }
    runSearch();
  }, [rows, documents, query, schema.searchableFields]);

  const hasNoRecordsAtAll = !loading && rows.length === 0;
  const hasNoSearchMatches = !loading && rows.length > 0 && filteredRows.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-pageTitle font-bold text-text-primary">{t(schema.labelKey)}</h1>
        <Button onClick={onCreate}>{t("actions.create")}</Button>
      </div>

      {!hasNoRecordsAtAll && <SearchBox onSearch={setQuery} />}

      <Table
        columns={schema.columns.map((col) => ({
          key: col.key,
          header: t(col.headerKey),
          render: (row: T) => col.render?.(row) ?? String(row[col.key] ?? ""),
        }))}
        rows={filteredRows}
        getRowKey={(row) => row.id}
        onRowClick={onSelect}
        loading={loading}
        emptyState={
          hasNoRecordsAtAll ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <p>{t("common.emptyList")}</p>
              <Button onClick={onCreate}>{t("actions.create")}</Button>
            </div>
          ) : hasNoSearchMatches ? (
            <p>{t("common.noSearchResults")}</p>
          ) : undefined
        }
      />
    </div>
  );
}
