import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** "lg" for content-heavy dialogs (e.g. the Attachment Preview's PDF/image
   *  viewer) that look cramped at the default confirm-dialog width. */
  size?: "md" | "lg";
}

/**
 * Generic modal Dialog primitive. UI/UX Rule: "Avoid unnecessary dialogs" —
 * this exists so every module reuses one dialog implementation instead of
 * inventing bespoke modals with inconsistent behavior.
 */
export function Dialog({ open, title, onClose, children, footer, size = "md" }: DialogProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={clsx(
          "w-full rounded-lg bg-surface-background shadow-lg",
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="truncate text-sectionTitle font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 text-text-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-300"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-surface-border px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
