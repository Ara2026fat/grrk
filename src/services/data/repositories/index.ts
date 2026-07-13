import { db } from "../db";
import { BaseIndexedDbRepository } from "../BaseIndexedDbRepository";
import type {
  Person,
  Company,
  Organization,
  DocumentRecord,
  CommunicationEntry,
  MasterDataRecord,
} from "@/types/entities";
import type { NotificationRecord } from "@/services/notifications/NotificationEngine";

/**
 * Concrete repository instances, wired to the IndexedDB adapter.
 *
 * This is the ONE file that instantiates `BaseIndexedDbRepository` against
 * Dexie tables. When Stage 6 (Cloud Migration) begins, a parallel
 * `repositories.supabase.ts` implementing the same `IRepository<T>`
 * contracts is added here and the binding below is swapped — nothing
 * elsewhere in the app changes (Blueprint Section 13 / Standard 17.1).
 */
export const personRepository = new BaseIndexedDbRepository<Person>(db.persons, "person");
export const companyRepository = new BaseIndexedDbRepository<Company>(db.companies, "company");
export const organizationRepository = new BaseIndexedDbRepository<Organization>(db.organizations, "organization");
export const documentRepository = new BaseIndexedDbRepository<DocumentRecord>(db.documents, "document");
export const communicationRepository = new BaseIndexedDbRepository<CommunicationEntry>(
  db.communicationEntries,
  "communicationEntry"
);
export const masterDataRepository = new BaseIndexedDbRepository<MasterDataRecord>(db.masterData, "masterData");
export const notificationRepository = new BaseIndexedDbRepository<NotificationRecord>(
  db.notifications,
  "notification"
);
