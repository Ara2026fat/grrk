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
 * Composition root. See original header comment in git history for full
 * rationale. `seedMasterDataIfEmpty()` is wrapped in try/catch so that a
 * Master Data seeding failure never blocks the entire app from loading —
 * it is logged instead, and the app boots with an empty Master Data set
 * that an administrator can populate via the Configuration Center.
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

  try {
    await seedMasterDataIfEmpty();
  } catch (err) {
    console.error("Master data seeding failed (non-fatal, app will continue loading):", err);
  }
}
