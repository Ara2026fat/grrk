import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/common.json";
import ar from "./locales/ar/common.json";

/**
 * Localization framework (07_LANGUAGE_LOCALIZATION_POLICY).
 *
 * Rules enforced here:
 *  - Arabic and English are both first-class (no default "fallback" language
 *    baked into components — this file is the ONLY place that decides).
 *  - All interface text is resource-driven; nothing outside this framework
 *    should contain a literal user-facing string.
 *  - The direction (RTL/LTR) is derived from the resolved language by
 *    `useLocalizedDirection` in the ThemeProvider integration, not hardcoded.
 */
export const supportedLanguages = ["ar", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageDirection: Record<SupportedLanguage, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      ar: { common: ar },
    },
    fallbackLng: "en",
    supportedLngs: supportedLanguages as unknown as string[],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
