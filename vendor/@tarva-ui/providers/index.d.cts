import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode } from 'react';
import { ColorScheme } from '../tokens/index.cjs';
export { useTheme } from 'next-themes';

interface ThemeContextValue {
    /** Current color scheme */
    colorScheme: ColorScheme;
    /** Update the color scheme */
    setColorScheme: (scheme: ColorScheme) => void;
}
interface ThemeProviderProps {
    children: ReactNode;
    /**
     * Color scheme for app-specific branding.
     * - 'tarva-core': Default orange/teal theme
     * - 'tarva-erp': Blue primary variant
     * - 'safetrekr': Green primary variant
     * - 'on-demand-painting': Purple primary variant
     * @default 'tarva-core'
     */
    colorScheme?: ColorScheme;
    /**
     * Default theme mode.
     * @default 'dark'
     */
    defaultTheme?: 'light' | 'dark' | 'system';
    /**
     * Force a specific theme mode (ignores user preference).
     */
    forcedTheme?: 'light' | 'dark';
    /**
     * Whether to enable system theme detection.
     * @default true
     */
    enableSystem?: boolean;
    /**
     * Storage key for persisting theme preference.
     * @default 'tarva-ui-theme'
     */
    storageKey?: string;
    /**
     * Disable transition on theme switch to prevent flash.
     * @default true
     */
    disableTransitionOnChange?: boolean;
}
/**
 * Theme provider for Tarva UI components.
 *
 * Wraps next-themes with additional colorScheme support for app variants.
 *
 * @example
 * ```tsx
 * // In your app layout
 * import { ThemeProvider } from '@tarva/ui/providers';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en" suppressHydrationWarning>
 *       <body>
 *         <ThemeProvider
 *           colorScheme="tarva-core"
 *           defaultTheme="dark"
 *           enableSystem
 *         >
 *           {children}
 *         </ThemeProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
declare function ThemeProvider({ children, colorScheme: initialScheme, defaultTheme, forcedTheme, enableSystem, storageKey, disableTransitionOnChange, }: ThemeProviderProps): react_jsx_runtime.JSX.Element;
/**
 * Hook to access Tarva theme context.
 *
 * Returns color scheme controls. For theme mode (light/dark),
 * use the re-exported `useTheme` from next-themes.
 *
 * @example
 * ```tsx
 * function ThemeSwitcher() {
 *   const { theme, setTheme } = useTheme();
 *   const { colorScheme, setColorScheme } = useTarvaTheme();
 *
 *   return (
 *     <div>
 *       <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
 *         Toggle {theme}
 *       </button>
 *       <select
 *         value={colorScheme}
 *         onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
 *       >
 *         <option value="tarva-core">Tarva Core</option>
 *         <option value="tarva-erp">Tarva ERP</option>
 *         <option value="safetrekr">Safetrekr</option>
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */
declare function useTarvaTheme(): ThemeContextValue;

export { ThemeProvider, type ThemeProviderProps, useTarvaTheme };
