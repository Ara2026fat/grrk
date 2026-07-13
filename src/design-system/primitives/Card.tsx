import { HTMLAttributes } from "react";
import { clsx } from "clsx";

/**
 * Generic Card primitive. Used everywhere from dashboard widgets (17.7)
 * to entity detail panels — never restyled per-page (Design System "Cards
 * must be consistent" rule).
 */
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-surface-border bg-surface-background p-4 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
