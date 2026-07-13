import { describe, it, expect } from "vitest";
import { normalizeSearchText, textMatches } from "../textNormalization";

/**
 * Blueprint risk #6 (Implementation Blueprint, Section 15): "untested
 * business-rule / utility functions are the highest-risk code in a
 * compliance platform." This is the Stage 0 seed test proving the Vitest
 * setup works end-to-end; rule-service tests (expiry calc, compliance
 * scoring) are added alongside those services in Stage 3.
 */
describe("normalizeSearchText", () => {
  it("strips Arabic diacritics and normalizes alef/taa marbuta", () => {
    expect(normalizeSearchText("مُحَمَّد")).toBe("محمد");
    expect(normalizeSearchText("إحسان")).toBe("احسان");
  });

  it("is case-insensitive for English", () => {
    expect(normalizeSearchText("Mohammed")).toBe("mohammed");
  });
});

describe("textMatches", () => {
  it("matches partial mixed-language queries", () => {
    expect(textMatches("Mohammed Ahmed", "ahmed")).toBe(true);
    expect(textMatches("محمد أحمد", "احمد")).toBe(true);
  });

  it("returns true for an empty query (no filter applied)", () => {
    expect(textMatches("anything", "")).toBe(true);
  });
});
