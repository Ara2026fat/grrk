import { ReactNode } from "react";
import { Card } from "@/design-system/primitives";

/**
 * Shared shell for the Customizable Executive Dashboard AND the System
 * Health Center (Blueprint Standards 17.7 / 17.11 — both explicitly reuse
 * one widget framework rather than bespoke screens). A widget is just a
 * title + body inside this container; layout/ordering is handled by the
 * WidgetRegistry + DashboardShell (modules/dashboard), not by this component.
 */
interface WidgetContainerProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function WidgetContainer({ title, actions, children }: WidgetContainerProps) {
  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {actions}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}
