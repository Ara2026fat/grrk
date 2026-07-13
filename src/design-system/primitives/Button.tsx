import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { Spinner } from "./Spinner";

/**
 * GRRK Design System — Button primitive.
 * Variants map 1:1 to the Design System doc button list:
 * Primary / Secondary / Danger / Success / Outline / Disabled.
 * No page should ever hand-roll a <button> with custom colors.
 *
 * `loading` (UX polish pass): shows an inline spinner and disables the
 * button, WITHOUT changing its width/height — so a slow save doesn't cause
 * the layout to jump, and the person gets immediate feedback that their
 * click registered instead of wondering if it did anything.
 */
export type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-primary-500 text-white hover:bg-brand-primary-600",
  secondary: "bg-brand-secondary-500 text-white hover:bg-brand-secondary-700",
  danger: "bg-status-expired text-white hover:opacity-90",
  success: "bg-status-valid text-white hover:opacity-90",
  outline: "bg-transparent border border-surface-border text-text-primary hover:bg-surface-subtle",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", fullWidth, loading, className, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-brand-primary-300 focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" className={variant === "outline" ? "text-text-secondary" : "text-white"} />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
