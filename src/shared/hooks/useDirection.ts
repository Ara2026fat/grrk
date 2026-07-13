import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { languageDirection, SupportedLanguage } from "@/i18n";
import { useTheme } from "@/design-system/theme";

/**
 * Synchronizes ThemeProvider.direction with the active i18next language.
 * This is the single place where "language" and "direction" are wired
 * together, per Localization Policy: "switch language without affecting
 * stored data" — direction is a pure UI derivation, never persisted as
 * business data.
 */
export function useSyncDirectionWithLanguage() {
  const { i18n } = useTranslation();
  const { setDirection } = useTheme();

  useEffect(() => {
    const lang = (i18n.resolvedLanguage ?? "ar") as SupportedLanguage;
    setDirection(languageDirection[lang] ?? "rtl");
  }, [i18n.resolvedLanguage, setDirection]);
}
