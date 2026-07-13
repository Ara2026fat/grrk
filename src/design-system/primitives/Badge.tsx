import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-subtle text-text-secondary",
  info: "bg-status-information/10 text-status-information",
  success: "bg-status-valid/10 text-status-valid",
  warning: "bg-status-expiringSoon/10 text-status-expiringSoon",
  danger: "bg-status-expired/10 text-status-expired",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
