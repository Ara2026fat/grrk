/**
 * GRRK Design System — Spacing Tokens
 * A single 4px-based scale keeps spacing consistent across every page
 * ("White space is part of the design" — 03_DESIGN_SYSTEM).
 */
export const spacingTokens = {
  "0": "0px",
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "16": "64px",
} as const;

export type SpacingTokens = typeof spacingTokens;
