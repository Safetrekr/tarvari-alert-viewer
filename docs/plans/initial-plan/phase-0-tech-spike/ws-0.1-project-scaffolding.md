# WS-0.1: Project Scaffolding

> **Workstream ID:** WS-0.1
> **Phase:** 0 -- Tech Spike & Setup
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** None
> **Blocks:** WS-0.2, WS-0.3, WS-1.1, WS-1.2, WS-1.3, WS-1.4, WS-1.5, WS-1.6, WS-1.7
> **Resolves:** None

## 1. Objective

Initialize the Tarva Launch greenfield codebase as a fully buildable, lintable, and type-safe Next.js 16 project. Establish the directory structure defined in AD-9, wire up the Tarva ecosystem toolchain (TypeScript strict, Tailwind v4, ESLint flat config, Prettier), and integrate `@tarva/ui` so that all subsequent workstreams can begin development immediately from a known-good baseline.

**Success looks like:** An engineer clones the repo, runs `pnpm install && pnpm dev`, and sees a placeholder page rendered through the `@tarva/ui` ThemeProvider with Geist fonts, dark theme, and zero lint/type errors.

## 2. Scope

### In Scope

- Initialize pnpm project with `package.json` (scripts, dependencies, devDependencies per tech-decisions.md)
- Configure TypeScript in strict mode with `@/*` path alias (per Agent Builder pattern)
- Configure Next.js 16 App Router with `transpilePackages: ["@tarva/ui"]`
- Configure Tailwind v4 via CSS-first approach (`@tailwindcss/postcss`, `globals.css`, `@theme inline`)
- Configure ESLint 9.x flat config matching Agent Builder pattern
- Configure Prettier with `prettier-plugin-tailwindcss`
- Create full directory tree per AD-9 with `.gitkeep` placeholders
- Create root `app/layout.tsx` with `QueryClientProvider`, `ThemeProvider`, Geist fonts
- Create placeholder route files: `login/page.tsx`, `(launch)/layout.tsx`, `(launch)/page.tsx`
- Create skeleton Zustand store files for all 4 stores (camera, districts, ui, auth)
- Create `lib/utils.ts` with `cn()` helper
- Create `.env.example` with Supabase environment variable stubs
- Create `.gitignore` tailored to the project
- Create `postcss.config.mjs`
- Ensure `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm format:check` all pass

### Out of Scope

- Design token values and spatial color palette (WS-0.2)
- ZUI engine implementation or spatial math utilities (WS-0.3, WS-1.1)
- Actual component implementations in any `src/components/` subdirectory
- Supabase client configuration, auth flows, or middleware (WS-1.3 and later)
- Vitest test framework setup (will be added when first testable code arrives)
- CI/CD pipeline configuration
- Deployment configuration (Vercel, etc.)
- Ambient effects, telemetry, or any domain logic

## 3. Input Dependencies

| Dependency                        | Source                                                | Status                |
| --------------------------------- | ----------------------------------------------------- | --------------------- |
| Directory structure specification | AD-9 (Project File Structure)                         | Finalized             |
| Technology stack selections       | tech-decisions.md (Core Stack, Full Dependency List)  | Finalized             |
| Zustand store definitions         | tech-decisions.md (Zustand Store Slices)              | Finalized             |
| `@tarva/ui` library               | Local via `link:../tarva-ui-library` protocol         | Available             |
| Agent Builder reference patterns  | `/Users/jessetms/Sites/tarva-claude-agents-frontend/` | Available (read-only) |
| `@tarva/ui` source reference      | `/Users/jessetms/Sites/tarva-ui-library/`             | Available (read-only) |

## 4. Deliverables

### 4.1 Directory Structure

Create the following tree at the project root. Directories that will receive files in this workstream are marked with their file. Empty directories that exist only to establish AD-9 structure get a `.gitkeep`.

```
tarva-launch/
  .env.example
  .gitignore
  .prettierrc
  eslint.config.mjs
  next.config.ts
  package.json
  postcss.config.mjs
  tsconfig.json
  public/
    .gitkeep
  src/
    app/
      globals.css
      layout.tsx
      login/
        page.tsx
      (launch)/
        layout.tsx
        page.tsx
      api/
        telemetry/
          route.ts
    components/
      spatial/
        .gitkeep
      districts/
        .gitkeep
      stations/
        .gitkeep
      ambient/
        .gitkeep
      auth/
        .gitkeep
      telemetry/
        .gitkeep
      ui/
        .gitkeep
      providers/
        query-provider.tsx
        theme-provider.tsx
    hooks/
      .gitkeep
    stores/
      camera.store.ts
      districts.store.ts
      ui.store.ts
      auth.store.ts
    lib/
      utils.ts
      constants.ts
```

### 4.2 `package.json`

Per tech-decisions.md Core Stack and Full Dependency List. Scripts follow the Agent Builder convention.

```jsonc
{
  "name": "tarva-launch",
  "version": "0.1.0",
  "private": true,
  "license": "SEE LICENSE",
  "engines": {
    "node": ">=22.0.0",
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.91.0",
    "@tanstack/react-query": "^5.0.0",
    "@tarva/ui": "link:../tarva-ui-library",
    "clsx": "^2.1.1",
    "geist": "^1.0.0",
    "immer": "^11.1.3",
    "lucide-react": "^0.562.0",
    "motion": "^12.0.0",
    "nanoid": "^5.0.0",
    "next": "16.1.4",
    "next-themes": "^0.4.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "tailwind-merge": "^3.0.1",
    "zustand": "^5.0.10",
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@types/node": "^25.0.9",
    "@types/react": "^19.2.9",
    "@types/react-dom": "^19.2.3",
    "eslint": "^9.39.2",
    "eslint-config-next": "16.1.4",
    "prettier": "^3.8.1",
    "prettier-plugin-tailwindcss": "^0.7.2",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3",
  },
}
```

**Notes:**

- `@tarva/ui` uses `"link:../tarva-ui-library"` protocol for local development. This resolves OQ-1 by linking directly to the sibling `tarva-ui-library` repository. No registry publishing is required.
- `geist` is listed for the font package. The Agent Builder loads Geist via `next/font/google` (the `Geist` and `Geist_Mono` imports), which does not require a separate `geist` package. If `next/font/google` is used (recommended, per Agent Builder pattern), remove `geist` from dependencies.
- Version ranges match the Agent Builder reference codebase where applicable.

### 4.3 `tsconfig.json`

Matches the Agent Builder pattern exactly. TypeScript strict mode, bundler module resolution, `@/*` path alias.

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
```

### 4.4 `next.config.ts`

Minimal configuration. `transpilePackages` for `@tarva/ui` per Agent Builder pattern.

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@tarva/ui'],
}

export default nextConfig
```

### 4.5 `postcss.config.mjs`

Tailwind v4 PostCSS plugin. Matches Agent Builder exactly.

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

### 4.6 `src/app/globals.css`

CSS-first Tailwind v4 configuration. Imports `@tarva/ui/styles.css` for design tokens. Uses `@theme inline` to bridge CSS custom properties to Tailwind utility classes. Minimal Launch-specific additions -- WS-0.2 (Design Tokens Setup) will extend this with spatial-specific tokens.

```css
@import '@tarva/ui/styles.css';
@source '../../node_modules/@tarva/ui/dist/**/*.js';
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Rationale:** This is the minimal token bridge required for `@tarva/ui` components to render correctly with Tailwind v4. The `@source` directive ensures Tailwind scans `@tarva/ui` compiled output for class usage. Spatial-specific tokens (ember glow, teal accents, void backgrounds) will be added in WS-0.2.

### 4.7 `eslint.config.mjs`

ESLint 9.x flat config. Matches Agent Builder pattern.

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'coverage/**']),
])

export default eslintConfig
```

### 4.8 `.prettierrc`

Matches Agent Builder settings exactly.

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 4.9 `.gitignore`

Tailored for Next.js + pnpm + Supabase project. Based on Agent Builder `.gitignore` with Launch-specific additions.

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Next.js
.next/
out/

# Build
build/
dist/
*.tsbuildinfo
next-env.d.ts

# Environment files
.env
.env.*
!.env.example

# IDE and editors
.idea/
.vscode/
*.swp
*.swo
*~

# MCP configuration (contains local paths/keys)
.mcp.json

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Testing
coverage/

# Supabase local
.supabase/

# Vercel
.vercel/

# Secrets and credentials
*.pem
*.key

# Playwright MCP
.playwright-mcp/
```

### 4.10 `.env.example`

Environment variable stubs. Supabase credentials are required for auth and data; telemetry endpoint is optional.

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 4.11 `src/app/layout.tsx` -- Root Layout

Wires up `QueryClientProvider`, `@tarva/ui` `ThemeProvider`, and Geist fonts. Follows the Agent Builder pattern with a `"use client"` re-export wrapper for the ThemeProvider to prevent SSR issues.

Tarva Launch forces dark mode because the spatial ZUI is designed exclusively for dark backgrounds.

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Tarva Launch',
  description: 'Spatial mission control for the Tarva ecosystem',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          colorScheme="tarva-core"
          defaultTheme="dark"
          forcedTheme="dark"
          storageKey="tarva-launch-theme"
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 4.12 `src/components/providers/theme-provider.tsx`

Client-boundary re-export of `@tarva/ui` ThemeProvider. This pattern is required because `@tarva/ui`'s compiled output can lose the `"use client"` directive during code-splitting, causing `createContext` failures in SSR. Matches the Agent Builder pattern exactly.

```tsx
'use client'

// Re-export from @tarva/ui with "use client" directive.
// The library's compiled chunks lose this directive during code-splitting,
// causing createContext to fail in SSR. This wrapper ensures proper client boundaries.
export { ThemeProvider, useTarvaTheme, useTheme } from '@tarva/ui/providers'
```

### 4.13 `src/components/providers/query-provider.tsx`

Client-side TanStack Query provider. Configures sensible defaults for a real-time telemetry dashboard.

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### 4.14 `src/app/login/page.tsx` -- Login Placeholder

Minimal placeholder. Will be replaced by the theatrical login experience in WS-1.3.

```tsx
export default function LoginPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-semibold">Tarva Launch</h1>
        <p className="text-muted-foreground mt-2">Login placeholder -- WS-1.3</p>
      </div>
    </div>
  )
}
```

### 4.15 `src/app/(launch)/layout.tsx` -- Launch Route Group Layout

Auth guard placeholder. Will wrap all spatial routes with authentication verification in a later workstream.

```tsx
import type { ReactNode } from 'react'

export default function LaunchLayout({ children }: { children: ReactNode }) {
  // Auth guard will be implemented in a later workstream.
  // For now, render children directly.
  return <>{children}</>
}
```

### 4.16 `src/app/(launch)/page.tsx` -- ZUI Entry Point Placeholder

Minimal placeholder that confirms the spatial route renders. Will become the ZUI viewport in WS-0.3 / WS-1.1.

```tsx
'use client'

export default function LaunchPage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-semibold">Tarva Launch</h1>
        <p className="text-muted-foreground mt-2">ZUI entry point -- WS-0.3 / WS-1.1</p>
      </div>
    </div>
  )
}
```

### 4.17 `src/app/api/telemetry/route.ts` -- Telemetry API Placeholder

Placeholder for the server-side telemetry aggregator endpoint (per AD-9).

```ts
import { NextResponse } from 'next/server'

export async function POST() {
  // Telemetry aggregator will be implemented in WS-1.5
  return NextResponse.json({ status: 'ok' })
}
```

### 4.18 Zustand Store Skeletons

Four store files per tech-decisions.md. Each exports a typed store with the documented key state. Uses `immer` middleware for immutable updates.

#### `src/stores/camera.store.ts`

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type SemanticLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'

interface CameraState {
  offsetX: number
  offsetY: number
  zoom: number
  semanticLevel: SemanticLevel

  // Actions
  setPosition: (x: number, y: number) => void
  setZoom: (zoom: number) => void
  setSemanticLevel: (level: SemanticLevel) => void
  reset: () => void
}

const INITIAL_STATE = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
  semanticLevel: 'Z1' as SemanticLevel,
}

export const useCameraStore = create<CameraState>()(
  immer((set) => ({
    ...INITIAL_STATE,

    setPosition: (x, y) =>
      set((state) => {
        state.offsetX = x
        state.offsetY = y
      }),

    setZoom: (zoom) =>
      set((state) => {
        state.zoom = zoom
      }),

    setSemanticLevel: (level) =>
      set((state) => {
        state.semanticLevel = level
      }),

    reset: () => set(() => ({ ...INITIAL_STATE })),
  }))
)
```

#### `src/stores/districts.store.ts`

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface AppTelemetry {
  id: string
  name: string
  status: 'healthy' | 'degraded' | 'critical' | 'offline'
  lastHeartbeat: number
}

interface DistrictsState {
  districts: Record<string, AppTelemetry>

  // Actions
  setDistrict: (id: string, telemetry: AppTelemetry) => void
  removeDistrict: (id: string) => void
  clearAll: () => void
}

export const useDistrictsStore = create<DistrictsState>()(
  immer((set) => ({
    districts: {},

    setDistrict: (id, telemetry) =>
      set((state) => {
        state.districts[id] = telemetry
      }),

    removeDistrict: (id) =>
      set((state) => {
        delete state.districts[id]
      }),

    clearAll: () =>
      set((state) => {
        state.districts = {}
      }),
  }))
)
```

#### `src/stores/ui.store.ts`

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type MorphPhase = 'idle' | 'zooming' | 'morphing' | 'settling'

interface UIState {
  selectedDistrictId: string | null
  morphPhase: MorphPhase
  commandPaletteOpen: boolean

  // Actions
  selectDistrict: (id: string | null) => void
  setMorphPhase: (phase: MorphPhase) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    selectedDistrictId: null,
    morphPhase: 'idle',
    commandPaletteOpen: false,

    selectDistrict: (id) =>
      set((state) => {
        state.selectedDistrictId = id
      }),

    setMorphPhase: (phase) =>
      set((state) => {
        state.morphPhase = phase
      }),

    toggleCommandPalette: () =>
      set((state) => {
        state.commandPaletteOpen = !state.commandPaletteOpen
      }),

    setCommandPaletteOpen: (open) =>
      set((state) => {
        state.commandPaletteOpen = open
      }),
  }))
)
```

#### `src/stores/auth.store.ts`

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface AuthState {
  authenticated: boolean
  sessionKey: string | null

  // Actions
  setAuthenticated: (authenticated: boolean) => void
  setSessionKey: (key: string | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  immer((set) => ({
    authenticated: false,
    sessionKey: null,

    setAuthenticated: (authenticated) =>
      set((state) => {
        state.authenticated = authenticated
      }),

    setSessionKey: (key) =>
      set((state) => {
        state.sessionKey = key
      }),

    clearAuth: () =>
      set((state) => {
        state.authenticated = false
        state.sessionKey = null
      }),
  }))
)
```

### 4.19 `src/lib/utils.ts`

Standard `cn()` utility for conditional Tailwind class merging. Re-exports `clsx` and `tailwind-merge` as a single function for convenience.

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4.20 `src/lib/constants.ts`

Central constants file. Starts minimal, will grow as workstreams add domain constants.

```ts
/**
 * Application-wide constants for Tarva Launch.
 *
 * Spatial constants (viewport bounds, zoom levels, etc.) will be added
 * by WS-0.3 / WS-1.1 when the ZUI engine is implemented.
 */

export const APP_NAME = 'Tarva Launch'
export const APP_DESCRIPTION = 'Spatial mission control for the Tarva ecosystem'
```

## 5. Acceptance Criteria

All criteria must pass before WS-0.1 is marked complete.

| #     | Criterion                                                                                                           | Verification                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| AC-1  | `pnpm install` completes with zero errors and no unresolved peer dependency warnings for direct dependencies        | Run `pnpm install` in a clean clone                                        |
| AC-2  | `pnpm dev` starts the Next.js dev server and the `(launch)/page.tsx` placeholder renders at `http://localhost:3000` | Navigate to localhost:3000 in a browser                                    |
| AC-3  | `pnpm build` completes with zero errors                                                                             | Run `pnpm build` and confirm exit code 0                                   |
| AC-4  | `pnpm lint` passes with zero errors                                                                                 | Run `pnpm lint` and confirm clean output                                   |
| AC-5  | `pnpm typecheck` passes with zero TypeScript errors                                                                 | Run `pnpm typecheck` and confirm exit code 0                               |
| AC-6  | `pnpm format:check` passes with zero formatting violations                                                          | Run `pnpm format:check` and confirm clean output                           |
| AC-7  | All directories in the AD-9 structure exist                                                                         | Verify with `find src -type d`                                             |
| AC-8  | All 4 Zustand stores are importable without errors                                                                  | Import each store in a test file or verify via `pnpm typecheck`            |
| AC-9  | `@tarva/ui` ThemeProvider renders (dark mode forced, Geist fonts applied)                                           | Visual inspection of the rendered placeholder page                         |
| AC-10 | `@/*` path alias resolves correctly in imports                                                                      | Confirmed implicitly by AC-3 and AC-5 (layout.tsx uses `@/components/...`) |
| AC-11 | `.env.example` exists with documented Supabase variable stubs                                                       | File inspection                                                            |
| AC-12 | The `login/` route renders its placeholder at `/login`                                                              | Navigate to `http://localhost:3000/login`                                  |

## 6. Decisions Made

| #   | Decision                                                                          | Rationale                                                                                                                                                                                | Source                                                      |
| --- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| D-1 | Force dark mode via `ThemeProvider forcedTheme="dark"`                            | Tarva Launch is a spatial ZUI designed exclusively for dark backgrounds. Light mode is not part of the design spec.                                                                      | VISUAL-DESIGN-SPEC.md                                       |
| D-2 | Use `next/font/google` for Geist fonts (not the `geist` npm package)              | Matches the Agent Builder pattern, enables Next.js font optimization (preload, no layout shift), and avoids an unnecessary dependency.                                                   | Agent Builder `app/layout.tsx`                              |
| D-3 | Re-export `ThemeProvider` through a `"use client"` wrapper                        | `@tarva/ui` compiled chunks can lose the `"use client"` directive during code-splitting, causing `createContext` to fail in SSR. This is the established pattern in the Agent Builder.   | Agent Builder `src/components/providers/theme-provider.tsx` |
| D-4 | Use `@tarva/ui` CSS-first Tailwind v4 integration pattern                         | Tailwind v4 uses `@theme inline` in CSS instead of `tailwind.config.ts`. The `@source` directive scans `@tarva/ui` dist for class usage. This matches the Agent Builder's `globals.css`. | Agent Builder `globals.css`                                 |
| D-5 | Use `immer` middleware for all Zustand stores                                     | Enables immutable state updates with mutable syntax, reducing boilerplate and preventing accidental mutations. Listed in tech-decisions.md as a required dependency.                     | tech-decisions.md                                           |
| D-6 | No `pnpm-workspace.yaml` (standalone project)                                     | Tarva Launch is a standalone repo, not a monorepo. `@tarva/ui` is consumed via `link:` protocol pointing to the sibling `tarva-ui-library` directory, not via workspace protocol.        | Project structure                                           |
| D-7 | Prettier settings: no semicolons, single quotes, trailing commas in ES5 positions | Matches the Agent Builder's `.prettierrc` for ecosystem consistency.                                                                                                                     | Agent Builder `.prettierrc`                                 |
| D-8 | `staleTime: 30s` for TanStack Query default                                       | Balances freshness for telemetry data with avoiding unnecessary refetches. Can be overridden per-query.                                                                                  | Engineering judgment                                        |
| D-9 | Separate `providers/` directory under `components/` (not co-located in `app/`)    | Provider components are shared infrastructure, not route-specific. Keeps `app/` clean for routing concerns. Matches Agent Builder pattern.                                               | Agent Builder directory structure                           |

## 7. Open Questions

| #    | Question                                                                                                                                                                                 | Impact                                                           | Owner                    | Resolution Deadline          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------ | ---------------------------- |
| OQ-1 | ~~How will `@tarva/ui` be installed?~~ **RESOLVED:** Use `"link:../tarva-ui-library"` protocol. The sibling `tarva-ui-library` directory is the source. No registry publishing required. | Affects `package.json` dependency declaration and CI setup       | Project Lead             | **Resolved**                 |
| OQ-2 | Should `tw-animate-css` be included as a dependency? The Agent Builder uses it, but Tarva Launch may use `motion` (Framer Motion) exclusively for animations.                            | Affects `package.json` devDependencies and `globals.css` imports | Design / React Developer | WS-0.2 (Design Tokens Setup) |
| OQ-3 | Should `@supabase/ssr` be included alongside `@supabase/supabase-js`? The Agent Builder uses both. Server-side Supabase access (middleware, RSC) requires `@supabase/ssr`.               | Affects auth guard implementation in `(launch)/layout.tsx`       | React Developer          | WS-1.3 (Login Experience)    |
| OQ-4 | Node.js version enforcement: should `.nvmrc` or `packageManager` field in `package.json` be added to enforce Node 22+ and pnpm version?                                                  | Affects developer onboarding reliability                         | Project Lead             | Before execution begins      |

## 8. Risk Register

| #   | Risk                                                                                                           | Likelihood | Impact                                     | Mitigation                                                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | `@tarva/ui` sibling directory `../tarva-ui-library` does not exist or is not built                             | Low        | High -- blocks `pnpm install`              | Verify `../tarva-ui-library` exists and has been built (`pnpm build`) before running `pnpm install`. The `link:` protocol resolves to a symlink, so the directory must be present. |
| R-2 | Version mismatch between `@tarva/ui` peer dependencies and Launch's direct dependencies (React 19, Tailwind 4) | Low        | Medium -- build warnings or runtime errors | `@tarva/ui` already declares `react >= 18` and `tailwindcss >= 4` as peer deps. Pin versions to match Agent Builder (React 19.2.3, Tailwind 4.1.18).                               |
| R-3 | ESLint flat config (`eslint.config.mjs`) incompatibility with `eslint-config-next` version                     | Low        | Low -- lint failures, not build-blocking   | Pin `eslint-config-next` to match `next` version (16.1.4). Flat config pattern is proven in Agent Builder.                                                                         |
| R-4 | Zustand v5 + Immer middleware API changes                                                                      | Low        | Low -- store skeletons are minimal         | Zustand v5 API is stable. The `immer` middleware import path (`zustand/middleware/immer`) is the documented v5 pattern.                                                            |
| R-5 | Tailwind v4 CSS-first config breaks with future `@tarva/ui` updates                                            | Low        | Medium -- styling failures across the app  | The `@theme inline` and `@source` patterns are stable Tailwind v4 conventions. `@tarva/ui` already uses Tailwind v4 in its build. Monitor `@tarva/ui` changelogs during upgrades.  |

---

## Appendix A: Execution Checklist

This checklist is for the implementing agent. Execute steps in order.

```
[ ] 1. Ensure Node.js >= 22 and pnpm are available
[ ] 2. Verify `../tarva-ui-library` exists and is built (OQ-1 resolved: using `link:` protocol)
[ ] 3. Create package.json (Section 4.2)
[ ] 4. Run `pnpm install`
[ ] 5. Create tsconfig.json (Section 4.3)
[ ] 6. Create next.config.ts (Section 4.4)
[ ] 7. Create postcss.config.mjs (Section 4.5)
[ ] 8. Create .prettierrc (Section 4.8)
[ ] 9. Create eslint.config.mjs (Section 4.7)
[ ] 10. Update .gitignore (Section 4.9)
[ ] 11. Create .env.example (Section 4.10)
[ ] 12. Create full directory tree (Section 4.1) with .gitkeep files
[ ] 13. Create src/app/globals.css (Section 4.6)
[ ] 14. Create src/components/providers/theme-provider.tsx (Section 4.12)
[ ] 15. Create src/components/providers/query-provider.tsx (Section 4.13)
[ ] 16. Create src/app/layout.tsx (Section 4.11)
[ ] 17. Create src/app/login/page.tsx (Section 4.14)
[ ] 18. Create src/app/(launch)/layout.tsx (Section 4.15)
[ ] 19. Create src/app/(launch)/page.tsx (Section 4.16)
[ ] 20. Create src/app/api/telemetry/route.ts (Section 4.17)
[ ] 21. Create src/stores/*.store.ts (Section 4.18)
[ ] 22. Create src/lib/utils.ts (Section 4.19)
[ ] 23. Create src/lib/constants.ts (Section 4.20)
[ ] 24. Run `pnpm format` to normalize all files
[ ] 25. Verify AC-1: `pnpm install` (already done, re-verify clean)
[ ] 26. Verify AC-2: `pnpm dev` and visit localhost:3000
[ ] 27. Verify AC-3: `pnpm build`
[ ] 28. Verify AC-4: `pnpm lint`
[ ] 29. Verify AC-5: `pnpm typecheck`
[ ] 30. Verify AC-6: `pnpm format:check`
[ ] 31. Verify AC-7: Directory structure matches AD-9
[ ] 32. Verify AC-9: Dark mode forced, Geist fonts visible
[ ] 33. Verify AC-12: /login route renders placeholder
[ ] 34. Commit with message: "feat: scaffold project foundation (WS-0.1)"
```
