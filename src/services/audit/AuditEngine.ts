import { db } from "@/services/data/db";
import type { AuditAction, AuditLogEntry } from "@/types/entities";
import { currentUser } from "@/services/auth/authContext";

/**
 * Audit Engine framework (Section 12 / Blueprint Standard 17.9 dependency).
 *
 * `record()` is called automatically by BaseIndexedDbRepository on every
 * write — modules and pages never call this directly for CRUD. It exists as
 * a standalone service (rather than logic baked into the repository) so
 * other engines (Workflow 17.9, System Health 17.11) can also emit audit
 * entries for events that are not simple CRUD (e.g. "workflow escalated").
 */
export interface RecordAuditInput {
  entityType: string;
  entityId: string;
  action: AuditAction;
  diff?: Record<string, { before: unknown; after: unknown }>;
}

class AuditEngine {
  async record(input: RecordAuditInput): Promise<void> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      diff: input.diff,
      userId: currentUser()?.id,
      timestamp: new Date().toISOString(),
    };
    await db.auditLog.add(entry);
  }

  async listForEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    return db.auditLog.where({ entityType, entityId }).sortBy("timestamp");
  }

  /** Used by the System Health Center (17.11) for audit statistics. */
  async countByAction(): Promise<Record<AuditAction, number>> {
    const all = await db.auditLog.toArray();
    return all.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] ?? 0) + 1;
      return acc;
    }, {} as Record<AuditAction, number>);
  }
}

export const auditEngine = new AuditEngine();
