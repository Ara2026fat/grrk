import type { Config } from "tailwindcss";
import { colorTokens } from "./src/design-system/tokens/colors";
import { spacingTokens } from "./src/design-system/tokens/spacing";

// Tailwind is configured to READ from the design-system tokens rather than
// duplicating the color/spacing system in a second place (Design System doc,
// "Consistency Rule": never invent different colors/spacing).
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: colorTokens,
      spacing: spacingTokens,
      fontFamily: {
        sans: ["Inter", "Tahoma", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
