import { BaseIndexedDbRepository } from "@/services/data/BaseIndexedDbRepository";
import type { Table } from "dexie";
import type { IRepository } from "@/services/data/IRepository";
import type { BaseRecord } from "@/types/entities";

/**
 * Thin factory so a new EntitySchema (17.3) never needs a hand-written
 * repository class — it just points at a Dexie table (added to db.ts) and
 * gets a fully working IRepository<T> for free, per Repository-First
 * Architecture (17.1).
 */
export function createEntityRepository<T extends BaseRecord>(
  table: Table<T, string>,
  entityType: string
): IRepository<T> {
  return new BaseIndexedDbRepository<T>(table, entityType);
}
