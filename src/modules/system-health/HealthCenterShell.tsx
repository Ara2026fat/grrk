import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WidgetContainer } from "@/shared/components/WidgetContainer";
import { healthService, RecordMetrics, StorageMetrics } from "@/services/health/HealthService";

/**
 * System Health Center foundation (Blueprint Standard 17.11).
 * Built as a set of widgets, reusing the same WidgetContainer as the
 * Executive Dashboard (17.7) — "monitoring" and "executive reporting" share
 * one visual/technical pattern by design.
 */
export function HealthCenterShell() {
  const { t } = useTranslation();
  const [storage, setStorage] = useState<StorageMetrics>();
  const [records, setRecords] = useState<RecordMetrics>();
  const [auditStats, setAuditStats] = useState<Record<string, number>>();

  useEffect(() => {
    healthService.getStorageMetrics().then(setStorage);
    healthService.getRecordMetrics().then(setRecords);
    healthService.getAuditStatistics().then(setAuditStats as never);
  }, []);

  const jobs = healthService.getBackgroundJobStatus();
  const sync = healthService.getSyncStatus();
  const backup = healthService.getBackupStatus();
  const errors = healthService.getRecentErrors(5);
  const warnings = healthService.getRecentWarnings(5);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-pageTitle font-bold text-text-primary">{t("systemHealth.title")}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WidgetContainer title={t("systemHealth.storage")}>
          {storage ? (
            <ul className="text-sm text-text-secondary">
              <li>
                {t("systemHealth.attachments")}: {storage.attachmentCount}
              </li>
              <li>
                {t("systemHealth.blobs")}: {storage.blobCount}
              </li>
              <li>
                {t("systemHealth.usage")}:{" "}
                {storage.estimatedUsageBytes
                  ? `${Math.round(storage.estimatedUsageBytes / 1024)} KB`
                  : t("systemHealth.notAvailable")}
              </li>
            </ul>
          ) : (
            "…"
          )}
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.records")}>
          {records ? (
            <ul className="text-sm text-text-secondary">
              {Object.entries(records).map(([key, value]) => (
                <li key={key}>
                  {t(`systemHealth.recordLabels.${key}`)}: {value}
                </li>
              ))}
            </ul>
          ) : (
            "…"
          )}
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.backgroundJobs")}>
          <ul className="text-sm text-text-secondary">
            <li>
              {t("systemHealth.notificationEvaluation")}: {t(jobs.notificationEvaluation)}
            </li>
            <li>
              {t("systemHealth.workflowSlaCheck")}: {t(jobs.workflowSlaCheck)}
            </li>
          </ul>
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.syncStatus")}>
          <p className="text-sm text-text-secondary">
            {t("systemHealth.mode")}: {t(sync.modeKey)} · {t("systemHealth.pendingOfflineWrites")}:{" "}
            {sync.pendingOfflineWrites}
          </p>
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.backupStatus")}>
          <p className="text-sm text-text-secondary">
            {backup.available ? t("systemHealth.backupAvailable") : t(backup.reasonKey)}
          </p>
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.auditStatistics")}>
          {auditStats ? (
            <ul className="text-sm text-text-secondary">
              {Object.entries(auditStats).map(([action, count]) => (
                <li key={action}>
                  {t(`timeline.audit.${action}`)}: {count}
                </li>
              ))}
            </ul>
          ) : (
            "…"
          )}
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.errors")}>
          <ul className="text-sm text-status-expired">
            {errors.length === 0 && <li className="text-text-secondary">{t("systemHealth.none")}</li>}
            {errors.map((e) => (
              <li key={e.id}>{e.message}</li>
            ))}
          </ul>
        </WidgetContainer>

        <WidgetContainer title={t("systemHealth.warnings")}>
          <ul className="text-sm text-status-expiringSoon">
            {warnings.length === 0 && <li className="text-text-secondary">{t("systemHealth.none")}</li>}
            {warnings.map((w) => (
              <li key={w.id}>{w.message}</li>
            ))}
          </ul>
        </WidgetContainer>
      </div>
    </div>
  );
}
