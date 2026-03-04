'use client'

// Re-export from @tarva/ui with "use client" directive.
// The library's compiled chunks lose this directive during code-splitting,
// causing createContext to fail in SSR. This wrapper ensures proper client boundaries.
export { ThemeProvider, useTarvaTheme, useTheme } from '@tarva/ui/providers'
