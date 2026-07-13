import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { Dialog } from "@/design-system/primitives";
import { DashboardIcon, EmployeesIcon, ComplianceIcon, NotificationsIcon, MoreIcon } from "@/shared/components/NavIcons";

/**
 * Mobile-first application shell. The primary experience (per product
 * direction: company reps, contractors, and individuals on Android/iPhone
 * during their workday) is a fixed BOTTOM tab bar with five large,
 * thumb-reachable destinations — a horizontally-scrolling top strip is a
 * desktop pattern awkwardly ported to mobile, not a mobile pattern, so it's
 * gone. Everything else (Companies, Organizations, Contractors, Visitors,
 * Reports, Configuration, System Health) lives one tap away behind "More".
 *
 * At the `sm` breakpoint and up (administrators/managers on desktop), the
 * bottom bar is replaced by a traditional sidebar with everything visible
 * at once — same routes, same one URL per screen, just the layout that
 * fits a mouse and a wide screen better.
 *
 * RTL/LTR: flex row direction flips automatically under `dir="rtl"`; no
 * separate mobile-RTL handling needed.
 */
const primaryNavItems = [
  { to: "/", labelKey: "nav.dashboard", Icon: DashboardIcon },
  { to: "/employees", labelKey: "nav.employees", Icon: EmployeesIcon },
  { to: "/compliance", labelKey: "nav.compliance", Icon: ComplianceIcon },
  { to: "/notifications", labelKey: "nav.notifications", Icon: NotificationsIcon },
];

const moreNavItems = [
  { to: "/companies", labelKey: "nav.companies" },
  { to: "/organizations", labelKey: "nav.organizations" },
  { to: "/contractors", labelKey: "nav.contractors" },
  { to: "/visitors", labelKey: "nav.visitors" },
  { to: "/reports", labelKey: "nav.reports" },
];

const adminNavItems = [
  { to: "/configuration", labelKey: "nav.configuration" },
  { to: "/system-health", labelKey: "nav.systemHealth" },
];

const desktopSidebarItems = [...primaryNavItems.map(({ to, labelKey }) => ({ to, labelKey })), ...moreNavItems];

function sidebarLinkClass({ isActive }: { isActive: boolean }) {
  return clsx(
    "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
    isActive ? "bg-brand-primary-50 text-brand-primary-700" : "text-text-secondary hover:bg-surface-subtle"
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  function goTo(to: string) {
    setMoreOpen(false);
    navigate(to);
  }

  return (
    <div className="min-h-screen bg-surface-subtle sm:flex">
      {/* Desktop sidebar (sm and up) */}
      <aside className="hidden shrink-0 flex-col gap-2 border-e border-surface-border bg-surface-background p-3 sm:flex sm:w-56">
        <div className="mb-2 text-lg font-bold text-brand-primary-500">{t("app.name")}</div>
        {desktopSidebarItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={sidebarLinkClass}>
            {t(item.labelKey)}
          </NavLink>
        ))}
        <div className="mx-1 my-1 border-t border-surface-border" aria-hidden />
        {adminNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={sidebarLinkClass}>
            {t(item.labelKey)}
          </NavLink>
        ))}
        <button
          className="mt-auto rounded-md px-2 py-1 text-start text-xs text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-300"
          onClick={() => i18n.changeLanguage(i18n.resolvedLanguage === "ar" ? "en" : "ar")}
          aria-label={t("common.switchLanguage")}
        >
          {i18n.resolvedLanguage === "ar" ? "English" : "العربية"}
        </button>
      </aside>

      {/* Mobile top bar (below sm) */}
      <header className="flex items-center justify-between border-b border-surface-border bg-surface-background px-4 py-3 sm:hidden">
        <span className="text-lg font-bold text-brand-primary-500">{t("app.name")}</span>
        <button
          className="rounded-md px-2 py-1 text-xs font-medium text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-300"
          onClick={() => i18n.changeLanguage(i18n.resolvedLanguage === "ar" ? "en" : "ar")}
          aria-label={t("common.switchLanguage")}
        >
          {i18n.resolvedLanguage === "ar" ? "EN" : "AR"}
        </button>
      </header>

      <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-6">{children}</main>

      {/* Mobile bottom tab bar (below sm) — large, thumb-reachable targets */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-surface-background sm:hidden">
        {primaryNavItems.map(({ to, labelKey, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                isActive ? "text-brand-primary-600" : "text-text-secondary"
              )
            }
          >
            <Icon />
            {t(labelKey)}
          </NavLink>
        ))}
        <button
          className={clsx(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
            moreOpen ? "text-brand-primary-600" : "text-text-secondary"
          )}
          onClick={() => setMoreOpen(true)}
        >
          <MoreIcon />
          {t("nav.more")}
        </button>
      </nav>

      <Dialog open={moreOpen} title={t("nav.more")} onClose={() => setMoreOpen(false)}>
        <div className="flex flex-col gap-1">
          {moreNavItems.map((item) => (
            <button
              key={item.to}
              onClick={() => goTo(item.to)}
              className="rounded-md px-3 py-3 text-start text-sm font-medium text-text-primary hover:bg-surface-subtle"
            >
              {t(item.labelKey)}
            </button>
          ))}
          <div className="my-1 border-t border-surface-border" aria-hidden />
          {adminNavItems.map((item) => (
            <button
              key={item.to}
              onClick={() => goTo(item.to)}
              className="rounded-md px-3 py-3 text-start text-sm font-medium text-text-primary hover:bg-surface-subtle"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
