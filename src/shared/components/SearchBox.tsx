import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/design-system/primitives";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

/**
 * Global/module search box. Delegates matching to the centralized Search
 * service (services/search) — this component only captures user input and
 * debounces it. It never implements matching logic itself, so Arabic/English/
 * mixed search behaves identically everywhere it is used.
 */
export function SearchBox({ onSearch, placeholder }: SearchBoxProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  let debounceHandle: ReturnType<typeof setTimeout>;

  function handleChange(next: string) {
    setValue(next);
    clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => onSearch(next), 250);
  }

  return (
    <Input
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder ?? t("actions.search")}
      aria-label={t("actions.search")}
    />
  );
}
