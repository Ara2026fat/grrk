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

  function requestCancel() {
    if (isDirty) {
      setConfirmingDiscard(true);
    } else {
      onCancel();
    }
  }

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !confirmingDiscard) requestCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, confirmingDiscard]);
  async function onSubmit(values: T) {
    if (schema.asyncValidators?.length) {
      const errorKeys = await runAsyncValidators(values, schema.asyncValidators, { currentId: initialValues?.id });
      if (errorKeys.length > 0) {
        errorKeys.forEach((key) => setError("root", { message: key }));
        return;
      }
    }

    try {
      if (initialValues?.id) {
        const saved = await schema.repository.update(initialValues.id, values);
        showToast("success", t("messages.saved"));
        onSaved(saved);
        return;
      }

      const now = new Date().toISOString();
      const newRecord = {
        ...schema.newRecordDefaults,
        ...values,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        isActive: true,
      } as T;
      const saved = await schema.repository.create(newRecord);
      showToast("success", t("messages.created"));
      onSaved(saved);
    } catch {
      showToast("error", t("messages.saveFailed"));
    }
  }

  const sections = useMemo(() => groupFieldsBySection(schema.fields), [schema.fields]);
  let renderedFirstFieldYet = false;

  function combinedRef(rhfRef: (el: FocusableEl | null) => void, isFirst: boolean) {
    return (el: FocusableEl | null) => {
      rhfRef(el);
      if (isFirst) firstFieldRef.current = el;
    };
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <div className="flex items-center justify-between">
        <h1 className="text-pageTitle font-bold text-text-primary">{t(schema.labelKey)}</h1>
        <p className="text-xs text-text-secondary">{t("common.requiredFieldsHint")}</p>
      </div>

      {sections.map(({ section, fields }) => (
        <Card key={section ?? "__default"} className="flex flex-col gap-4">
          {section && <h2 className="text-sectionTitle font-semibold text-text-primary">{t(section)}</h2>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldError = (errors as Record<string, { message?: string }>)[field.key]
                ? t(String((errors as Record<string, { message?: string }>)[field.key]?.message))
                : undefined;
              const isFirst = !renderedFirstFieldYet;
              renderedFirstFieldYet = true;
              const { ref: rhfRef, ...registerRest } = register(field.key as never);

              if (field.kind === "select" || field.kind === "masterData") {
                const options = (field.masterDataCategory ? getByCategory(field.masterDataCategory) : []).map(
                  (record) => ({ value: record.id, label: lang === "ar" ? record.labelAr : record.labelEn })
                );
                return (
                  <Select
                    key={field.key}
                    label={t(field.labelKey)}
                    required={field.required}
                    options={options}
                    error={fieldError}
                    ref={combinedRef(rhfRef, isFirst)}
                    {...registerRest}
                  />
                );
              }

              if (field.kind === "textarea") {
                return (
                  <Textarea
                    key={field.key}
                    label={t(field.labelKey)}
                    required={field.required}
                    error={fieldError}
                    className="sm:col-span-2"
                    ref={combinedRef(rhfRef, isFirst)}
                    {...registerRest}
                  />
                );
              }

              return (
                <Input
                  key={field.key}
                  label={t(field.labelKey)}
                  required={field.required}
                  type={field.kind === "date" ? "date" : field.inputType ?? "text"}
                  autoComplete={field.autoComplete}
                  error={fieldError}
                  ref={combinedRef(rhfRef, isFirst)}
                  {...registerRest}
                />
              );
            })}
          </div>
        </Card>
      ))}

      {errors.root && <p className="text-sm text-status-expired">{t(errors.root.message ?? "")}</p>}

      <div className="sticky bottom-0 -mx-1 flex gap-2 border-t border-surface-border bg-surface-subtle px-1 py-3">
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? t("actions.save") : t("actions.create")}
        </Button>
        <Button type="button" variant="outline" onClick={requestCancel} disabled={isSubmitting}>
          {t("actions.cancel")}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmingDiscard}
        title={t("messages.confirmDiscardTitle")}
        message={t("messages.confirmDiscardMessage")}
        confirmLabel={t("actions.discard")}
        danger
        onConfirm={onCancel}
        onCancel={() => setConfirmingDiscard(false)}
      />
    </form>
  );
}
