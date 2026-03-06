'use strict';

// src/tokens/index.ts
var COLORS = {
  light: {
    background: "#e8f8ff",
    foreground: "#070e16",
    primary: "#fd5b0b",
    primaryForeground: "#fefcf4",
    secondary: "#d4f3fc",
    secondaryForeground: "#52727c",
    muted: "#d5e4ec",
    mutedForeground: "#6e848f",
    accent: "#6099ab",
    accentForeground: "#030d12",
    destructive: "#ea1f2f",
    destructiveForeground: "#fefcf4",
    border: "#d5e0e6",
    input: "#d8e7f0",
    ring: "#ed835e",
    card: "#d9effb",
    cardForeground: "#070e16",
    popover: "#eafaff",
    popoverForeground: "#070e16"
  },
  dark: {
    background: "#050911",
    foreground: "#def6ff",
    primary: "#e05200",
    primaryForeground: "#fffef6",
    secondary: "#28313e",
    secondaryForeground: "#d5ecf8",
    muted: "#1c222b",
    mutedForeground: "#92a9b4",
    accent: "#277389",
    accentForeground: "#eaf7ff",
    destructive: "#ff3d42",
    destructiveForeground: "#fffef6",
    border: "#232933",
    input: "#282e38",
    ring: "#ff773c",
    card: "#0f161f",
    cardForeground: "#def6ff",
    popover: "#121720",
    popoverForeground: "#def6ff"
  },
  status: {
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
    info: "#3b82f6"
  },
  chart: {
    light: {
      1: "#fd5b0b",
      2: "#17a9cb",
      3: "#5194d5",
      4: "#35b9c0",
      5: "#6dc799"
    },
    dark: {
      1: "#ff5f00",
      2: "#00abd3",
      3: "#5194d5",
      4: "#2bb3b9",
      5: "#6dc799"
    }
  }
};
var TYPOGRAPHY = {
  fontFamily: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)"
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem"
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625
  }
};
var SPACING = {
  0: "0",
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem"
};
var RADIUS = {
  sm: "calc(var(--radius) - 4px)",
  md: "calc(var(--radius) - 2px)",
  lg: "var(--radius)",
  xl: "calc(var(--radius) + 4px)",
  full: "9999px"
};

exports.COLORS = COLORS;
exports.RADIUS = RADIUS;
exports.SPACING = SPACING;
exports.TYPOGRAPHY = TYPOGRAPHY;
//# sourceMappingURL=chunk-IRRYUBDK.cjs.map
//# sourceMappingURL=chunk-IRRYUBDK.cjs.map