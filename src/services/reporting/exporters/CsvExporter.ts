import type { IReportExporter, ReportData } from "../IReportExporter";

/** Simplest exporter — kept dependency-free so Stage 0 has one fully
 *  working exporter to validate the pipeline end-to-end (Blueprint Section 7). */
export class CsvExporter implements IReportExporter {
  readonly format = "csv" as const;

  async export(data: ReportData): Promise<Blob> {
    const header = data.columns.map((c) => c.header).join(",");
    const rows = data.rows.map((row) => data.columns.map((c) => JSON.stringify(row[c.key] ?? "")).join(","));
    const csv = [header, ...rows].join("\n");
    return new Blob([csv], { type: "text/csv;charset=utf-8" });
  }
}
