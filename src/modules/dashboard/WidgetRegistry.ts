import type { ComponentType } from "react";

/**
 * Customizable Executive Dashboard — Widget Framework (Blueprint Standard
 * 17.7). Widgets self-register here; DashboardShell renders whatever a
 * role/user's layout config lists, in order. No dashboard page hardcodes a
 * fixed set of cards.
 *
 * Real KPI/chart/notification widgets (fed by Reporting/Notification/
 * Compliance engines) are registered starting Stage 3–5, once those engines
 * have real data. Stage 0 registers a single placeholder widget so the
 * framework itself is provably working end-to-end.
 */
export interface WidgetDefinition {
  id: string;
  titleKey: string;
  component: ComponentType;
  defaultSize: "sm" | "md" | "lg";
}

class WidgetRegistry {
  private widgets = new Map<string, WidgetDefinition>();

  register(widget: WidgetDefinition): void {
    this.widgets.set(widget.id, widget);
  }

  get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  list(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }
}

export const widgetRegistry = new WidgetRegistry();
