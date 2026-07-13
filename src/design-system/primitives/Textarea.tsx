import { TextareaHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

/** Generic Textarea primitive — same visual language as Input, for the
 *  "Notes" field every entity in 05_BUSINESS_RULES carries. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className, id, ...props }, ref) => {
    const areaId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-status-expired"> *</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={3}
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
Textarea.displayName = "Textarea";
