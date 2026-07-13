import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { WidgetContainer } from "@/shared/components/WidgetContainer";
import { Button, EmptyState } from "@/design-system/primitives";
import { widgetRegistry } from "./WidgetRegistry";

/**
 * Renders the widgets currently registered for the active layout.
 * Stage 0: layout is "all registered widgets, default order" — per-role and
 * per-user layouts (persisted via Configuration Center / User Preferences,
 * 17.10) are future work once there is more than one widget to arrange.
 *
 * MVP pass: added a Quick Actions row (Design System doc, Dashboard
 * section explicitly lists "Quick Actions" alongside KPIs/Charts/
 * Notifications) — the most common next step (register an employee)
 * shouldn't require opening the nav first.
 */
const quickActions = [
  { to: "/employees/new", labelKey: "dashboard.quickActionAddEmployee" },
  { to: "/compliance", labelKey: "dashboard.quickActionViewCompliance" },
  { to: "/reports", labelKey: "dashboard.quickActionViewReports" },
];

export function DashboardShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const widgets = widgetRegistry.list();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-pageTitle font-bold text-text-primary">{t("nav.dashboard")}</h1>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button key={action.to} variant="outline" onClick={() => navigate(action.to)}>
            {t(action.labelKey)}
          </Button>
        ))}
      </div>

      {widgets.length === 0 ? (
        <EmptyState title={t("dashboard.noWidgets")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <WidgetContainer key={widget.id} title={t(widget.titleKey)}>
              <widget.component />
            </WidgetContainer>
          ))}
        </div>
      )}
    </div>
  );
}
