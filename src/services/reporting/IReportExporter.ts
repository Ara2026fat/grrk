export interface ReportData {
  title: string;
  generatedBy: string;
  generatedAt: string;
  filters: Record<string, unknown>;
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}

/**
 * Export-format abstraction (Blueprint Section 7: "Export adapters are
 * format-agnostic — they consume the same normalized report data shape").
 */
export interface IReportExporter {
  readonly format: "pdf" | "excel" | "csv" | "print";
  export(data: ReportData): Promise<Blob | void>;
}
