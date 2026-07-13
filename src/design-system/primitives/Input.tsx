import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

/**
 * Generic form input. Supports Arabic/English input transparently — no
 * language-specific validation lives here (07_LANGUAGE_LOCALIZATION_POLICY:
 * "business logic must never depend on a language").
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-status-expired"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={clsx(
            "rounded-md border border-surface-border px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-brand-primary-300",
            error && "border-status-expired focus:ring-status-expired/40",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-status-expired">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
