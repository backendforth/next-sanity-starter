import type { Config } from "tailwindcss";

export default {
  darkMode: "media",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./src/assets/styles/**/*.{css,pcss}"],
  plugins: [],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: "2rem",
      },
      borderWidth: {
        DEFAULT: ".0625rem",
        0: "0",
      },
      fontFamily: {
        sans: ["var(--font-family-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-family-serif)", "ui-serif", "Georgia", "serif"],
        text: ["var(--font-family-text)", "system-ui", "sans-serif"],
        headline: ["var(--font-family-headline)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-family-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        current: "currentColor",
        transparent: "transparent",
        white: "var(--color-white)",
        black: "var(--color-black)",
        grey: "var(--color-grey)",

        "color-brand": "var(--color-brand)",
        "color-accent": "var(--color-accent)",

        "color-text": "var(--color-text)",
        "color-text-muted": "var(--color-text-muted)",
        "color-heading": "var(--color-heading)",
        "color-link": "var(--color-link)",
        "color-link-decoration": "var(--color-link-decoration)",
        "color-link-decoration-hover": "var(--color-link-decoration-hover)",
        "color-hover": "var(--color-hover)",
        "color-active": "var(--color-active)",

        "color-bg": "var(--color-bg)",
        "color-surface-muted": "var(--color-surface-muted)",
        "color-border-subtle": "var(--color-border-subtle)",
        "color-code-bg": "var(--color-code-bg)",
        "color-code-text": "var(--color-code-text)",

        error: "var(--color-error)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "3/4": "3 / 4",
        "2/1": "2 / 1",
      },
      brightness: {
        70: ".70",
      },
      /* `spacing` drives padding/margin/gap and (via Tailwind defaults) matching `w-*` / `h-*` / `max-w-*` / `min-h-*` etc. */
      spacing: {
        min: "var(--space-min)",
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
        max: "var(--space-max)",
        extra: "var(--space-extra)",
        "nav-bar": "var(--nav-bar-height)",
        "container-gutter": "var(--container-gutter)",
      },
      button: {
        primary: {
          DEFAULT: "var(--color-black)",
          hover: "var(--color-grey)",
          active: "var(--color-grey)",
          text: "var(--color-white)",
        },
      },
    },
  },
} satisfies Config;
