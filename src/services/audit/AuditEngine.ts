import { supabase } from "@/services/data/supabaseClient";
import type { AuditAction, AuditLogEntry } from "@/types/entities";
import { currentUser } from "@/services/auth/authContext";

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
    const { error } = await supabase.from("auditLog").insert(entry);
    if (error) throw error;
  }

  async listForEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from("auditLog")
      .select("*")
      .eq("entityType", entityType)
      .eq("entityId", entityId)
      .order("timestamp", { ascending: true });
    if (error) throw error;
    return (data as AuditLogEntry[]) ?? [];
  }

  async countByAction(): Promise<Record<string, number>> {
    const { data, error } = await supabase.from("auditLog").select("action");
    if (error) throw error;
    return ((data as { action: AuditAction }[]) ?? []).reduce((acc: Record<string, number>, entry: { action: AuditAction }) => {
      acc[entry.action] = (acc[entry.action] ?? 0) + 1;
      return acc;
    }, {});
  }
}

export const auditEngine = new AuditEngine();
