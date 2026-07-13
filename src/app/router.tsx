import { Routes, Route } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "./AppShell";
import { DashboardShell } from "@/modules/dashboard/DashboardShell";
import { ConfigurationCenterShell } from "@/modules/configuration-center/ConfigurationCenterShell";
import { HealthCenterShell } from "@/modules/system-health/HealthCenterShell";
import { ReportsShell } from "@/modules/reports/ReportsShell";
import { ComplianceCenterShell } from "@/modules/compliance/ComplianceCenterShell";
import { NotificationCenterShell } from "@/modules/notifications/NotificationCenterShell";
import { EmployeeListPage, EmployeeFormPage, EmployeeDetailPage } from "@/modules/employees";

/**
 * Routing architecture. Employee routes are now real (Stage 1); the
 * remaining entity types stay "coming soon" stubs until their own Stage 1+
 * schema files exist — they will reuse the exact same EntityListPage/
 * EntityFormPage/EntityDetailPage components Employee does, per the
 * Universal Entity Engine (17.3), so their routes won't need to change
 * shape either.
 */
function ComingSoon({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-pageTitle font-bold text-text-primary">{t(titleKey)}</h1>
      <p className="text-text-secondary">Stage 1+ entity module. Not yet implemented.</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardShell />} />

        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />

        <Route path="/companies" element={<ComingSoon titleKey="nav.companies" />} />
        <Route path="/organizations" element={<ComingSoon titleKey="nav.organizations" />} />
        <Route path="/contractors" element={<ComingSoon titleKey="nav.contractors" />} />
        <Route path="/visitors" element={<ComingSoon titleKey="nav.visitors" />} />

        <Route path="/reports" element={<ReportsShell />} />
        <Route path="/compliance" element={<ComplianceCenterShell />} />
        <Route path="/notifications" element={<NotificationCenterShell />} />
        <Route path="/configuration" element={<ConfigurationCenterShell />} />
        <Route path="/system-health" element={<HealthCenterShell />} />
      </Routes>
    </AppShell>
  );
}
