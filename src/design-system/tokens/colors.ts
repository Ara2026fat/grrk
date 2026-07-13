/**
 * GRRK Design System — Color Tokens
 * Source of truth for every color used in the platform (03_DESIGN_SYSTEM).
 *
 * Rule: components and pages NEVER reference raw hex values. They reference
 * a token name (e.g. `bg-status-valid`) so the entire platform can be
 * re-themed by editing this single file.
 */
export const colorTokens = {
  brand: {
    primary: {
      50: "#eef4ff",
      100: "#d9e6ff",
      300: "#7fa8f5",
      500: "#2f5fd0",
      600: "#264eab",
      700: "#1d3c85",
      900: "#132858",
    },
    secondary: {
      50: "#e9f9f2",
      300: "#5fcf9f",
      500: "#12896a",
      700: "#0c6650",
    },
  },
  surface: {
    background: "#ffffff",
    subtle: "#f5f7fa",
    border: "#e2e6ec",
  },
  status: {
    valid: "#1f9d55",
    expiringSoon: "#e08a1e",
    expired: "#dc2626",
    information: "#2f5fd0",
    inactive: "#8a94a6",
  },
  text: {
    primary: "#111827",
    secondary: "#4b5563",
    inverse: "#ffffff",
  },
} as const;

export type ColorTokens = typeof colorTokens;
