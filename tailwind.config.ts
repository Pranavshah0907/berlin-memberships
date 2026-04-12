import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:    "#FBF8F3",
        ink:      "#1F1B16",
        muted:    "#6F6A62",
        hairline: "#E6DFD2",
        sunrise:  "#E8933A",
        ember:    "#C15A1A",
        dawn:     "#F4B942",
        dusk:     "#8A6B3B",
        leaf:     "#5B8258",
        rust:     "#A9432A",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans:    ['"DM Sans"', "system-ui", "sans-serif"],
        mono:    ['"DM Mono"', "ui-monospace", "monospace"],
      },
      fontFeatureSettings: {
        tabular: '"tnum", "lnum"',
      },
    },
  },
  plugins: [],
} satisfies Config;
