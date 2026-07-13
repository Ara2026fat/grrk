import type { IReportExporter, ReportData } from "./IReportExporter";

/**
 * Reporting Engine framework (Architecture doc "Reporting should be
 * independent. Every module should be able to generate reports.";
 * Blueprint Section 7).
 *
 * Stage 0 delivers the query-descriptor contract and exporter registry.
 * The standard reports themselves (Employee Report, Expired Documents,
 * etc. — 08_EXECUTIVE_REPORTING_AND_ANALYTICS) are Stage 5 work; they will
 * be registered as `ReportDefinition`s that call into each module's
 * repository, never assembling report data ad hoc from a page component.
 */
export interface ReportQueryDescriptor {
  module: string;
  filters: Record<string, unknown>;
  dateRange?: { from: string; to: string };
}

export interface ReportDefinition {
  code: string;
  titleKey: string;
  run: (query: ReportQueryDescriptor) => Promise<ReportData>;
}

class ReportingEngine {
  private exporters = new Map<string, IReportExporter>();
  private definitions = new Map<string, ReportDefinition>();

  registerExporter(exporter: IReportExporter): void {
    this.exporters.set(exporter.format, exporter);
  }

  registerReport(definition: ReportDefinition): void {
    this.definitions.set(definition.code, definition);
  }

  async generate(reportCode: string, query: ReportQueryDescriptor): Promise<ReportData> {
    const definition = this.definitions.get(reportCode);
    if (!definition) throw new Error(`Unknown report: ${reportCode}`);
    return definition.run(query);
  }

  async export(reportCode: string, query: ReportQueryDescriptor, format: IReportExporter["format"]) {
    const exporter = this.exporters.get(format);
    if (!exporter) throw new Error(`No exporter registered for format: ${format}`);
    const data = await this.generate(reportCode, query);
    return exporter.export(data);
  }
}

export const reportingEngine = new ReportingEngine();
