import { db } from "@/services/data/db";
import { auditEngine } from "@/services/audit/AuditEngine";
import { loggingService } from "@/services/logging/InMemoryLoggingService";

/**
 * System Health Center foundation (Blueprint Standard 17.11).
 *
 * Per 17.11, this service is almost entirely a READ-ONLY aggregator over
 * infrastructure defined elsewhere — it introduces no new data sources of
 * its own except by reading the logging service. Storage metrics come from
 * the IndexedDB adapter directly (Standard 17.6); record counts come from
 * the repository layer (17.1); audit stats come from the Audit Engine
 * (Section 12).
 */
export interface StorageMetrics {
  estimatedUsageBytes?: number;
  estimatedQuotaBytes?: number;
  attachmentCount: number;
  blobCount: number;
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
    const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
    const [attachmentCount, blobCount] = await Promise.all([
      db.attachments.count(),
      db.attachmentBlobs.count(),
    ]);
    return {
      estimatedUsageBytes: estimate?.usage,
      estimatedQuotaBytes: estimate?.quota,
      attachmentCount,
      blobCount,
    };
  }

  async getRecordMetrics(): Promise<RecordMetrics> {
    const [persons, companies, organizations, documents, communicationEntries, masterDataRecords] =
      await Promise.all([
        db.persons.count(),
        db.companies.count(),
        db.organizations.count(),
        db.documents.count(),
        db.communicationEntries.count(),
        db.masterData.count(),
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
   *  scheduled jobs (Stage 3/Stage 6) and Cloud Migration backups (Section
   *  13) exist. Reserved here so the Health Center UI has a stable shape.
   *  Returns i18n KEYS, not literal English text — the UI is what
   *  translates them (never hardcode interface text). */
  getBackgroundJobStatus() {
    return { notificationEvaluation: "systemHealth.notScheduled", workflowSlaCheck: "systemHealth.notScheduled" };
  }

  getSyncStatus() {
    return { modeKey: "systemHealth.syncModeLocalOnly", pendingOfflineWrites: 0 };
  }

  getBackupStatus() {
    return { available: false as const, reasonKey: "systemHealth.backupUnavailableReason" };
  }
}

export const healthService = new HealthService();
