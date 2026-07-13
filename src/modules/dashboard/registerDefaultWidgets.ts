import { widgetRegistry } from "./WidgetRegistry";
import { ComplianceSnapshotWidget } from "./ComplianceSnapshotWidget";
import { RecentNotificationsWidget } from "./RecentNotificationsWidget";
import { ComplianceScoreWidget } from "./ComplianceScoreWidget";
import { RestrictedProfessionsWidget } from "./RestrictedProfessionsWidget";
import { MissingDocumentsWidget } from "./MissingDocumentsWidget";

/**
 * MVP cleanup: the Stage 0 "welcome" placeholder widget (which only ever
 * showed the app tagline) has been removed now that real KPI widgets
 * exist — it was explicitly scaffolding, not a feature, and kept it around
 * past its purpose would just be dead weight on a screen real users see
 * every day.
 */
export function registerDefaultWidgets(): void {
  widgetRegistry.register({
    id: "complianceScore",
    titleKey: "dashboard.complianceScore",
    component: ComplianceScoreWidget,
    defaultSize: "sm",
  });

  widgetRegistry.register({
    id: "complianceSnapshot",
    titleKey: "dashboard.complianceSnapshot",
    component: ComplianceSnapshotWidget,
    defaultSize: "sm",
  });

  widgetRegistry.register({
    id: "restrictedProfessions",
    titleKey: "dashboard.restrictedProfessions",
    component: RestrictedProfessionsWidget,
    defaultSize: "sm",
  });

  widgetRegistry.register({
    id: "missingDocuments",
    titleKey: "dashboard.missingDocuments",
    component: MissingDocumentsWidget,
    defaultSize: "sm",
  });

  widgetRegistry.register({
    id: "recentNotifications",
    titleKey: "dashboard.recentNotifications",
    component: RecentNotificationsWidget,
    defaultSize: "sm",
  });
}
