import { useEffect, useState } from "react";
import { computeOverallComplianceScore, getComplianceScoreTone } from "@/services/rules/ComplianceRuleEngine";
import { complianceScoreToneClass } from "@/shared/utils/complianceScoreTone";

/** Executive Compliance Widget: platform-wide Compliance Score (Executive
 *  Reporting doc "Overall Compliance %"), registered into the same widget
 *  framework as every other Dashboard card (Standard 17.7). */
export function ComplianceScoreWidget() {
  const [score, setScore] = useState<number>();

  useEffect(() => {
    computeOverallComplianceScore().then(setScore);
  }, []);

  const tone = complianceScoreToneClass(getComplianceScoreTone(score));

  return (
    <div className="flex items-center justify-center py-4">
      <span className={`text-4xl font-bold ${tone}`}>{score === undefined ? "…" : `${score}%`}</span>
    </div>
  );
}
