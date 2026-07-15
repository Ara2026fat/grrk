-- =====================================================================
-- GRRK — Indexes
-- Derived from concrete query patterns observed in the code:
--  - BaseSupabaseRepository.list()/count() filter via .eq(column, value)
--  - AuditEngine.listForEntity() filters by entityType+entityId, orders
--    by timestamp
--  - NotificationEngine.runScheduledEvaluation() filters by read=false
--    and matches on category+entityType+entityId
--  - Polymorphic entityType/entityId lookups (documents,
--    communicationEntries) are a confirmed, repeated access pattern
--    (Document tab / Communication tab per entity, Blueprint Section 6)
-- =====================================================================

-- masterData: confirmed pattern — Configuration Center / seed reads by
-- category (mirrors the "masterData_category_idx" already created by
-- the earlier setup script).
create index if not exists "masterData_category_idx"
  on "masterData" ("category");

create index if not exists "masterData_category_code_idx"
  on "masterData" ("category", "code");

-- persons: nationalId already has a unique index from the constraint
-- in 001. companyId/organizationId lookups are a direct consequence
-- of the FK relationships declared on the Person type.
create index if not exists "persons_companyId_idx"
  on "persons" ("companyId");

create index if not exists "persons_organizationId_idx"
  on "persons" ("organizationId");

create index if not exists "persons_professionMasterDataId_idx"
  on "persons" ("professionMasterDataId");

-- documents: polymorphic entity lookup — confirmed repeated access
-- pattern (Document tab attached to any entity detail page).
create index if not exists "documents_entityType_entityId_idx"
  on "documents" ("entityType", "entityId");

create index if not exists "documents_documentTypeMasterDataId_idx"
  on "documents" ("documentTypeMasterDataId");

-- communicationEntries: same polymorphic pattern as documents.
create index if not exists "communicationEntries_entityType_entityId_idx"
  on "communicationEntries" ("entityType", "entityId");

-- notifications: confirmed from NotificationEngine.runScheduledEvaluation
-- — filters unread notifications, then matches by category+entity.
create index if not exists "notifications_read_idx"
  on "notifications" ("read");

create index if not exists "notifications_category_entityType_entityId_idx"
  on "notifications" ("category", "entityType", "entityId");

-- auditLog: confirmed from AuditEngine.listForEntity() (filters by
-- entityType+entityId, orders by timestamp) and countByAction().
create index if not exists "auditLog_entityType_entityId_idx"
  on "auditLog" ("entityType", "entityId");

create index if not exists "auditLog_timestamp_idx"
  on "auditLog" ("timestamp");

create index if not exists "auditLog_action_idx"
  on "auditLog" ("action");

-- conversations / messages: FK-driven lookup pattern (a conversation's
-- messages, a contact's conversations) implied directly by the foreign
-- keys declared on these tables in 001.
create index if not exists "conversations_contactId_idx"
  on "conversations" ("contactId");

create index if not exists "messages_conversationId_idx"
  on "messages" ("conversationId");

create index if not exists "messages_contactId_idx"
  on "messages" ("contactId");

-- attachments: self-referential version chain lookup (Attachment
-- Preview / Version History, per the comment in entities.ts).
create index if not exists "attachments_replacesAttachmentId_idx"
  on "attachments" ("replacesAttachmentId");
