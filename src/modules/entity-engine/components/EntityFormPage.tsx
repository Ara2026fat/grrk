import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button, Card, Input, Select, Textarea, ConfirmDialog } from "@/design-system/primitives";
import { runAsyncValidators } from "@/services/rules/ValidationEngine";
import { useMasterData } from "@/modules/master-data/MasterDataProvider";
import { useToast } from "@/shared/components/Toast";
import type { EntityFieldDefinition, EntitySchema } from "../EntitySchema.types";
import type { BaseRecord } from "@/types/entities";

interface EntityFormPageProps<T extends BaseRecord> {
  schema: EntitySchema<T>;
  initialValues?: Partial<T>;
  onSaved: (record: T) => void;
  onCancel: () => void;
}

type FocusableEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** Groups fields by their optional `section`, preserving first-seen order —
 *  fields without a section come first as an implicit unlabeled group. */
function groupFieldsBySection<T>(fields: EntityFieldDefinition<T>[]) {
  const order: (string | undefined)[] = [];
  const groups = new Map<string | undefined, EntityFieldDefinition<T>[]>();
  for (const field of fields) {
    if (!groups.has(field.section)) {
      groups.set(field.section, []);
      order.push(field.section);
    }
    groups.get(field.section)!.push(field);
  }
  return order.map((section) => ({ section, fields: groups.get(section)! }));
}

/**
 * ONE generic create/edit form, driven entirely by `schema.fields` and
 * `schema.zodSchema` (Universal Entity Engine — 17.3). Adding a new field
 * to an entity is a config change here, never a new form component.
 *
 * UX polish pass: sectioned 2-column responsive layout, autofocus on the
 * first field, save/error feedback via toast, and Escape-to-cancel —
 * applied here (not per-module) so every current and future entity form
 * gets it for free.
 */
export function EntityFormPage<T extends BaseRecord>({
  schema,
  initialValues,
  onSaved,
  onCancel,
}: EntityFormPageProps<T>) {
  const { t, i18n } = useTranslation();
  const { getByCategory } = useMasterData();
  const { showToast } = useToast();
  const lang = (i18n.resolvedLanguage ?? "ar") as "ar" | "en";
  const firstFieldRef = useRef<FocusableEl | null>(null);
  const isEditing = Boolean(initialValues?.id);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<T>({
    resolver: zodResolver(schema.zodSchema),
    defaultValues: initialValues as never,
  });

  /** Cancel/Escape only interrupt with a confirmation when there's
   *  something that would actually be lost — an untouched form just closes
   *  immediately, which is what people expect from a "Cancel" button. */
  function requestCancel() {
    if (isDirty) {
      setConfirmingDiscard(true);
    } else {
      onCancel();
    }
  }

  // Faster data entry: land the cursor in the first field immediately
  // instead of requiring a click before typing can start.
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  // Keyboard: Escape cancels (through the same unsaved-changes guard as the
  // Cancel button), matching the Dialog primitive's convention elsewhere in
  // the platform — one consistent "get me out of here" key.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirmingDiscard) requestCance
