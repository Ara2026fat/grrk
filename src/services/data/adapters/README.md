# Storage Adapters

Stage 0 ships one adapter: IndexedDB, via `BaseIndexedDbRepository` and
`db.ts` (Dexie schema) in the parent folder.

Per Blueprint Section 13 (Future Cloud Migration) and Standard 17.1
(Repository-First Architecture), a future Supabase-backed adapter is added
here as `SupabaseRepository.ts`, implementing the same `IRepository<T>`
contract. Only `services/data/repositories/index.ts` needs to change to
switch the binding — no UI or service code is touched.
