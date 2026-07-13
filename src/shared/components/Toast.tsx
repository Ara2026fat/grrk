import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { clsx } from "clsx";

/**
 * Ephemeral UI feedback (UX polish pass: "Success messages", "Error
 * messages"). Deliberately separate from the Notification Engine
 * (services/notifications) — that system persists durable, business-level
 * notifications (document expiry, etc.) that live in a Notification
 * Center. A toast is transient interface feedback for the action someone
 * JUST took ("Employee saved") and is never persisted or queried.
 */
export type ToastTone = "success" | "error" | "info";

interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  showToast: (tone: ToastTone, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneClasses: Record<ToastTone, string> = {
  success: "border-status-valid bg-status-valid/10 text-status-valid",
  error: "border-status-expired bg-status-expired/10 text-status-expired",
  info: "border-status-information bg-status-information/10 text-status-information",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((tone: ToastTone, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, tone, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:pe-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={clsx(
              "pointer-events-auto w-full max-w-sm rounded-md border px-4 py-3 text-sm shadow-lg",
              toneClasses[toast.tone]
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
