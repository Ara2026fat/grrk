import { ReactNode } from "react";
import { Card } from "@/design-system/primitives";

/**
 * Universal Timeline (Blueprint Standard 17.4).
 *
 * Renders ONE ordered feed for any entity, aggregating events from multiple
 * sources: Communication entries, Document status changes, Audit Log
 * entries, and Workflow step changes. This component is purely
 * presentational — event aggregation happens in a hook/service
 * (`useEntityTimeline`, to be implemented alongside the Audit/Workflow
 * engines in later stages) that queries each repository and merges by
 * timestamp. Keeping the merge logic out of this component is what lets it
 * stay reusable across every entity type without modification.
 */
export type TimelineEventKind = "communication" | "document" | "audit" | "workflow" | "notification";

export interface TimelineEvent {
  id: string;
  kind: TimelineEventKind;
  timestamp: string; // ISO 8601
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
  emptyState?: ReactNode;
}

const kindAccent: Record<TimelineEventKind, string> = {
  communication: "border-brand-primary-500",
  document: "border-status-information",
  audit: "border-text-secondary",
  workflow: "border-brand-secondary-500",
  notification: "border-status-expiringSoon",
};

export function Timeline({ events, emptyState }: TimelineProps) {
  if (events.length === 0) {
    return <Card className="text-center text-text-secondary">{emptyState ?? "—"}</Card>;
  }

  const sorted = [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <ol className="flex flex-col gap-3">
      {sorted.map((event) => (
        <li key={event.id} className={`border-s-2 ps-3 ${kindAccent[event.kind]}`}>
          <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
            {event.icon}
            {event.title}
          </div>
          {event.description && <p className="text-xs text-text-secondary">{event.description}</p>}
          <time className="text-xs text-text-secondary">{event.timestamp}</time>
        </li>
      ))}
    </ol>
  );
}
