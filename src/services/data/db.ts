import Dexie, { Table } from "dexie";
import type {
  Person,
  Company,
  Organization,
  DocumentRecord,
  Attachment,
  CommunicationEntry,
  MasterDataRecord,
  AuditLogEntry,
} from "@/types/entities";
import type { WorkflowDefinition, WorkflowInstance } from "@/services/workflow/workflow.types";
import type { NotificationRecord } from "@/services/notifications/NotificationEngine";

/**
 * GRRK IndexedDB schema (Blueprint Standard 17.6).
 *
 * This is the ONLY file in the codebase allowed to import "dexie" directly.
 * Everything else — modules, components, other services — talks to the
 * repository interfaces (IRepository.ts), never to this class. That is what
 * Repository-First Architecture (17.1) means in practice, and it is what
 * makes the Supabase/Postgres swap (Blueprint Section 13) a matter of
 * writing new adapter classes rather than touching this file's consumers.
 *
 * Binary data (attachments, voice recordings) is stored as Blob directly in
 * the `attachmentBlobs` table, keyed by `blobKey` — never in localStorage.
 */
export class GrrkDatabase extends Dexie {
  persons!: Table<Person, string>;
  companies!: Table<Company, string>;
  organizations!: Table<Organization, string>;
  documents!: Table<DocumentRecord, string>;
  attachments!: Table<Attachment, string>;
  attachmentBlobs!: Table<{ blobKey: string; blob: Blob }, string>;
  communicationEntries!: Table<CommunicationEntry, string>;
  masterData!: Table<MasterDataRecord, string>;
  auditLog!: Table<AuditLogEntry, string>;
  workflowDefinitions!: Table<WorkflowDefinition, string>;
  workflowInstances!: Table<WorkflowInstance, string>;
  /** Persisted notification records (Stage 1: the in-app sender writes
   *  here so the Notification Center / Dashboard widgets have something
   *  real to read — Stage 0 only logged to console). */
  notifications!: Table<NotificationRecord, string>;
  /** Offline write-queue (17.6): mutations captured while offline, replayed
   *  against the active repository/backend once connectivity returns. */
  offlineQueue!: Table<{ id: string; op: string; payload: unknown; queuedAt: string }, string>;

  constructor() {
    super("grrk-db");
    this.version(1).stores({
      persons: "id, type, nationalId, companyId, organizationId, isActive",
      companies: "id, isActive",
      organizations: "id, isActive",
      documents: "id, entityType, entityId, documentTypeMasterDataId, expiryDate, isActive",
      attachments: "id, isActive",
      attachmentBlobs: "blobKey",
      communicationEntries: "id, entityType, entityId, category, occurredAt",
      masterData: "id, category, code, isActive",
      auditLog: "id, entityType, entityId, action, timestamp",
      workflowDefinitions: "id, code, isActive",
      workflowInstances: "id, workflowDefinitionId, entityType, entityId, status",
      offlineQueue: "id, queuedAt",
    });
    // Standard Dexie practice: never mutate a shipped version's schema —
    // add a new version. Nobody has real data against v1 yet (Stage 0 was
    // never run against a browser), but this is the correct pattern going
    // forward for every future schema change.
    this.version(2).stores({
      notifications: "id, category, entityType, entityId, createdAt, read",
    });
  }
}

export const db = new GrrkDatabase();
