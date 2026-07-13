/**
 * Repository-First Architecture (Blueprint 17.1).
 *
 * Generic contract every entity repository implements. Business
 * logic/services/UI depend ONLY on these interfaces — never on Dexie,
 * localStorage, or (later) a Supabase client directly.
 */
export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  filters?: Record<string, unknown>;
}

export interface QueryResult<T> {
  items: T[];
  total: number;
}

export interface IRepository<T extends { id: string }> {
  getById(id: string): Promise<T | undefined>;
  list(options?: QueryOptions): Promise<QueryResult<T>>;
  create(record: T): Promise<T>;
  update(id: string, partial: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  count(filters?: Record<string, unknown>): Promise<number>;
}
