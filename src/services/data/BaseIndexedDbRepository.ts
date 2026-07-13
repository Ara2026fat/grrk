import type { Table } from "dexie";
import type { IRepository, QueryOptions, QueryResult } from "./IRepository";
import { auditEngine } from "@/services/audit/AuditEngine";

/**
 * Generic IndexedDB implementation of IRepository<T>, built once and reused
 * by every concrete repository (PersonRepository, DocumentRepository, ...).
 * This is what lets the Universal Entity Engine (17.3) stay storage-agnostic:
 * a new entity type only needs `new BaseIndexedDbRepository(db.someTable, "someEntity")`
 * rather than a hand-written CRUD implementation.
 *
 * Every write automatically emits an Audit Log entry (Section 12: "Every
 * repository write ... automatically emits an Audit Log entry through a
 * single interceptor") — callers never call the audit engine themselves.
 */
export class BaseIndexedDbRepository<T extends { id: string }> implements IRepository<T> {
  constructor(
    private readonly table: Table<T, string>,
    private readonly entityType: string
  ) {}

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async list(options: QueryOptions = {}): Promise<QueryResult<T>> {
    const all = await this.table.toCollection().toArray();

    let filtered = all;
    if (options.filters) {
      filtered = all.filter((item) =>
        Object.entries(options.filters!).every(([key, value]) => {
          if (value === undefined || value === null || value === "") return true;
          return (item as Record<string, unknown>)[key] === value;
        })
      );
    }

    if (options.sortBy) {
      const dir = options.sortDirection === "desc" ? -1 : 1;
      filtered = [...filtered].sort((a, b) => {
        const av = (a as Record<string, unknown>)[options.sortBy!];
        const bv = (b as Record<string, unknown>)[options.sortBy!];
        return av! > bv! ? dir : av! < bv! ? -dir : 0;
      });
    }

    const total = filtered.length;
    if (options.page && options.pageSize) {
      const start = (options.page - 1) * options.pageSize;
      filtered = filtered.slice(start, start + options.pageSize);
    }

    return { items: filtered, total };
  }

  async create(record: T): Promise<T> {
    await this.table.add(record);
    await auditEngine.record({ entityType: this.entityType, entityId: record.id, action: "create" });
    return record;
  }

  async update(id: string, partial: Partial<T>): Promise<T> {
    const before = await this.table.get(id);
    await this.table.update(id, partial as Partial<T>);
    const after = await this.table.get(id);
    await auditEngine.record({
      entityType: this.entityType,
      entityId: id,
      action: "update",
      diff: before && after ? diffRecords(before, after) : undefined,
    });
    return after as T;
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
    await auditEngine.record({ entityType: this.entityType, entityId: id, action: "delete" });
  }

  async count(filters?: Record<string, unknown>): Promise<number> {
    const { total } = await this.list({ filters, pageSize: undefined });
    return total;
  }
}

function diffRecords<T extends object>(before: T, after: T) {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  keys.forEach((key) => {
    const b = (before as Record<string, unknown>)[key];
    const a = (after as Record<string, unknown>)[key];
    if (b !== a) diff[key] = { before: b, after: a };
  });
  return diff;
}
