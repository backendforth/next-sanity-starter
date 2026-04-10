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

        "brand-color": "var(--color-brand)",
        "accent-color": "var(--color-accent)",

        "text-color": "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "heading-color": "var(--color-heading)",
        "link-color": "var(--color-link)",
        "link-decoration": "var(--color-link-decoration)",
        "link-decoration-hover": "var(--color-link-decoration-hover)",
        "hover-color": "var(--color-hover)",
        "active-color": "var(--color-active)",

        "bg-color": "var(--color-bg)",
        "surface-muted": "var(--color-surface-muted)",
        "border-subtle": "var(--color-border-subtle)",
        "code-bg": "var(--color-code-bg)",
        "code-text": "var(--color-code-text)",

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
      height: {
        min: "var(--size-min)",
        xs: "var(--size-xs)",
        sm: "var(--size-sm)",
        md: "var(--size-md)",
        lg: "var(--size-lg)",
        xl: "var(--size-xl)",
        max: "var(--size-max)",
        extra: "var(--size-extra)",
      },
      width: {
        min: "var(--size-min)",
        xs: "var(--size-xs)",
        sm: "var(--size-sm)",
        md: "var(--size-md)",
        lg: "var(--size-lg)",
        xl: "var(--size-xl)",
        max: "var(--size-max)",
        extra: "var(--size-extra)",
        "container-gutter": "var(--container-gutter)",
      },
      spacing: {
        min: "var(--size-min)",
        xs: "var(--size-xs)",
        sm: "var(--size-sm)",
        md: "var(--size-md)",
        lg: "var(--size-lg)",
        xl: "var(--size-xl)",
        max: "var(--size-max)",
        extra: "var(--size-extra)",
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
