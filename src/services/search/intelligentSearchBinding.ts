import { passthroughIntelligentSearchService } from "@/services/ai/mocks/NoOpAiServices";
import type { IIntelligentSearchService } from "@/services/ai/ai.interfaces";

/** Indirection point so Stage 7 can bind a real IIntelligentSearchService
 *  here without touching SearchService.ts. */
export const noOpIntelligentSearch: IIntelligentSearchService = passthroughIntelligentSearchService;
