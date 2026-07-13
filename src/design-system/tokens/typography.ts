/**
 * GRRK Design System — Typography Tokens
 */
export const typographyTokens = {
  fontFamily: {
    sans: "Inter, Tahoma, system-ui, sans-serif",
  },
  scale: {
    pageTitle: { size: "1.75rem", weight: 700, lineHeight: 1.2 },
    sectionTitle: { size: "1.25rem", weight: 600, lineHeight: 1.3 },
    body: { size: "0.95rem", weight: 400, lineHeight: 1.5 },
    small: { size: "0.8rem", weight: 400, lineHeight: 1.4 },
    tableText: { size: "0.875rem", weight: 400, lineHeight: 1.4 },
  },
} as const;

export type TypographyTokens = typeof typographyTokens;
