import { clsx } from "clsx";
import { useTranslation } from "react-i18next";

/**
 * Single loading-indicator primitive (UX polish pass). Every loading state
 * across the app — list load, form submit, detail fetch — uses this ONE
 * component so spinners never look different from screen to screen
 * (Design System "Consistency Rule"). The accessibility label is
 * translated too — "never hardcode interface text" applies to
 * screen-reader-only text just as much as visible copy.
 */
interface SpinnerProps {
  size?: "sm" | "md";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const { t } = useTranslation();
  return (
    <span
      role="status"
      aria-label={t("common.loading")}
      className={clsx(
        "inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-brand-primary-500",
        size === "sm" ? "h-4 w-4" : "h-6 w-6",
        className
      )}
    />
  );
}
