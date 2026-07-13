import { Badge, BadgeTone } from "./Badge";

/**
 * StatusBadge — the single component every module uses to render a document
 * or record status. Business Rules doc mandates:
 *   Expired      -> Red
 *   Expiring Soon -> Orange (within 90 days)
 *   Valid        -> Green
 * IMPORTANT: this component only *renders* a status. It never calculates
 * one — status calculation lives in /services/rules (Compliance Engine),
 * per the Architecture doc's "business rules never inside UI" mandate.
 */
export type DocumentStatus = "valid" | "expiringSoon" | "expired" | "information" | "inactive";

const toneByStatus: Record<DocumentStatus, BadgeTone> = {
  valid: "success",
  expiringSoon: "warning",
  expired: "danger",
  information: "info",
  inactive: "neutral",
};

const labelKeyByStatus: Record<DocumentStatus, string> = {
  valid: "status.valid",
  expiringSoon: "status.expiringSoon",
  expired: "status.expired",
  information: "status.information",
  inactive: "status.inactive",
};

interface StatusBadgeProps {
  status: DocumentStatus;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  // `label` is passed in already translated by the caller (via i18next `t()`)
  // so this primitive never hardcodes interface text itself.
  return <Badge tone={toneByStatus[status]}>{label ?? labelKeyByStatus[status]}</Badge>;
}
