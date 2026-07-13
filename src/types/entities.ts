/**
 * Shared entity types (Section 5 of Blueprint: "design the schema as if it
 * were relational from day one"). These types are the contract between
 * repositories, the Entity Engine, and every module — they do not change
 * based on which storage adapter is active.
 */

export type EntityType = "employee" | "contractor" | "visitor" | "company" | "organization";

export interface BilingualLabel {
  labelAr: string;
  labelEn: string;
}

/** Base fields shared by every record in the system. */
export interface BaseRecord {
  id: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
  createdBy?: string; // userId — resolved via AuthContext (Section 12)
  isActive: boolean;
}

/** Person (base) — specialized via `type`, per Section 5. */
export interface Person extends BaseRecord {
  type: Extract<EntityType, "employee" | "contractor" | "visitor">;
  fullNameAr: string;
  fullNameEn: string;
  nationalId: string;
  professionMasterDataId: string;
  nationalityMasterDataId: string;
  mobileNumber: string;
  email?: string;
  companyId?: string;
  organizationId?: string;
  departmentMasterDataId?: string;
  notes?: string;
}

export interface Company extends BaseRecord {
  type: "company";
  nameAr: string;
  nameEn: string;
  registrationNumber?: string;
  notes?: string;
}

export interface Organization extends BaseRecord {
  type: "organization";
  nameAr: string;
  nameEn: string;
  notes?: string;
}

/** Document — one polymorphic table (Section 5) referencing any entity. */
export interface DocumentRecord extends BaseRecord {
  entityType: EntityType;
  entityId: string;
  documentTypeMasterDataId: string;
  documentNumber: string;
  issueDate: string; // ISO date
  expiryDate: string; // ISO date
  attachmentIds: string[];
  notes?: string;
  // NOTE: status is intentionally NOT stored here — Blueprint Section 5:
  // "Status is always computed, never stored as truth." See services/rules.
}

export interface Attachment extends BaseRecord {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  blobKey: string; // IndexedDB blob store key (17.6)
  /** Version-history readiness (added when Attachment Preview shipped —
   *  see modules/documents/AttachmentPreviewDialog.tsx): when a "Replace"
   *  creates a new Attachment, this points at the id of the attachment it
   *  replaced. The old record is kept (soft-archived via `isActive:
   *  false`), never deleted, so the full version chain is already
   *  reconstructable by following this field. A future "Version History"
   *  screen is purely a new read — it needs no new field and no data
   *  migration, because every version ever created is already here. */
  replacesAttachmentId?: string;
}

/** Communication — one polymorphic table (Section 9). */
export type CommunicationCategory = "voiceRecording" | "meetingNote" | "internalNote";

export interface CommunicationEntry extends BaseRecord {
  entityType: EntityType | "company" | "organization";
  entityId: string;
  category: CommunicationCategory;
  description: string;
  attachmentId?: string;
  occurredAt: string; // ISO 8601
}

/** Master Data — key-value with bilingual labels (Section 10 / 17.5 / 17.10). */
export interface MasterDataRecord extends BilingualLabel, BaseRecord {
  category: string; // e.g. "profession", "documentType", "notificationRule"
  code: string; // stable machine key within the category
  metadata?: Record<string, unknown>;
  sortOrder?: number;
}

/** Audit Log — append-only (Section 12). */
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "upload"
  | "download"
  | "view"
  | "statusChange"
  | "login"
  | "logout";

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  timestamp: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
}

/** Minimal User/Role stubs (Section 12 — real auth is future). */
export interface Role {
  id: string;
  code: string;
  labelAr: string;
  labelEn: string;
  permissions: string[];
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  roleId: string;
  preferredLanguage: "ar" | "en";
}
