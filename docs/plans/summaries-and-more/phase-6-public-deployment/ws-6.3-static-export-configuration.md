# WS-6.3: Static Export Configuration

> **Workstream ID:** WS-6.3
> **Phase:** 6 -- Public Deployment
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-6.1 (data mode branching in hooks), WS-6.2 (Supabase query functions)
> **Blocks:** WS-6.4 (GitHub Actions deployment workflow)
> **Resolves:** Validation Finding (HIGH) -- @tarva/ui workspace dependency CI resolution; Risk R7 -- MapLibre dynamic import in static export

## 1. Objective

Configure the Next.js build to produce a fully static export (`output: 'export'`) suitable for GitHub Pages deployment, while preserving the existing local development workflow. This requires solving three problems that currently prevent static export: (1) the `@tarva/ui` workspace dependency references `../../tarva-ui-library/` which does not exist in CI, (2) ten API Route Handlers use server-only Node.js APIs (`net`, `createConnection`) and server-side proxy patterns that are incompatible with static export, and (3) the MapLibre GL JS dynamic import pattern must be verified to survive the static export build process. After this workstream, `pnpm build:static` produces a deployable `out/` directory, and `pnpm dev` / `pnpm build` continue to work unchanged for local development.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `next.config.ts` | Add conditional `output: 'export'` based on `STATIC_EXPORT` environment variable. Add `basePath` and `assetPrefix` for GitHub Pages when `GITHUB_PAGES` env is set. Retain existing `transpilePackages: ['@tarva/ui']`. |
| Build script | Add `build:static` script to `package.json` that sets `STATIC_EXPORT=true` and runs the Next.js build with `--webpack`. |
| @tarva/ui CI resolution | Vendor a pre-built copy of `@tarva/ui` into `vendor/@tarva-ui/` within the repo. Add a CI-specific `pnpm-workspace.yaml` override or conditional install script that uses the vendored copy when `../../tarva-ui-library` is unavailable. |
| API route removal for static build | Move all 10 API route files under `src/app/api/` behind a build-time exclusion so they are not included in static export. Client-side consumers must degrade gracefully. |
| Client-side API consumers | Stub or disable the 9 client-side modules that fetch `/api/*` endpoints, gated on `NEXT_PUBLIC_DATA_MODE === 'supabase'` (the static/public mode established by WS-6.1). |
| MapLibre dynamic import verification | Confirm that `next/dynamic` with `ssr: false` produces correct client-side chunks in static export mode. Document the verification result. |
| `next start` script | Update or annotate that `next start` is not applicable for static export (the `out/` directory is served by a static file server or GitHub Pages). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Writing Supabase query functions | Belongs to WS-6.2. This workstream assumes those functions exist. |
| Data mode branching logic in hooks | Belongs to WS-6.1. This workstream assumes hooks already switch fetcher based on `NEXT_PUBLIC_DATA_MODE`. |
| GitHub Actions workflow file | Belongs to WS-6.4. This workstream produces the build configuration that WS-6.4 invokes. |
| Publishing @tarva/ui to npm | Long-term solution; out of scope for initial deployment. This workstream uses vendoring as the pragmatic first step. |
| Removing legacy district features (agent-builder, project-room, tarva-chat) | These are inherited from tarva-launch and are orthogonal to static export. Their API routes are excluded from the build, and their client-side hooks degrade to no-op in supabase mode. |
| Modifying auth system | The passphrase auth guard uses client-side sessionStorage (Zustand store). It works in static export without changes. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-6.1 complete | All data hooks check `NEXT_PUBLIC_DATA_MODE` and switch fetcher accordingly. API route consumers are gated behind `'console'` mode. | Required (predecessor) |
| WS-6.2 complete | `src/lib/supabase/queries.ts` provides typed Supabase query functions for public mode. | Required (predecessor) |
| `next.config.ts` | Current config: 7 lines, only `transpilePackages: ['@tarva/ui']` | Available |
| `package.json` | Current build script: `next build --webpack` | Available |
| `pnpm-workspace.yaml` | References `'.'` and `'../../tarva-ui-library'` | Available |
| `src/app/api/` | 10 API route files across 7 directories | Available (enumerated in Section 4.3) |
| `@tarva/ui` library source | At `../../tarva-ui-library/` relative to project root (outside the Safetrekr directory) | Available locally; NOT available in CI |
| MapLibre dynamic imports | 2 usages: `page.tsx` line 29-32, `CategoryDetailScene.tsx` line 67-70 | Available |

## 4. Deliverables

### 4.1 Modify `next.config.ts` -- Conditional Static Export

Add conditional `output: 'export'` configuration that activates only when the `STATIC_EXPORT` environment variable is set. When active, also configure `basePath` and `assetPrefix` for GitHub Pages deployment if the `GITHUB_PAGES` env var specifies a repository name.

**Current file (7 lines):**
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@tarva/ui'],
}

export default nextConfig
```

**Updated file:**
```ts
import type { NextConfig } from 'next'

const isStaticExport = process.env.STATIC_EXPORT === 'true'

// GitHub Pages serves from /<repo-name>/ subdirectory.
// Set GITHUB_PAGES=tarvari-alert-viewer to configure basePath.
const githubPagesRepo = process.env.GITHUB_PAGES || ''
const basePath = isStaticExport && githubPagesRepo ? `/${githubPagesRepo}` : ''

const nextConfig: NextConfig = {
  transpilePackages: ['@tarva/ui'],

  // Static export for GitHub Pages deployment.
  // Activated by: STATIC_EXPORT=true pnpm build --webpack
  ...(isStaticExport && {
    output: 'export',
    basePath: basePath || undefined,
    assetPrefix: basePath || undefined,
    // Static export does not support image optimization (no server).
    images: { unoptimized: true },
    // Trailing slashes for clean URLs on static hosts.
    trailingSlash: true,
  }),
}

export default nextConfig
```

**Key decisions:**
- `basePath` and `assetPrefix` are only set when `GITHUB_PAGES` is provided, supporting both root-domain and subdirectory deployments.
- `images: { unoptimized: true }` is required because Next.js image optimization requires a server. The app currently uses `<img>` tags and MapLibre tile images, not `next/image`, so this has no functional impact.
- `trailingSlash: true` produces `/about/index.html` instead of `/about.html`, which is the convention for GitHub Pages and most static hosts.
- The spread operator with conditional ensures these fields are completely absent during normal development (no behavioral change to `pnpm dev`).

### 4.2 Add `build:static` Script to `package.json`

**Add to the `scripts` section:**
```json
"build:static": "STATIC_EXPORT=true NEXT_PUBLIC_DATA_MODE=supabase next build --webpack",
"build:pages": "STATIC_EXPORT=true NEXT_PUBLIC_DATA_MODE=supabase GITHUB_PAGES=tarvari-alert-viewer next build --webpack"
```

**Rationale:**
- `build:static` produces a generic static export (output to `out/`).
- `build:pages` adds GitHub Pages basePath configuration for the specific repository name.
- Both set `NEXT_PUBLIC_DATA_MODE=supabase` to activate the public data mode established by WS-6.1, which causes hooks to use Supabase queries instead of TarvaRI API calls and causes client-side API consumers to degrade gracefully.
- The `--webpack` flag is retained for consistency with existing `dev` and `build` scripts (the project uses webpack, not turbopack, for production builds).

**Cross-platform note:** The inline `VAR=value` syntax works on macOS/Linux. For Windows CI runners (if ever needed), use `cross-env` or set environment variables via the CI workflow file. WS-6.4 (GitHub Actions) will use `env:` blocks in the workflow YAML, which is cross-platform.

### 4.3 Remove API Routes from Static Export Build

Next.js static export (`output: 'export'`) fails at build time if API Route Handlers are present in the `src/app/api/` directory. All 10 API route files must be excluded.

**Complete inventory of API routes:**

| Route File | HTTP Methods | Server-Only Dependencies | Client Consumers |
|------------|-------------|--------------------------|------------------|
| `src/app/api/telemetry/route.ts` | GET | `net.createConnection` (Node.js TCP) | `use-telemetry.ts`, `system-state-provider.ts` |
| `src/app/api/receipts/route.ts` | GET, POST | `createSupabaseServerClient()` | None (server-side only) |
| `src/app/api/receipts/[id]/route.ts` | GET | `createSupabaseServerClient()` | None |
| `src/app/api/snapshots/route.ts` | GET, POST | `createSupabaseServerClient()` | None |
| `src/app/api/districts/agent-builder/route.ts` | GET | `fetch()` to localhost:3000 | `use-agent-builder-district.ts` |
| `src/app/api/districts/project-room/route.ts` | GET | `fetch()` to localhost services | `use-project-room-district.ts` |
| `src/app/api/districts/tarva-chat/route.ts` | GET | `fetch()` to localhost services | `use-tarva-chat-district.ts` |
| `src/app/api/ai/chat/route.ts` | POST | Ollama localhost:11434 proxy | `ollama-provider.ts` |
| `src/app/api/ai/narrate/route.ts` | POST | Ollama localhost:11434 proxy | `narration-engine.ts` |
| `src/app/api/ai/claude/route.ts` | GET, POST | `@anthropic-ai/sdk` (API key server-side) | `station-proposal-generator.ts`, `use-claude-health-check.ts` |

**Exclusion strategy:** Rename `src/app/api/` to `src/app/_api/` when building for static export. The underscore prefix causes Next.js to ignore the directory during routing (it is treated as a private folder per the App Router convention). This is done via a pre-build/post-build script that renames the directory:

```json
"prebuild:static": "[ -d src/app/api ] && mv src/app/api src/app/_api-disabled || true",
"postbuild:static": "[ -d src/app/_api-disabled ] && mv src/app/_api-disabled src/app/api || true",
"prebuild:pages": "[ -d src/app/api ] && mv src/app/api src/app/_api-disabled || true",
"postbuild:pages": "[ -d src/app/_api-disabled ] && mv src/app/_api-disabled src/app/api || true"
```

**Alternative considered and rejected:** Adding `export const dynamic = 'error'` to each route file. This does not work -- Next.js static export rejects any Route Handler regardless of the `dynamic` export value.

**Alternative considered and rejected:** Deleting the `api/` directory permanently. Rejected because the API routes remain useful for local development (telemetry health checks, AI proxy, receipt system) and must not be lost.

### 4.4 Graceful Degradation of Client-Side API Consumers

After WS-6.1 completes, data hooks already check `NEXT_PUBLIC_DATA_MODE`. However, several client-side modules that consume `/api/*` endpoints are not data hooks -- they are legacy features from tarva-launch (telemetry, AI, district enrichment). These must degrade gracefully when API routes are unavailable.

**Strategy:** Each consumer already handles fetch failures (try/catch, error states). In `supabase` data mode, these features are non-functional by design (they depend on localhost services). The minimal required change is to short-circuit the fetch calls when `NEXT_PUBLIC_DATA_MODE === 'supabase'`.

**Files requiring modification (9 total):**

| File | Current Behavior | Change for Static Mode |
|------|------------------|----------------------|
| `src/hooks/use-telemetry.ts` | Polls `GET /api/telemetry` | Return hardcoded `OFFLINE` status for all apps. Skip fetch entirely. |
| `src/lib/interfaces/system-state-provider.ts` | Fetches `/api/telemetry` in `refresh()` | Guard fetch with mode check. Return cached/empty state in supabase mode. |
| `src/hooks/use-agent-builder-district.ts` | Fetches `GET /api/districts/agent-builder` | Return `null` with `isReachable: false`. Skip fetch. |
| `src/hooks/use-project-room-district.ts` | Fetches `GET /api/districts/project-room` | Return `null` with `isReachable: false`. Skip fetch. |
| `src/hooks/use-tarva-chat-district.ts` | Fetches `GET /api/districts/tarva-chat` | Return `null` with `isReachable: false`. Skip fetch. |
| `src/lib/ai/narration-engine.ts` | Posts to `/api/ai/narrate` | No-op: return without generating narration. |
| `src/lib/ai/camera-director/ollama-provider.ts` | Posts to `/api/ai/chat` | No-op: return fallback/default camera decisions. |
| `src/lib/ai/station-proposal-generator.ts` | Posts to `/api/ai/claude` | No-op: return empty proposal. |
| `src/hooks/use-claude-health-check.ts` | Polls `GET /api/ai/claude` | Return `{ configured: false, reachable: false }`. Skip fetch. |

**Implementation pattern (consistent across all files):**
```ts
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE ?? 'console'

// At the top of the fetch function:
if (DATA_MODE === 'supabase') {
  return { /* appropriate empty/offline default */ }
}
```

This is a build-time constant that webpack dead-code eliminates, so the fetch code is tree-shaken from the static bundle entirely.

### 4.5 Vendor @tarva/ui for CI Builds

**Problem:** The `pnpm-workspace.yaml` references `../../tarva-ui-library` which is a separate repository outside the Safetrekr project directory. This path does not exist in GitHub Actions CI. `pnpm install` will fail before the build even starts.

**Current workspace config:**
```yaml
packages:
  - '.'
  - '../../tarva-ui-library'
```

**Imports from @tarva/ui (3 entry points, 50 consumer files):**

| Import Path | Export | Consumer Count |
|-------------|--------|----------------|
| `@tarva/ui` | Button, Badge, Card, CardContent, CardHeader, CardTitle, CardFooter, ScrollArea, Skeleton, Input, Tooltip, TooltipTrigger, TooltipContent, Sparkline, StatusBadge, type ColorScheme | 43 files |
| `@tarva/ui/motion` | `useReducedMotion` | 6 files |
| `@tarva/ui/providers` | ThemeProvider, useTarvaTheme, useTheme | 1 file |

**Solution: Vendored pre-built package with CI-aware install script.**

**Step 1 -- Build and vendor @tarva/ui:**

Create a script `scripts/vendor-tarva-ui.sh` that:
1. Checks if `../../tarva-ui-library` exists (local dev environment).
2. If yes, builds the library (`cd ../../tarva-ui-library && pnpm build`).
3. Copies the built `dist/` output plus `package.json` into `vendor/@tarva-ui/`.
4. Generates a minimal `package.json` in `vendor/@tarva-ui/` with the correct `name`, `exports`, and `main` fields matching what `@tarva/ui` normally provides.

```bash
#!/bin/bash
# scripts/vendor-tarva-ui.sh
# Build and vendor @tarva/ui for CI environments where the workspace
# link to ../../tarva-ui-library is unavailable.

set -euo pipefail

TARVA_UI_SOURCE="../../tarva-ui-library"
VENDOR_DIR="vendor/@tarva-ui"

if [ ! -d "$TARVA_UI_SOURCE" ]; then
  echo "[vendor] @tarva/ui source not found at $TARVA_UI_SOURCE"
  echo "[vendor] Using existing vendored copy at $VENDOR_DIR"
  if [ ! -d "$VENDOR_DIR" ]; then
    echo "[vendor] ERROR: No vendored copy exists. Run this script locally first."
    exit 1
  fi
  exit 0
fi

echo "[vendor] Building @tarva/ui from source..."
(cd "$TARVA_UI_SOURCE" && pnpm install && pnpm build)

echo "[vendor] Copying built output to $VENDOR_DIR..."
rm -rf "$VENDOR_DIR"
mkdir -p "$VENDOR_DIR"
cp -r "$TARVA_UI_SOURCE/dist/"* "$VENDOR_DIR/"
cp "$TARVA_UI_SOURCE/package.json" "$VENDOR_DIR/package.json"

echo "[vendor] @tarva/ui vendored successfully."
```

**Step 2 -- CI-aware pnpm-workspace.yaml:**

For CI builds, the workspace config must reference the vendored copy instead of the external path. Two approaches:

**Approach A (recommended): Conditional workspace via install script.**

Create `scripts/ci-install.sh`:
```bash
#!/bin/bash
# scripts/ci-install.sh
# Adjusts pnpm workspace for CI where ../../tarva-ui-library is unavailable.

set -euo pipefail

if [ ! -d "../../tarva-ui-library" ]; then
  echo "[ci] Workspace link unavailable. Switching to vendored @tarva/ui."

  # Rewrite pnpm-workspace.yaml to use vendored package
  cat > pnpm-workspace.yaml << 'EOF'
packages:
  - '.'
  - 'vendor/@tarva-ui'
EOF

  echo "[ci] pnpm-workspace.yaml updated for CI."
fi

pnpm install --frozen-lockfile
```

The CI workflow (WS-6.4) will call `bash scripts/ci-install.sh` instead of `pnpm install` directly.

**Approach B (alternative): Override resolution in package.json.**

Add a `pnpm.overrides` field in `package.json` that CI sets via `TARVA_UI_PATH` environment variable. Rejected because pnpm overrides do not support environment variable interpolation at install time.

**Step 3 -- Add `vendor/@tarva-ui/` to `.gitignore` exclusion:**

The vendored directory must be committed to the repository so CI can use it. Add a comment in `.gitignore` to clarify:

```gitignore
# Vendored @tarva/ui build for CI (committed intentionally)
!vendor/@tarva-ui/
```

**Step 4 -- Update the vendor on @tarva/ui changes:**

Add a developer instruction: after making changes to `tarva-ui-library`, run `bash scripts/vendor-tarva-ui.sh` and commit the updated `vendor/` directory. This is a manual step until @tarva/ui is published to npm (long-term solution, out of scope).

**Impact on `transpilePackages`:** The `transpilePackages: ['@tarva/ui']` in `next.config.ts` remains necessary. When using the workspace link (local dev), Next.js transpiles the source TypeScript from `../../tarva-ui-library`. When using the vendored copy (CI), it transpiles the pre-built JavaScript. In both cases, `transpilePackages` ensures the package is processed by webpack rather than treated as an external.

### 4.6 MapLibre GL Dynamic Import Verification

**Current pattern (2 usages):**

`src/app/(launch)/page.tsx` lines 29-32:
```ts
const CoverageMapDynamic = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => ({ default: mod.CoverageMap })),
  { ssr: false },
)
```

`src/components/district-view/scenes/CategoryDetailScene.tsx` lines 67-70:
```ts
const CoverageMap = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => mod.CoverageMap),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> },
)
```

**Verification approach:** After implementing deliverables 4.1-4.5, run `pnpm build:static` and confirm:

1. **Build completes without errors.** The `ssr: false` flag tells Next.js to skip server rendering for these components. During static export, Next.js pre-renders pages to HTML -- the `ssr: false` components render their loading fallback (or nothing) in the static HTML and load the full component client-side via JavaScript.

2. **The output `out/` directory contains the MapLibre chunk.** Verify by inspecting `out/_next/static/chunks/` for a chunk containing `maplibre-gl`. The dynamic import should produce a separate chunk that loads on demand.

3. **Manual smoke test:** Serve `out/` with a static file server (`npx serve out`) and verify the map renders correctly on the launch page and in category detail scenes.

**Expected result:** `next/dynamic` with `ssr: false` is a standard Next.js pattern for browser-only libraries and is explicitly documented as compatible with static export. The CoverageMap component already uses `'use client'` and all MapLibre imports are confined within the dynamically-imported module. No changes are needed.

**Fallback plan (Risk R7):** If the dynamic import fails in static export (unlikely), the fallback is to load MapLibre via a `<script>` tag in `src/app/layout.tsx` and access it via `window.maplibregl`. This would require:
1. Adding `<script src="https://unpkg.com/maplibre-gl@5.19.0/dist/maplibre-gl.js">` to the layout.
2. Changing `CoverageMap.tsx` to reference `window.maplibregl` instead of the ES module import.
3. This is a significant refactor and should only be pursued if the standard pattern fails.

### 4.7 Verify No Other Static Export Incompatibilities

**Checklist of Next.js features incompatible with `output: 'export'`:**

| Feature | Used in Project? | Impact |
|---------|-----------------|--------|
| API Routes | Yes (10 files) | Handled by D-4.3 (rename to `_api-disabled/` during build) |
| `next/image` optimization | No (`<img>` tags used directly) | None. `images: { unoptimized: true }` added as safety net. |
| Middleware (`middleware.ts`) | No | None |
| `getServerSideProps` | No (App Router, no Pages Router usage) | None |
| ISR / `revalidate` | No | None |
| Server Actions | No | None |
| `headers()` / `cookies()` in Server Components | No (all pages are `'use client'`) | None |
| Dynamic routes without `generateStaticParams` | No dynamic routes in `(launch)` group | None |
| `next/headers` | Only in API routes (excluded) | None |

**Login page:** The `/login` page is a client-side form using the Zustand auth store. It does not depend on any server features and will work in static export.

**`next/navigation`:** `useRouter()` and `usePathname()` work in static export for client-side navigation. The auth guard in `(launch)/layout.tsx` uses `router.replace('/login')` which is client-side only.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `pnpm dev` works unchanged (no regression to local development). | Start dev server, navigate to launch page, verify coverage grid and map render. |
| AC-2 | `pnpm build` (non-static) works unchanged. | Build completes with exit code 0. |
| AC-3 | `pnpm build:static` completes without errors and produces an `out/` directory. | Build exits 0; `ls out/` shows `index.html` and `_next/` directory. |
| AC-4 | The `out/` directory contains MapLibre GL chunks. | `find out/_next/static/chunks -name '*.js' \| xargs grep -l 'maplibre' \| wc -l` returns at least 1. |
| AC-5 | Serving `out/` with a static file server renders the login page. | `npx serve out` and navigate to `http://localhost:3000/` -- login form appears. |
| AC-6 | After login, the coverage map renders with tile imagery. | Enter passphrase, verify CARTO dark tiles load and MapLibre canvas initializes. |
| AC-7 | API routes remain functional during `pnpm dev` (local development). | `curl http://localhost:3000/api/telemetry` returns JSON with app statuses. |
| AC-8 | API route files are excluded from the static build. | During `pnpm build:static`, no "API routes are not supported" error. After build, `src/app/api/` is restored to its original location. |
| AC-9 | `@tarva/ui` components render correctly in the static export. | Button, Badge, Skeleton, Tooltip, ScrollArea components visible in the UI when served from `out/`. |
| AC-10 | The vendored `@tarva/ui` directory exists at `vendor/@tarva-ui/`. | `ls vendor/@tarva-ui/package.json` succeeds. |
| AC-11 | `pnpm typecheck` passes with no errors after all changes. | Exit code 0. |
| AC-12 | `pnpm build:static` passes in a clean environment without `../../tarva-ui-library` available. | Simulate by temporarily renaming `../../tarva-ui-library`, run `bash scripts/ci-install.sh && pnpm build:static`, verify success. |
| AC-13 | Legacy API consumer hooks return graceful defaults in supabase mode. | In the static build, browser console shows no fetch errors to `/api/*` endpoints. Telemetry shows OFFLINE status. District features show empty/unreachable state. |
| AC-14 | `pnpm build:pages` produces output with correct `basePath`. | `grep 'tarvari-alert-viewer' out/index.html` finds the basePath in asset references. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Use environment variable `STATIC_EXPORT=true` to activate static export rather than a separate `next.config.export.ts` file. | A single config file with conditional logic is simpler to maintain than two config files that could drift. The condition is a single boolean check. | Separate config file (`next.config.export.ts`) selected via `--config` flag. Rejected: Next.js does not support `--config` in the same way as webpack. Would require a symlink dance. |
| D-2 | Vendor @tarva/ui as a pre-built copy committed to the repository. | Pragmatic first step that unblocks CI immediately. The vendored copy is small (UI components). Publishing to npm is the long-term solution but requires registry infrastructure that does not exist yet. | (a) Publish to npm -- requires private registry or npm org setup, out of scope. (b) GitHub Actions checkout of tarva-ui-library repo -- requires repo access configuration, fragile relative path, and adds 30-60s to CI. (c) Replace @tarva/ui with direct shadcn/ui -- 50 files to refactor, high risk, loses shared design system. |
| D-3 | Exclude API routes by renaming `src/app/api/` to `src/app/_api-disabled/` during static build via pre/post build scripts. | The underscore prefix is the App Router convention for private folders (ignored during routing). Renaming is reversible and non-destructive. The pre/post scripts run automatically with `pnpm build:static`. | (a) Delete API routes permanently -- rejected: they are useful for local dev. (b) Conditional `export const dynamic = 'error'` -- does not work: static export rejects Route Handlers entirely regardless of dynamic config. (c) Move API routes to a separate Next.js app -- over-engineering for 10 route files. |
| D-4 | Gate legacy API consumers on `NEXT_PUBLIC_DATA_MODE` rather than checking for static export directly. | `NEXT_PUBLIC_DATA_MODE` is the canonical mode flag established by WS-6.1. Using it keeps the gating logic consistent across the codebase. It is also a build-time constant that enables dead-code elimination. | Check `typeof window !== 'undefined'` -- does not distinguish between static export and local SSR dev mode. Check `process.env.STATIC_EXPORT` -- not available at runtime (only at build time in `next.config.ts`). |
| D-5 | Add `trailingSlash: true` for static export. | GitHub Pages and most static hosts expect `path/index.html` rather than `path.html`. Trailing slash mode produces this structure. It also avoids 404s when navigating directly to sub-routes. | `trailingSlash: false` -- would require custom 404 handling or `.htaccess` rules. |
| D-6 | Add `images: { unoptimized: true }` for static export even though the app does not use `next/image`. | Defensive measure. If any component or dependency introduces `next/image` usage in the future, the build will not fail with a cryptic "Image Optimization requires a server" error. Zero cost when not using `next/image`. | Omit it and add later if needed. Rejected: the error message is confusing and would waste debugging time. |
| D-7 | Keep `--webpack` flag on all build commands. | The project uses `--webpack` for both dev and build (see existing `package.json` scripts). This is likely required by a dependency or configuration that is incompatible with Turbopack. Maintain consistency. | Switch to Turbopack. Rejected: not evaluated; out of scope for this workstream. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | What is the GitHub repository name for the alert viewer? `build:pages` hardcodes `tarvari-alert-viewer`. If the repo name differs, the `GITHUB_PAGES` env var must be updated. | DevOps / project owner | WS-6.4 |
| Q-2 | Should the passphrase auth be removed for the public deployment? Currently hardcoded as `'tarva'` in `auth.store.ts`. A public GitHub Pages deployment would require users to know this passphrase. | Product owner | Phase 6 (before deploy) |
| Q-3 | Does the vendored @tarva/ui need to include CSS/style assets, or is everything handled by Tailwind class generation? The answer determines what files to copy in `vendor-tarva-ui.sh`. | Review @tarva/ui build output | WS-6.3 implementation |
| Q-4 | Should the `@anthropic-ai/sdk` dependency be removed from `package.json` for static builds? It is only used by the Claude API route (`src/app/api/ai/claude/route.ts`) which is excluded from static export. Keeping it in `dependencies` increases install time but has no runtime impact. | Developer discretion | WS-6.3 implementation |
| Q-5 | Are there any `<Link>` components using `href="/api/..."` that would produce broken links in static export? | Grep verification during implementation | WS-6.3 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | MapLibre `next/dynamic` with `ssr: false` fails during static export build. | Low | High | This is a standard Next.js pattern documented as compatible with static export. Both usages are in `'use client'` components. If it fails, fallback to `<script>` tag loading (see Deliverable 4.6 fallback plan). Verification is an explicit acceptance criterion (AC-4, AC-6). |
| R-2 | Vendored @tarva/ui drifts from the source library after updates. | Medium | Medium | `scripts/vendor-tarva-ui.sh` rebuilds from source when available. Add a developer checklist item: "After updating tarva-ui-library, run `bash scripts/vendor-tarva-ui.sh` and commit vendor/". Long-term: publish to npm. |
| R-3 | Pre/post build scripts for API route exclusion fail on non-POSIX systems (Windows CI). | Low | Medium | GitHub Actions runners are Ubuntu by default. The `[ -d ... ] && mv ...` syntax is POSIX sh. If Windows support is needed, replace with a Node.js script. |
| R-4 | A client-side module imported at build time transitively imports a server-only API route module, causing a build failure. | Low | High | All API route files are in `src/app/api/` and are not imported by any client-side code. Client-side consumers fetch via `fetch('/api/...')` -- they do not import route handler modules. Verified by grep: no `import` statements reference `src/app/api/` files from outside that directory. |
| R-5 | `NEXT_PUBLIC_DATA_MODE` is not set during static build, causing hooks to default to `'console'` mode and attempt API calls. | Low | High | The `build:static` script explicitly sets `NEXT_PUBLIC_DATA_MODE=supabase`. The default in WS-6.1 hooks is `'console'` (current behavior). If the env var is missing, the build still succeeds -- but the deployed app would attempt TarvaRI API calls that fail. AC-13 validates correct mode activation. |
| R-6 | The vendored @tarva/ui `package.json` has workspace-protocol dependencies (`workspace:*`) that pnpm cannot resolve in CI. | Medium | High | The `vendor-tarva-ui.sh` script must process the vendored `package.json` to replace any `workspace:*` references with concrete versions or remove them if they are devDependencies not needed at runtime. Add a `sed` or `jq` step to the vendoring script. |
| R-7 | `pnpm install --frozen-lockfile` fails in CI because the lockfile was generated with the workspace link, not the vendored path. | Medium | High | The CI install script (`scripts/ci-install.sh`) must use `pnpm install --no-frozen-lockfile` when the workspace is rewritten. This is acceptable for CI because the vendored package is committed and its contents are deterministic. Alternatively, maintain a separate `pnpm-lock-ci.yaml` -- but this adds maintenance burden. Recommended: use `--no-frozen-lockfile` in CI with a lockfile validation step in the GitHub Actions workflow. |
| R-8 | Static export produces a large bundle because server-only code (API routes, Node.js modules) is included in client chunks. | Low | Low | API routes are excluded via directory rename (D-4.3). Node.js modules (`net`) are only imported in API route files. webpack tree-shaking eliminates unreachable code. The `NEXT_PUBLIC_DATA_MODE` guard enables dead-code elimination of fetch calls in legacy consumers (D-4.4). Bundle size should be verified post-build. |
