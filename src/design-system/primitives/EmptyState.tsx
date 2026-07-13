import { ReactNode } from "react";
import { Button } from "./Button";

/**
 * Reusable empty state (UX polish pass). Replaces the old bare "—" /
 * translated-search-label placeholder that Table showed when there was no
 * data — that was a leftover default, not a real empty state.
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-surface-border px-6 py-12 text-center">
      {icon && <div className="text-text-secondary">{icon}</div>}
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
