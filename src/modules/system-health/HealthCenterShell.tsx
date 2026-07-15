import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  healthService,
  type StorageMetrics,
  type RecordMetrics,
} from "@/services/health/HealthService";

/**
 * System Health Center UI (Blueprint Standard 17.11).
 * Presents a read-only aggregation view over storage metrics, record
 * counts, audit statistics, recent errors/warnings, and background job /
 * sync / backup status — all sourced from HealthService.
 */
export function HealthCenterShell() {
  const { t } = useTranslation();

  const [storage, setStorage] = useState<StorageMetrics | null>(null);
  const [records, setRecords] = useState<RecordMetrics | null>(null);
  const [auditStats, setAuditStats] = useState<Record<string, number> | null>(null);
  const [errors, setErrors] = useState<ReturnType<typeof healthService.getRecentErrors>>([]);
  const [warnings, setWarnings] = useState<ReturnType<typeof healthService.getRecentWarnings>>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backgroundJobs = healthService.getBackgroundJobStatus();
  const syncStatus = healthService.getSyncStatus();
  const backupStatus = healthService.getBackupStatus();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [storageMetrics, recordMetrics, audit] = await Promise.all([
          healthService.getStorageMetrics(),
          healthService.getRecordMetrics(),
          healthService.getAuditStatistics(),
        ]);
        if (cancelled) return;
        setStorage(storageMetrics);
        setRecords(recordMetrics);
        setAuditStats(audit as Record<string, number>);
        setErrors(healthService.getRecentErrors());
        setWarnings(healthService.getRecentWarnings());
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-pageTitle font-bold text-text-primary">{t("systemHealth.title")}</h1>
        <p className="text-text-secondary">{t("systemHealth.subtitle")}</p>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          {t("systemHealth.loadError")}: {errorMessage}
        </div>
      )}

      {loading ? (
        <p className="text-text-secondary">{t("common.loading")}</p>
      ) : (
        <>
          {/* Record Metrics */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <MetricCard label={t("systemHealth.persons")} value={records?.persons} />
            <MetricCard label={t("systemHealth.companies")} value={records?.companies} />
            <MetricCard label={t("systemHealth.organizations")} value={records?.organizations} />
            <MetricCard label={t("systemHealth.documents")} value={records?.documents} />
            <MetricCard label={t("systemHealth.communicationEntries")} value={records?.communicationEntries} />
            <MetricCard label={t("systemHealth.masterDataRecords")} value={records?.masterDataRecords} />
          </section>

          {/* Storage */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sectionTitle font-semibold text-text-primary mb-2">
              {t("systemHealth.storage")}
            </h2>
            <p className="text-text-secondary">
              {t("systemHealth.attachmentCount")}: {storage?.attachmentCount ?? 0}
            </p>
          </section>

          {/* Audit Statistics */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sectionTitle font-semibold text-text-primary mb-2">
              {t("systemHealth.auditStatistics")}
            </h2>
            {auditStats && Object.keys(auditStats).length > 0 ? (
              <ul className="flex flex-col gap-1">
                {Object.entries(auditStats).map(([action, count]) => (
                  <li key={action} className="flex justify-between text-text-secondary">
                    <span>{action}</span>
                    <span className="font-medium text-text-primary">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">{t("systemHealth.noAuditData")}</p>
            )}
          </section>

          {/* Background Jobs / Sync / Backup */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatusCard
              title={t("systemHealth.backgroundJobs")}
              rows={[
                [t("systemHealth.notificationEvaluation"), t(backgroundJobs.notificationEvaluation)],
                [t("systemHealth.workflowSlaCheck"), t(backgroundJobs.workflowSlaCheck)],
              ]}
            />
            <StatusCard
              title={t("systemHealth.syncStatus")}
              rows={[
                [t("systemHealth.mode"), t(syncStatus.modeKey)],
                [t("systemHealth.pendingOfflineWrites"), String(syncStatus.pendingOfflineWrites)],
              ]}
            />
            <StatusCard
              title={t("systemHealth.backupStatus")}
              rows={[
                [
                  t("systemHealth.available"),
                  backupStatus.available ? t("common.yes") : t("common.no"),
                ],
                ...(!backupStatus.available
                  ? ([[t("systemHealth.reason"), t(backupStatus.reasonKey)]] as [string, string][])
                  : []),
              ]}
            />
          </section>

          {/* Errors */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sectionTitle font-semibold text-text-primary mb-2">
              {t("systemHealth.recentErrors")}
            </h2>
            {errors.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {errors.map((entry, idx) => (
                  <li key={idx} className="text-red-700 text-sm">
                    {JSON.stringify(entry)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">{t("systemHealth.noErrors")}</p>
            )}
          </section>

          {/* Warnings */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sectionTitle font-semibold text-text-primary mb-2">
              {t("systemHealth.recentWarnings")}
            </h2>
            {warnings.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {warnings.map((entry, idx) => (
                  <li key={idx} className="text-orange-700 text-sm">
                    {JSON.stringify(entry)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">{t("systemHealth.noWarnings")}</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value ?? 0}</p>
    </div>
  );
}

function StatusCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
      <ul className="flex flex-col gap-1">
        {rows.map(([label, value]) => (
          <li key={label} className="flex justify-between text-text-secondary text-sm">
            <span>{label}</span>
            <span className="text-text-primary">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
