-- =====================================================================
-- GRRK — Initial Schema
-- Derived directly from src/types/entities.ts, NotificationEngine.ts,
-- AuditEngine.ts, and src/services/data/repositories/index.ts.
-- Safe to re-run (all statements are idempotent).
-- =====================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------
-- masterData (MasterDataRecord: BilingualLabel + BaseRecord)
-- -----------------------------------------------------------------
create table if not exists "masterData" (
  "id" uuid primary key default gen_random_uuid(),
  "category" text not null,
  "code" text not null,
  "labelAr" text not null,
  "labelEn" text not null,
  "metadata" jsonb,
  "sortOrder" integer,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- companies (Company: BaseRecord, literal type = "company")
-- -----------------------------------------------------------------
create table if not exists "companies" (
  "id" uuid primary key default gen_random_uuid(),
  "type" text not null default 'company' check ("type" = 'company'),
  "nameAr" text not null,
  "nameEn" text not null,
  "registrationNumber" text,
  "notes" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- organizations (Organization: BaseRecord, literal type = "organization")
-- -----------------------------------------------------------------
create table if not exists "organizations" (
  "id" uuid primary key default gen_random_uuid(),
  "type" text not null default 'organization' check ("type" = 'organization'),
  "nameAr" text not null,
  "nameEn" text not null,
  "notes" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- contacts (Contact: BaseRecord). "category" is a free-form string in
-- code (not a TS union), so no check constraint is applied here.
-- -----------------------------------------------------------------
create table if not exists "contacts" (
  "id" uuid primary key default gen_random_uuid(),
  "category" text not null,
  "fullNameAr" text not null,
  "fullNameEn" text not null,
  "mobileNumber" text,
  "notes" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- persons (Person: BaseRecord, type in employee|contractor|visitor)
-- MISSING DESIGN DECISION: unique("nationalId") is sourced from the
-- 05_BUSINESS_RULES document ("National ID must be unique"), NOT from
-- code-level validation — the repositories do not enforce this
-- programmatically today. Remove the constraint below if this is not
-- yet desired at the database level.
-- -----------------------------------------------------------------
create table if not exists "persons" (
  "id" uuid primary key default gen_random_uuid(),
  "type" text not null check ("type" in ('employee', 'contractor', 'visitor')),
  "fullNameAr" text not null,
  "fullNameEn" text not null,
  "nationalId" text not null unique,
  "professionMasterDataId" uuid not null references "masterData"("id"),
  "nationalityMasterDataId" uuid not null references "masterData"("id"),
  "mobileNumber" text not null,
  "email" text,
  "companyId" uuid references "companies"("id"),
  "organizationId" uuid references "organizations"("id"),
  "departmentMasterDataId" uuid references "masterData"("id"),
  "notes" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- attachments (Attachment: BaseRecord). Self-referential via
-- replacesAttachmentId for the version-history chain (per comment in
-- entities.ts). sizeBytes uses bigint — see Missing Design Decisions.
-- -----------------------------------------------------------------
create table if not exists "attachments" (
  "id" uuid primary key default gen_random_uuid(),
  "fileName" text not null,
  "mimeType" text not null,
  "sizeBytes" bigint not null,
  "blobKey" text not null,
  "replacesAttachmentId" uuid references "attachments"("id"),
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- documents (DocumentRecord: BaseRecord). Polymorphic entityType/
-- entityId per Blueprint Section 5. NO status column — status is
-- explicitly computed, never stored (see comment in entities.ts).
-- -----------------------------------------------------------------
create table if not exists "documents" (
  "id" uuid primary key default gen_random_uuid(),
  "entityType" text not null
    check ("entityType" in ('employee', 'contractor', 'visitor', 'company', 'organization')),
  "entityId" uuid not null,
  "documentTypeMasterDataId" uuid not null references "masterData"("id"),
  "documentNumber" text not null,
  "issueDate" date not null,
  "expiryDate" date not null,
  "attachmentIds" uuid[] not null default '{}',
  "notes" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- communicationEntries (CommunicationEntry: BaseRecord). Polymorphic
-- entityType/entityId per Blueprint Section 9.
-- -----------------------------------------------------------------
create table if not exists "communicationEntries" (
  "id" uuid primary key default gen_random_uuid(),
  "entityType" text not null
    check ("entityType" in ('employee', 'contractor', 'visitor', 'company', 'organization')),
  "entityId" uuid not null,
  "category" text not null
    check ("category" in ('voiceRecording', 'meetingNote', 'internalNote')),
  "description" text not null,
  "attachmentId" uuid references "attachments"("id"),
  "occurredAt" timestamptz not null,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- conversations (Conversation: BaseRecord)
-- -----------------------------------------------------------------
create table if not exists "conversations" (
  "id" uuid primary key default gen_random_uuid(),
  "contactId" uuid not null references "contacts"("id"),
  "lastMessageAt" timestamptz,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- messages (Message: BaseRecord)
-- -----------------------------------------------------------------
create table if not exists "messages" (
  "id" uuid primary key default gen_random_uuid(),
  "conversationId" uuid not null references "conversations"("id"),
  "contactId" uuid not null references "contacts"("id"),
  "contentType" text not null
    check ("contentType" in ('text', 'voice', 'image', 'file')),
  "text" text,
  "attachmentId" uuid references "attachments"("id"),
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "createdBy" uuid
);

-- -----------------------------------------------------------------
-- notifications (NotificationRecord — NOT a BaseRecord shape).
-- No updatedAt / createdBy / isActive: these fields do not exist on
-- NotificationRecord in NotificationEngine.ts.
-- -----------------------------------------------------------------
create table if not exists "notifications" (
  "id" uuid primary key default gen_random_uuid(),
  "category" text not null check ("category" in (
    'expired', 'expiringSoon30', 'expiringSoon60', 'expiringSoon90',
    'restrictedProfession', 'missingDocument', 'duplicateRecord', 'system'
  )),
  "entityType" text not null,
  "entityId" uuid not null,
  "titleKey" text not null,
  "detail" text,
  "createdAt" timestamptz not null default now(),
  "read" boolean not null default false
);

-- -----------------------------------------------------------------
-- auditLog (AuditLogEntry — NOT a BaseRecord shape). Written directly
-- by AuditEngine.ts via supabase.from("auditLog"), bypassing
-- BaseSupabaseRepository. entityType is intentionally UNCONSTRAINED:
-- the code passes values outside the EntityType union (e.g.
-- "attachment" from AttachmentRepository.ts), so a check constraint
-- here would break real application writes.
-- -----------------------------------------------------------------
create table if not exists "auditLog" (
  "id" uuid primary key default gen_random_uuid(),
  "entityType" text not null,
  "entityId" uuid not null,
  "action" text not null check ("action" in (
    'create', 'update', 'delete', 'upload', 'download',
    'view', 'statusChange', 'login', 'logout'
  )),
  "userId" uuid,
  "timestamp" timestamptz not null default now(),
  "diff" jsonb
);

-- -----------------------------------------------------------------
-- Storage bucket for attachment blobs (AttachmentRepository.ts:
-- supabase.storage.from(BUCKET).upload(...), BUCKET = "attachments").
-- -----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;
