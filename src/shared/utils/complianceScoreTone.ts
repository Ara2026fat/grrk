import type { ComplianceScoreTone } from "@/services/rules/ComplianceRuleEngine";

/**
 * Maps the business-level compliance score tone to a literal Tailwind
 * class string. Kept separate from `ComplianceRuleEngine` (services/rules)
 * on purpose — that file computes business meaning, this one is purely
 * presentational, and Tailwind needs literal class strings at build time
 * (not ones assembled from a returned string) to include them in the
 * production CSS bundle.
 */
const toneClasses: Record<ComplianceScoreTone, string> = {
  neutral: "text-text-secondary",
  good: "text-status-valid",
  warning: "text-status-expiringSoon",
  poor: "text-status-expired",
};

export function complianceScoreToneClass(tone: ComplianceScoreTone): string {
  return toneClasses[tone];
}
