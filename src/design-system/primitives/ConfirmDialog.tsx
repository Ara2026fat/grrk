import { useTranslation } from "react-i18next";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Defaults to the translated "Cancel" action — override only when a
   *  call site genuinely needs different wording. */
  cancelLabel?: string;
  /** Renders the confirm button in the danger (red) variant — set this for
   *  destructive actions like Delete. Defaults to the primary variant. */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ONE confirmation-dialog pattern, built on the Stage 0 Dialog primitive,
 * reused for every "are you sure?" moment (deleting a record, discarding
 * unsaved changes, ...) so each module doesn't invent its own confirm
 * modal with a slightly different button order or wording.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel ?? t("actions.cancel")}
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-text-secondary">{message}</p>
    </Dialog>
  );
}
