import type { IReportExporter, ReportData } from "../IReportExporter";

/** Stage 0 placeholder — Stage 5 implements via SheetJS (xlsx), per the
 *  Blueprint's technology stack recommendation. */
export class ExcelExporter implements IReportExporter {
  readonly format = "excel" as const;

  async export(_data: ReportData): Promise<void> {
    throw new Error("ExcelExporter is a Stage 0 placeholder — implemented in Stage 5 (Reporting & Analytics).");
  }
}
