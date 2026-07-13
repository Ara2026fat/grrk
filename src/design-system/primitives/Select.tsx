import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Generic Select primitive — the form counterpart to StatusBadge's use of
 * Master Data: every master-data-backed field (profession, nationality,
 * department, document type, ...) renders through this ONE component so
 * dropdowns never diverge in style across modules (Design System
 * "Consistency Rule").
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-primary">
            {label}
            {required && <span className="text-status-expired"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={clsx(
            "rounded-md border border-surface-border bg-surface-background px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-brand-primary-300",
            error && "border-status-expired focus:ring-status-expired/40",
            className
          )}
          {...props}
        >
          <option value="">{placeholder ?? ""}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-status-expired">{error}</span>}
      </div>
    );
  }
);
Select.displayName = "Select";
