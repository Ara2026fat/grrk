/**
 * AI-Ready Architecture (Blueprint Standard 17.8).
 * Five stable interfaces, one per Roadmap Phase 9 capability. Each is
 * consumed through the same DI container as repositories (services/container.ts)
 * so a mock can be swapped for a real AI-backed implementation later with
 * zero changes to UI or business logic.
 */

/** Wired into the Document Engine's upload flow (Stage 2). */
export interface IOCRService {
  extractText(fileBlob: Blob): Promise<{ text: string; confidence: number }>;
}

/** Wired into the Communication Engine's voice recordings (Stage 4). */
export interface ITranscriptionService {
  transcribe(audioBlob: Blob, language: "ar" | "en"): Promise<{ text: string }>;
}

/** Wired into the Universal Timeline (17.4) and Communication Center. */
export interface ISummaryService {
  summarize(entries: string[], language: "ar" | "en"): Promise<{ summary: string }>;
}

/** Wired into the centralized Search service (services/search). */
export interface IIntelligentSearchService {
  rank(query: string, candidateIds: string[]): Promise<string[]>; // returns candidateIds re-ordered by relevance
}

/** Wired into the Compliance rule services (Stage 3), reading the same
 *  Master Data thresholds (17.5) a human-configured rule would use. */
export interface IPredictiveComplianceService {
  predictRisk(entityId: string): Promise<{ riskScore: number; reasonKeys: string[] }>;
}
