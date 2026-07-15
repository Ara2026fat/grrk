import { supabase } from "./supabaseClient";
import type { IRepository, QueryOptions, QueryResult } from "./IRepository";
import { auditEngine } from "@/services/audit/AuditEngine";
import { isAuthenticated } from "@/services/auth/authContext";
import { diffRecords } from "@/shared/utils/diffRecords";

export class BaseSupabaseRepository<T extends { id: string }> implements IRepository<T> {
  constructor(
    private readonly tableName: string,
    private readonly entityType: string
  ) {}

  private assertAuthenticated(): void {
    if (!isAuthenticated()) {
      throw new Error(`Unauthorized: no authenticated user for write to "${this.entityType}"`);
    }
  }

  async getById(id: string): Promise<T | undefined> {
    const { data, error } = await supabase.from(this.tableName).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as T | null) ?? undefined;
  }

  async list(options: QueryOptions = {}): Promise<QueryResult<T>> {
    let query = supabase.from(this.tableName).select("*", { count: "exact" });

    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value === undefined || value === null || value === "") continue;
        query = query.eq(key, value as string | number | boolean);
      }
    }
    if (options.sortBy) {
      query = query.order(options.sortBy, { ascending: options.sortDirection !== "desc" });
    }
    if (options.page && options.pageSize) {
      const start = (options.page - 1) * options.pageSize;
      query = query.range(start, start + options.pageSize - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { items: (data as T[]) ?? [], total: count ?? 0 };
  }

  async create(record: T): Promise<T> {
    this.assertAuthenticated();
    const { data, error } = await supabase.from(this.tableName).insert(record).select().single();
    if (error) throw error;
    await auditEngine.record({ entityType: this.entityType, entityId: record.id, action: "create" });
    return data as T;
  }

  async update(id: string, partial: Partial<T>): Promise<T> {
    this.assertAuthenticated();
    const existing = await this.getById(id);
    const { data, error } = await supabase.from(this.tableName).update(partial).eq("id", id).select().single();
    if (error) throw error;
    await auditEngine.record({
      entityType: this.entityType,
      entityId: id,
      action: "update",
      diff: diffRecords(existing as Record<string, unknown>, data as Record<string, unknown>),
    });
    return data as T;
  }

  async delete(id: string): Promise<void> {
    this.assertAuthenticated();
    const { error } = await supabase.from(this.tableName).delete().eq("id", id);
    if (error) throw error;
    await auditEngine.record({ entityType: this.entityType, entityId: id, action: "delete" });
  }

  async count(filters?: Record<string, unknown>): Promise<number> {
    let query = supabase.from(this.tableName).select("*", { count: "exact", head: true });
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === "") continue;
        query = query.eq(key, value as string | number | boolean);
      }
    }
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }
}
