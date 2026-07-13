import type { IReportExporter, ReportData } from "../IReportExporter";

/**
 * Stage 0 placeholder. Real implementation (Stage 5) will use jsPDF +
 * autotable per the Blueprint's technology stack recommendation, rendering
 * the standard report header (logo, title, generated-by, filters, page
 * numbers) via the shared ReportRenderer described in Blueprint Section 7.
 */
export class PdfExporter implements IReportExporter {
  readonly format = "pdf" as const;

  async export(_data: ReportData): Promise<void> {
    throw new Error("PdfExporter is a Stage 0 placeholder — implemented in Stage 5 (Reporting & Analytics).");
  }
}
