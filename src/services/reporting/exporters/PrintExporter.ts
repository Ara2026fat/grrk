import type { IReportExporter, ReportData } from "../IReportExporter";

/** Print uses the browser's native print dialog against a rendered
 *  ReportRenderer view — Stage 5 wires this to that component. */
export class PrintExporter implements IReportExporter {
  readonly format = "print" as const;

  async export(_data: ReportData): Promise<void> {
    window.print();
  }
}
