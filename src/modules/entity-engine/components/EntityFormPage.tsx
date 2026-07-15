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
  initialValues?: Partial<T>;async function onSubmit(values: T) {
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

  /** Combines react-hook-form's ref with our own "focus this on mount"
   *  ref for exactly the first field across all sections. */
  function combinedRef(rhfRef: (el: FocusableEl | null) => void, isFirst: boolean) {
    return (el: FocusableEl | null) => {
      rhfRef(el);
      if (isFirst) firstFieldRef.
