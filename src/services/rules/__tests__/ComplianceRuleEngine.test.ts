import { describe, it, expect } from "vitest";
import { computeDocumentStatus, computeExpiryTier, getComplianceScoreTone } from "../ComplianceRuleEngine";

/**
 * MVP validation pass: these are pure functions (no IndexedDB, no React)
 * so they're cheap to test directly and are exactly the kind of
 * business-rule code the Implementation Blueprint flagged as highest-risk
 * if left untested (Section 15, risk #6).
 */
describe("computeDocumentStatus", () => {
  const reference = new Date("2026-01-01T00:00:00Z");

  it("is expired when the expiry date is in the past", () => {
    expect(computeDocumentStatus("2025-12-01", 90, reference)).toBe("expired");
  });

  it("is expiringSoon when within the warning window", () => {
    expect(computeDocumentStatus("2026-02-01", 90, reference)).toBe("expiringSoon");
  });

  it("is valid when well beyond the warning window", () => {
    expect(computeDocumentStatus("2027-01-01", 90, reference)).toBe("valid");
  });
});

describe("computeExpiryTier", () => {
  const reference = new Date("2026-01-01T00:00:00Z");
  const thresholds = { days90: 90, days60: 60, days30: 30 };

  it("escalates through tiers as the expiry date approaches", () => {
    expect(computeExpiryTier("2025-12-15", thresholds, reference)).toBe("expired");
    expect(computeExpiryTier("2026-01-20", thresholds, reference)).toBe("critical30");
    expect(computeExpiryTier("2026-02-15", thresholds, reference)).toBe("warning60");
    expect(computeExpiryTier("2026-03-15", thresholds, reference)).toBe("notice90");
    expect(computeExpiryTier("2027-01-01", thresholds, reference)).toBe("none");
  });

  it("respects administrator-configured threshold values, not hardcoded ones", () => {
    const tightThresholds = { days90: 10, days60: 5, days30: 2 };
    // 20 days out would be "notice90" under the default 90/60/30, but with
    // tightThresholds it's beyond even the widest (10-day) window.
    expect(computeExpiryTier("2026-01-21", tightThresholds, reference)).toBe("none");
  });
});

describe("getComplianceScoreTone", () => {
  it("classifies scores into the three visual bands plus 'neutral' while loading", () => {
    expect(getComplianceScoreTone(undefined)).toBe("neutral");
    expect(getComplianceScoreTone(95)).toBe("good");
    expect(getComplianceScoreTone(80)).toBe("good");
    expect(getComplianceScoreTone(79)).toBe("warning");
    expect(getComplianceScoreTone(50)).toBe("warning");
    expect(getComplianceScoreTone(49)).toBe("poor");
    expect(getComplianceScoreTone(0)).toBe("poor");
  });
});
