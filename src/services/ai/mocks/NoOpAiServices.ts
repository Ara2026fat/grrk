import type {
  IOCRService,
  ITranscriptionService,
  ISummaryService,
  IIntelligentSearchService,
  IPredictiveComplianceService,
} from "../ai.interfaces";

/**
 * No-op / rule-based mock implementations (Blueprint 17.8: "each backed
 * today by a no-op or rule-based mock implementation"). These are what the
 * DI container binds to until real AI features are implemented in Stage 7.
 * Every mock is honest about being a mock rather than silently returning
 * fabricated-looking data, to avoid misleading callers during Stage 0–6.
 */
export const noOpOcrService: IOCRService = {
  async extractText() {
    return { text: "", confidence: 0 };
  },
};

export const noOpTranscriptionService: ITranscriptionService = {
  async transcribe() {
    return { text: "" };
  },
};

export const noOpSummaryService: ISummaryService = {
  async summarize(entries) {
    // Rule-based placeholder: naive concatenation truncation, not an AI
    // summary — clearly a stand-in until Stage 7.
    return { summary: entries.slice(0, 3).join(" ").slice(0, 240) };
  },
};

export const passthroughIntelligentSearchService: IIntelligentSearchService = {
  async rank(_query, candidateIds) {
    return candidateIds; // no re-ranking — original order preserved
  },
};

export const zeroRiskPredictiveComplianceService: IPredictiveComplianceService = {
  async predictRisk() {
    return { riskScore: 0, reasonKeys: [] };
  },
};
