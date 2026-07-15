import { supabase } from "@/services/data/supabaseClient";
import {
  personRepository,
  companyRepository,
  organizationRepository,
  documentRepository,
  communicationRepository,
  masterDataRepository,
} from "@/services/data/repositories";
import { auditEngine } from "@/services/audit/AuditEngine";
import { loggingService } from "@/services/logging/LoggingService";

/**
 * System Health Center foundation (Blueprint Standard 17.11).
 * Cloud Migration (Section 13): storage metrics now come from Supabase
 * Storage (attachment row count) instead of navigator.storage.estimate()
 * — that browser API only ever measured local IndexedDB usage, which is
 * no longer where the data lives. Record counts and audit statistics
 * are unchanged in shape, just sourced from Supabase-backed repositories.
 */
export interface StorageMetrics {
  attachmentCount: number;
}

export interface RecordMetrics {
  persons: number;
  companies: number;
  organizations: number;
  documents: number;
  communicationEntries: number;
  masterDataRecords: number;
}

class HealthService {
  async getStorageMetrics(): Promise<StorageMetrics> {
    const { count, error } = await supabase.from("attachments").select("*", { count: "exact", head: true });
    if (error) throw error;
    return { attachmentCount: count ?? 0 };
  }

  async getRecordMetrics(): Promise<RecordMetrics> {
    const [persons, companies, organizations, documents, communicationEntries, masterDataRecords] =
      await Promise.all([
        personRepository.count(),
        companyRepository.count(),
        organizationRepository.count(),
        documentRepository.count(),
        communicationRepository.count(),
        masterDataRepository.count(),
      ]);
    return { persons, companies, organizations, documents, communicationEntries, masterDataRecords };
  }

  async getAuditStatistics() {
    return auditEngine.countByAction();
  }

  getRecentErrors(limit = 20) {
    return loggingService.getRecent("error", limit);
  }

  getRecentWarnings(limit = 20) {
    return loggingService.getRecent("warning", limit);
  }

  /** Placeholders — real values arrive once the Notification/Workflow
   *  scheduled jobs (Stage 3/Stage 6) exist. Reserved here so the Health
   *  Center UI has a stable shape. Returns i18n KEYS, not literal English
   *  text — the UI is what translates them (never hardcode interface text). */
  getBackgroundJobStatus() {
    return { notificationEvaluation: "systemHealth.notScheduled", workflowSlaCheck: "systemHealth.notScheduled" };
  }

  getSyncStatus() {
    return { modeKey: "systemHealth.syncModeCloud", pendingOfflineWrites: 0 };
  }

  getBackupStatus() {
    return { available: false as const, reasonKey: "systemHealth.backupUnavailableReason" };
  }
}

export const healthService = new HealthService();
