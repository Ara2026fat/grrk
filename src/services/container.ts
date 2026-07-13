import { notificationEngine } from "./notifications/NotificationEngine";
import { InAppNotificationSender } from "./notifications/senders/InAppNotificationSender";
import { documentExpiryNotificationRule } from "./notifications/rules/documentExpiryNotificationRule";
import { restrictedProfessionNotificationRule } from "./notifications/rules/restrictedProfessionNotificationRule";
import { missingDocumentNotificationRule } from "./notifications/rules/missingDocumentNotificationRule";
import { duplicateRecordNotificationRule } from "./notifications/rules/duplicateRecordNotificationRule";
import { reportingEngine } from "./reporting/ReportingEngine";
import { CsvExporter } from "./reporting/exporters/CsvExporter";
import { PdfExporter } from "./reporting/exporters/PdfExporter";
import { ExcelExporter } from "./reporting/exporters/ExcelExporter";
import { PrintExporter } from "./reporting/exporters/PrintExporter";
import { registerDefaultWidgets } from "@/modules/dashboard/registerDefaultWidgets";
import { registerDefaultReports } from "@/modules/reports/reportDefinitions";
import { seedMasterDataIfEmpty } from "./data/seed";

/**
 * Composition root. This is the ONE file that wires concrete
 * implementations into the engines' registries. It exists so that:
 *   - swapping an AI mock for a real service (17.8) only touches its
 *     binding file (e.g. services/search/intelligentSearchBinding.ts) plus,
 *     if adding a new one, one line here;
 *   - swapping the local repository adapters for Supabase adapters
 *     (Section 13) is a matter of changing services/data/repositories/index.ts,
 *     which every consumer already imports from — no changes needed here.
 *
 * `bootstrapServices()` must run once, before the app renders (see
 * main.tsx). Stage 1 makes it async: Master Data seeding (services/data/seed.ts)
 * needs to complete before any component reads it.
 */
export async function bootstrapServices(): Promise<void> {
  notificationEngine.registerSender(new InAppNotificationSender());
  notificationEngine.registerRule(documentExpiryNotificationRule);
  notificationEngine.registerRule(restrictedProfessionNotificationRule);
  notificationEngine.registerRule(missingDocumentNotificationRule);
  notificationEngine.registerRule(duplicateRecordNotificationRule);

  reportingEngine.registerExporter(new CsvExporter());
  reportingEngine.registerExporter(new PdfExporter());
  reportingEngine.registerExporter(new ExcelExporter());
  reportingEngine.registerExporter(new PrintExporter());
  registerDefaultReports();

  registerDefaultWidgets();

  await seedMasterDataIfEmpty();
}
