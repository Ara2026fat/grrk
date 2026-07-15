import { BaseSupabaseRepository } from "@/services/data/BaseSupabaseRepository";
import type { IRepository } from "@/services/data/IRepository";
import type { BaseRecord } from "@/types/entities";

export function createEntityRepository<T extends BaseRecord>(tableName: string, entityType: string): IRepository<T> {
  return new BaseSupabaseRepository<T>(tableName, entityType);
}
