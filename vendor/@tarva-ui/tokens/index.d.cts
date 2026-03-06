/**
 * Tarva UI Design Tokens - TypeScript exports
 *
 * Use these for programmatic access to design tokens.
 */
declare const COLORS: {
    readonly light: {
        readonly background: "#e8f8ff";
        readonly foreground: "#070e16";
        readonly primary: "#fd5b0b";
        readonly primaryForeground: "#fefcf4";
        readonly secondary: "#d4f3fc";
        readonly secondaryForeground: "#52727c";
        readonly muted: "#d5e4ec";
        readonly mutedForeground: "#6e848f";
        readonly accent: "#6099ab";
        readonly accentForeground: "#030d12";
        readonly destructive: "#ea1f2f";
        readonly destructiveForeground: "#fefcf4";
        readonly border: "#d5e0e6";
        readonly input: "#d8e7f0";
        readonly ring: "#ed835e";
        readonly card: "#d9effb";
        readonly cardForeground: "#070e16";
        readonly popover: "#eafaff";
        readonly popoverForeground: "#070e16";
    };
    readonly dark: {
        readonly background: "#050911";
        readonly foreground: "#def6ff";
        readonly primary: "#e05200";
        readonly primaryForeground: "#fffef6";
        readonly secondary: "#28313e";
        readonly secondaryForeground: "#d5ecf8";
        readonly muted: "#1c222b";
        readonly mutedForeground: "#92a9b4";
        readonly accent: "#277389";
        readonly accentForeground: "#eaf7ff";
        readonly destructive: "#ff3d42";
        readonly destructiveForeground: "#fffef6";
        readonly border: "#232933";
        readonly input: "#282e38";
        readonly ring: "#ff773c";
        readonly card: "#0f161f";
        readonly cardForeground: "#def6ff";
        readonly popover: "#121720";
        readonly popoverForeground: "#def6ff";
    };
    readonly status: {
        readonly success: "#22c55e";
        readonly warning: "#eab308";
        readonly danger: "#ef4444";
        readonly info: "#3b82f6";
    };
    readonly chart: {
        readonly light: {
            readonly 1: "#fd5b0b";
            readonly 2: "#17a9cb";
            readonly 3: "#5194d5";
            readonly 4: "#35b9c0";
            readonly 5: "#6dc799";
        };
        readonly dark: {
            readonly 1: "#ff5f00";
            readonly 2: "#00abd3";
            readonly 3: "#5194d5";
            readonly 4: "#2bb3b9";
            readonly 5: "#6dc799";
        };
    };
};
declare const TYPOGRAPHY: {
    readonly fontFamily: {
        readonly sans: "var(--font-sans)";
        readonly mono: "var(--font-mono)";
    };
    readonly fontSize: {
        readonly xs: "0.75rem";
        readonly sm: "0.875rem";
        readonly base: "1rem";
        readonly lg: "1.125rem";
        readonly xl: "1.25rem";
        readonly '2xl': "1.5rem";
        readonly '3xl': "1.875rem";
        readonly '4xl': "2.25rem";
    };
    readonly fontWeight: {
        readonly normal: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
    };
    readonly lineHeight: {
        readonly tight: 1.25;
        readonly snug: 1.375;
        readonly normal: 1.5;
        readonly relaxed: 1.625;
    };
};
declare const SPACING: {
    readonly 0: "0";
    readonly px: "1px";
    readonly 0.5: "0.125rem";
    readonly 1: "0.25rem";
    readonly 1.5: "0.375rem";
    readonly 2: "0.5rem";
    readonly 2.5: "0.625rem";
    readonly 3: "0.75rem";
    readonly 3.5: "0.875rem";
    readonly 4: "1rem";
    readonly 5: "1.25rem";
    readonly 6: "1.5rem";
    readonly 7: "1.75rem";
    readonly 8: "2rem";
    readonly 9: "2.25rem";
    readonly 10: "2.5rem";
    readonly 11: "2.75rem";
    readonly 12: "3rem";
    readonly 14: "3.5rem";
    readonly 16: "4rem";
    readonly 20: "5rem";
    readonly 24: "6rem";
};
declare const RADIUS: {
    readonly sm: "calc(var(--radius) - 4px)";
    readonly md: "calc(var(--radius) - 2px)";
    readonly lg: "var(--radius)";
    readonly xl: "calc(var(--radius) + 4px)";
    readonly full: "9999px";
};
type ColorScheme = 'tarva-core' | 'tarva-erp' | 'safetrekr' | 'on-demand-painting';
type ThemeMode = 'light' | 'dark' | 'system';

export { COLORS, type ColorScheme, RADIUS, SPACING, TYPOGRAPHY, type ThemeMode };
