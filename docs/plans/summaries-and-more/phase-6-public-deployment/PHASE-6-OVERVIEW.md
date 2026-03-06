# Phase 6 Overview: Public Deployment

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md
> **Date:** 2026-03-05
> **Phase Status:** Draft (all 4 SOWs in Draft)

---

## 1. Executive Summary

Phase 6 transforms the TarvaRI Alert Viewer from an internal-only console application (dependent on a running TarvaRI backend at localhost:8000) into a publicly deployable static site served from GitHub Pages, reading approved intel data directly from Supabase via the browser client and Row Level Security.

The phase consists of four workstreams executed by two agents:

| WS | Title | Size | Agent | Core Deliverable |
|----|-------|------|-------|-----------------|
| 6.1 | Data Mode Branching in Hooks | M | react-developer | Build-time `NEXT_PUBLIC_DATA_MODE` switch in all 5 data hooks |
| 6.2 | Supabase Query Functions | M | react-developer | `src/lib/supabase/queries.ts` -- 5 typed fetch functions against public views |
| 6.3 | Static Export Configuration | M | react-developer | `output: 'export'` in next.config.ts, @tarva/ui vendoring, API route exclusion |
| 6.4 | GitHub Actions Deployment | S | devops-platform-engineer | `.github/workflows/deploy-pages.yml` -- build + deploy to Pages |

**Estimated effort:** 3-4 days (1S + 3M). Strictly serial dependency chain: WS-6.2 then WS-6.1 then WS-6.3 then WS-6.4.

**Backend dependency:** Phase E (E.1 creates public Supabase views with RLS; E.2 populates the Supabase data layer). The frontend workstreams can be built and merged before Phase E completes -- they degrade gracefully (supabase mode throws clear errors when views do not exist, and the default `console` mode is unaffected).

**Key architectural principle (AD-10):** The data mode switch is build-time, not runtime. `NEXT_PUBLIC_DATA_MODE` is inlined by the bundler as a string literal, enabling dead-code elimination of the unused data path. No user-facing toggle, no dynamic detection. Console builds tree-shake all Supabase query code; public builds tree-shake all `tarvariGet` code.

---

## 2. Key Findings

### 2.1 From CTA (Architecture & Technical Risk)

1. **Dead-code elimination is the linchpin.** The entire dual-mode architecture relies on Next.js replacing `process.env.NEXT_PUBLIC_DATA_MODE` with a literal string at build time, allowing the bundler to eliminate the unused branch. If tree-shaking fails (R-2 in WS-6.1), the public bundle ships `tarvari-api.ts` code that can never execute, and the console bundle ships `@supabase/supabase-js` initialization code that should not run. Both are correctness concerns, not just bundle-size optimization. **Action: verify tree-shaking with bundle analyzer post-build.**

2. **The @tarva/ui workspace dependency is the highest-risk item in the entire phase.** 50 consumer files across 3 entry points (`@tarva/ui`, `@tarva/ui/motion`, `@tarva/ui/providers`). The vendoring strategy (WS-6.3 Deliverable 4.5) is pragmatic but introduces a manual synchronization burden. The lockfile divergence between local dev (workspace link) and CI (vendored copy) is particularly concerning -- WS-6.3 R-7 acknowledges this may require `--no-frozen-lockfile` in CI, which weakens reproducibility guarantees.

3. **10 API routes must be excluded from static export.** The directory-rename strategy (`api/` to `_api-disabled/`) is clever but fragile -- a build failure between the pre and post scripts leaves the directory in the wrong state. The pre/post scripts must be idempotent and handle partial failure.

4. **Source metadata is deliberately omitted from the public deployment.** `fetchCoverageMetricsFromSupabase` zeroes all source-level fields (`totalSources`, `activeSources`, `sourcesByCoverage`, per-category `sourceCount`/`activeSources`/`geographicRegions`). Components that display source counts will show `0`. This is a conscious security decision, not a gap, but the UI should acknowledge it (e.g., hide source-count elements in supabase mode rather than displaying zeros).

5. **Four Supabase views are assumed but unconfirmed.** `public_intel_feed`, `public_coverage_map`, `public_bundles`, `public_bundle_detail` -- column names, types, and RLS policies are all assumptions. Every `.select()` call in WS-6.2 is speculative. The mitigation is that column mismatches produce clear runtime errors and are 1-2 line fixes.

### 2.2 From SPO (Product & User Value)

1. **The public viewer enables stakeholder demos without backend infrastructure.** This is the primary product justification -- sharing a URL is dramatically simpler than provisioning a TarvaRI backend for each demo audience.

2. **The passphrase auth gate (hardcoded `'tarva'`) remains unresolved for public deployment.** A public GitHub Pages URL with a hardcoded passphrase is security theater, not access control. Product must decide: remove the gate for public mode, or implement a more meaningful auth mechanism. Both WS-6.3 Q-2 and WS-6.4 OQ-4 flag this.

3. **Read-only is the correct mode for public deployment.** No write operations, no triage actions, no bundle management. The viewer surfaces approved intel only. This aligns with the RLS-anon-key security model.

4. **The "zeroed source metrics" gap means the public viewer's CoverageOverviewStats panel will appear data-sparse.** Components should conditionally hide rather than show `0`. This is a UX gap not addressed by any SOW -- it is flagged as a recommendation below.

### 2.3 From STW (Technical Implementation)

1. **The hook branching pattern is mechanical and low-risk.** Each of the 5 hooks follows an identical 3-4 line branching pattern. The risk of implementation error is low. The risk of future hooks missing the pattern is medium (WS-6.1 R-3 addresses this with a grep-based lint check).

2. **Supabase query functions can be built and tested independently of the views.** The functions compile and pass typecheck regardless of whether the views exist. Runtime testing requires the views but is not blocking for merge.

3. **The 9 legacy API consumer modifications (WS-6.3 Section 4.4) are the largest file-touch footprint in the phase.** These are telemetry, AI proxy, and inherited tarva-launch district features. All must short-circuit in supabase mode. The pattern is consistent (`if (DATA_MODE === 'supabase') return default`) but the sheer count of files increases review burden.

4. **MapLibre GL dynamic import is expected to work in static export without changes.** `next/dynamic` with `ssr: false` is a documented pattern for browser-only libraries in static export. The verification step (WS-6.3 Deliverable 4.6) is a confirmation, not a fix.

### 2.4 From PMO (Planning & Coordination)

1. **The dependency chain is strictly serial: WS-6.2 -> WS-6.1 -> WS-6.3 -> WS-6.4.** No parallelism is possible within the phase. The 3-4 day estimate assumes one developer context-switching between react-developer work (6.1-6.3) and handoff to devops-platform-engineer (6.4).

2. **Backend Phase E is the external gate.** Even if all 4 frontend workstreams are complete, the public deployment is non-functional until Phase E.1 creates the Supabase views. The frontend can be merged first (default mode is unaffected), but the GitHub Pages deployment will show empty data until views exist.

3. **Two agents are involved** -- react-developer owns 3 of 4 workstreams; devops-platform-engineer owns WS-6.4 only. The handoff point is clear: WS-6.3 produces the build configuration, WS-6.4 wraps it in a CI workflow.

4. **Manual setup is required before first deployment:** GitHub Pages must be enabled (source: GitHub Actions), and two repository secrets must be created (SUPABASE_URL, SUPABASE_ANON_KEY). These are one-time tasks documented in WS-6.4 Section 4.4.

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Supabase Function Naming Mismatch (WS-6.1 vs WS-6.2) -- CRITICAL

**WS-6.1** imports supabase functions using short names:
```typescript
import { supabaseIntelFeed } from '@/lib/supabase/queries'
import { supabaseCoverageMapData } from '@/lib/supabase/queries'
import { supabaseCoverageMetrics } from '@/lib/supabase/queries'
import { supabaseIntelBundles } from '@/lib/supabase/queries'
import { supabaseCategoryIntel } from '@/lib/supabase/queries'
```

**WS-6.2** exports functions using `fetch*FromSupabase` names:
```typescript
export fetchIntelFeedFromSupabase
export fetchCoverageMapDataFromSupabase
export fetchCoverageMetricsFromSupabase
export fetchBundlesFromSupabase
export fetchBundleDetailFromSupabase
```

**Resolution required:** One SOW must align to the other. Recommendation: adopt WS-6.2's `fetch*FromSupabase` convention (consistent with the existing `fetch*` naming pattern in hooks) and update WS-6.1's import statements accordingly.

### Conflict 2: Data Mode Value Naming (WS-6.1 vs WS-6.3) -- HIGH

**WS-6.1** defines `DataMode = 'console' | 'supabase'` with default `'console'`.

**WS-6.3** Section 4.4 uses `'tarvari'` as the non-supabase mode value:
```typescript
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE ?? 'tarvari'
```

These must be identical. Recommendation: use `'console'` as defined by WS-6.1 (the canonical data-mode module). WS-6.3's legacy API consumer guards should check `DATA_MODE === 'supabase'` (the positive case) rather than relying on the default value name.

### Conflict 3: Base Path Environment Variable Name (WS-6.3 vs WS-6.4) -- MEDIUM

**WS-6.3** uses `GITHUB_PAGES` env var to set basePath:
```typescript
const githubPagesRepo = process.env.GITHUB_PAGES || ''
const basePath = isStaticExport && githubPagesRepo ? `/${githubPagesRepo}` : ''
```

**WS-6.4** uses `NEXT_PUBLIC_BASE_PATH`:
```yaml
env:
  NEXT_PUBLIC_BASE_PATH: /tarvari-alert-viewer
```

And expects `next.config.ts` to consume it as:
```typescript
basePath: process.env.NEXT_PUBLIC_BASE_PATH || ''
```

**Resolution required:** One naming convention must be chosen. Recommendation: adopt WS-6.3's `GITHUB_PAGES` approach (it is a non-`NEXT_PUBLIC_` var consumed only in `next.config.ts` at build time, which is cleaner than a `NEXT_PUBLIC_` var that would be unnecessarily inlined into client code). Update WS-6.4's workflow to set `GITHUB_PAGES=tarvari-alert-viewer` instead.

### Conflict 4: Build Script Invocation (WS-6.3 vs WS-6.4) -- MEDIUM

**WS-6.3** defines specific build scripts:
```json
"build:static": "STATIC_EXPORT=true NEXT_PUBLIC_DATA_MODE=supabase next build --webpack"
"build:pages": "STATIC_EXPORT=true NEXT_PUBLIC_DATA_MODE=supabase GITHUB_PAGES=tarvari-alert-viewer next build --webpack"
```

**WS-6.4** workflow runs `pnpm build` (the default script), relying on env vars set in the workflow:
```yaml
run: pnpm build
```

These are incompatible. The default `pnpm build` does not set `STATIC_EXPORT=true`, so `next.config.ts` will not activate `output: 'export'`. The workflow must either:
- Call `pnpm build:pages` instead of `pnpm build`, or
- Set `STATIC_EXPORT=true` and `GITHUB_PAGES=tarvari-alert-viewer` as additional env vars alongside the existing ones.

Recommendation: the workflow should call `pnpm build:pages` (all env vars are bundled in the script) and remove the redundant `NEXT_PUBLIC_DATA_MODE` from the workflow env block (it is already in the script). Keep only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the workflow env block (these come from secrets and cannot be in the script).

### Conflict 5: Missing Hook -- useBundleDetail (WS-6.1 vs WS-6.2) -- LOW

**WS-6.2** creates `fetchBundleDetailFromSupabase` (Deliverable 4.5) but **WS-6.1** does not include `use-bundle-detail.ts` in its scope. WS-6.1 covers 5 hooks; WS-6.2 covers 5 functions plus the bundle detail function (6 total). The `use-bundle-detail.ts` hook needs a branching fetcher added by WS-6.1 or the bundle detail function is dead code.

Resolution: add `use-bundle-detail.ts` branching to WS-6.1 scope (Deliverable 4.8, analogous to the other hooks).

---

## 4. Architecture Decisions (Consolidated)

### AD-10: Build-Time Data Mode Switching (from combined-recommendations)

`NEXT_PUBLIC_DATA_MODE` (`'console'` | `'supabase'`) controls whether hooks fetch from TarvaRI API or Supabase directly. Build-time switching keeps the runtime simple -- no dynamic mode detection. The bundler dead-code-eliminates the unused path.

### Phase 6 Decisions

| ID | Decision | SOW | Rationale Summary |
|----|----------|-----|-------------------|
| P6-D1 | Single `DATA_MODE` constant, not a function | WS-6.1 D-1 | Build-time inlining gives best dead-code elimination. |
| P6-D2 | Default to `'console'` when env var unset | WS-6.1 D-2 | Preserves existing behavior; no config needed for dev environments. |
| P6-D3 | Branch inside each hook, not a generic abstraction | WS-6.1 D-3 | 5 hooks with unique signatures; generic wrapper adds complexity without reducing code. |
| P6-D4 | Rename existing fetch functions to `*FromConsole` | WS-6.1 D-4 | Preserves git blame; branching function takes original name. |
| P6-D5 | Static imports for both paths (no dynamic import) | WS-6.1 D-5 | `@supabase/supabase-js` already in dependency tree; dynamic import adds complexity without bundle savings. |
| P6-D6 | Single `fetchBundlesFromSupabase(viewMode)` function | WS-6.2 D-4 | Supabase queries differ by one `.eq()` filter; single parameterized function is cleaner. |
| P6-D7 | All Supabase functions in one file (`queries.ts`) | WS-6.2 D-2 | Small functions (20-40 lines), shared imports, always consumed as a group. |
| P6-D8 | Coverage metrics derived from intel feed, source fields zeroed | WS-6.2 D-3 | Source metadata is operationally sensitive; not appropriate for public exposure. |
| P6-D9 | Skip `Database` type updates for views | WS-6.2 D-5 | View schemas are backend-defined and unconfirmed; speculative types risk divergence. |
| P6-D10 | Omit bbox/sourceKey from Supabase queries | WS-6.2 D-6 | Requires PostGIS RPC or spatial index; backend concern, not frontend. |
| P6-D11 | Obtain Supabase client inside each function, not at module level | WS-6.2 D-7 | Avoids module-level side effects; safe for SSR/build contexts. |
| P6-D12 | `STATIC_EXPORT` env var activates static export (not separate config file) | WS-6.3 D-1 | Single config file with conditional logic; simpler than two configs that could drift. |
| P6-D13 | Vendor @tarva/ui as pre-built copy committed to repo | WS-6.3 D-2 | Pragmatic first step; unblocks CI immediately. npm publish is long-term solution. |
| P6-D14 | Rename `api/` to `_api-disabled/` during static build | WS-6.3 D-3 | App Router underscore convention; reversible; pre/post scripts automate it. |
| P6-D15 | Gate legacy API consumers on `NEXT_PUBLIC_DATA_MODE` | WS-6.3 D-4 | Consistent with WS-6.1 mode flag; enables dead-code elimination. |
| P6-D16 | Trailing slash for static export | WS-6.3 D-5 | GitHub Pages expects `path/index.html`; avoids 404s on direct navigation. |
| P6-D17 | Use official GitHub Pages deployment actions | WS-6.4 D-1 | Maintained by GitHub, OIDC auth, no PAT needed, environment integration. |
| P6-D18 | Two-job split (build + deploy) in workflow | WS-6.4 D-5 | Enables environment protection rules; clearer log separation. |
| P6-D19 | Static base path (`/tarvari-alert-viewer`) | WS-6.4 D-7 | Predictable, reviewable; avoids silent breaks on repo rename. |
| P6-D20 | `workflow_dispatch` for manual re-deployment | WS-6.4 D-6 | Supports credential rotation and retry without code commit. |

---

## 5. Cross-Workstream Dependencies

```
                   +---------+
                   | Backend |
                   | Phase E |
                   | (E.1)   |
                   +----+----+
                        |
                        | Creates Supabase views
                        | (runtime dependency, not build-blocking)
                        |
+----------+       +----v----+       +----------+       +----------+
|  WS-6.2  | ----> |  WS-6.1 | ----> |  WS-6.3  | ----> |  WS-6.4  |
| Supabase |       | Data    |       | Static   |       | GitHub   |
| Queries  |       | Mode    |       | Export   |       | Actions  |
|          |       | Branch  |       | Config   |       | Deploy   |
+----------+       +---------+       +----------+       +----------+
 react-dev          react-dev         react-dev          devops-eng

 Blocks: 6.1        Blocks: 6.3       Blocks: 6.4        Blocks: none
 Depends: none      Depends: 6.2      Depends: 6.1,6.2   Depends: 6.3
```

**Dependency details:**

| From | To | What Is Passed |
|------|----|---------------|
| WS-6.2 | WS-6.1 | 5 exported async functions from `src/lib/supabase/queries.ts` with type signatures matching hook return types. |
| WS-6.1 | WS-6.3 | `DATA_MODE` constant and `NEXT_PUBLIC_DATA_MODE` env var convention. WS-6.3 uses it to gate legacy API consumers. |
| WS-6.2 | WS-6.3 | Supabase query module must be importable at build time (no top-level side effects). |
| WS-6.3 | WS-6.4 | Build scripts (`build:static`, `build:pages`), vendored @tarva/ui, `STATIC_EXPORT` and `GITHUB_PAGES` env var conventions, pre/post build scripts for API route exclusion. |
| Backend E.1 | WS-6.2 (runtime) | Supabase views `public_intel_feed`, `public_coverage_map`, `public_bundles`, `public_bundle_detail` with RLS policies granting SELECT to anon role. |

**External dependencies:**

| Dependency | Required By | Status | Blocking? |
|-----------|-------------|--------|-----------|
| Backend Phase E.1 (Supabase views) | WS-6.2 runtime testing, deployed site functionality | Pending | No (build-time). Yes (deploy-time). |
| GitHub Pages enabled (repository setting) | WS-6.4 first deployment | Manual setup | Yes (one-time) |
| Repository secrets (SUPABASE_URL, SUPABASE_ANON_KEY) | WS-6.4 build step | Manual setup | Yes (one-time) |
| `@tarva/ui` vendored copy committed | WS-6.3, WS-6.4 CI build | Requires local dev action | Yes (build-blocking) |

---

## 6. Consolidated Open Questions

### Critical (must resolve before implementation)

| ID | Question | Source | Assigned To | Impact |
|----|----------|--------|-------------|--------|
| OQ-1 | **Supabase function naming:** Should exports use `supabaseXxx` (WS-6.1 convention) or `fetchXxxFromSupabase` (WS-6.2 convention)? | Conflict 1 | react-developer | Import statements across 5 hook files |
| OQ-2 | **Data mode value:** Should the non-supabase mode be called `'console'` (WS-6.1) or `'tarvari'` (WS-6.3 Section 4.4)? | Conflict 2 | react-developer | Type definition, all branching guards |
| OQ-3 | **Base path env var:** Should `next.config.ts` consume `GITHUB_PAGES` (WS-6.3) or `NEXT_PUBLIC_BASE_PATH` (WS-6.4)? | Conflict 3 | react-developer + devops | Workflow YAML + next.config.ts |
| OQ-4 | **Build script:** Should the workflow call `pnpm build:pages` or `pnpm build` with env vars? | Conflict 4 | devops-platform-engineer | Workflow correctness |
| OQ-5 | **Passphrase auth for public deployment:** Remove the gate in supabase mode, keep it, or replace with something meaningful? | WS-6.3 Q-2, WS-6.4 OQ-4, combined-rec Q5 | Product owner | User access to deployed site |

### High (should resolve before implementation)

| ID | Question | Source | Assigned To | Impact |
|----|----------|--------|-------------|--------|
| OQ-6 | What are the exact column names and types of the 4 public views? | WS-6.2 OQ-1 | Backend team | All `.select()` calls and mappings in queries.ts |
| OQ-7 | Does `public_coverage_map` store geometry as JSONB `geo` column or separate `lat`/`lng` columns? | WS-6.2 OQ-2 | Backend team | GeoJSON parsing logic in fetchCoverageMapDataFromSupabase |
| OQ-8 | Should supabase mode disable `refetchInterval` (polling) in hooks? | WS-6.1 Q-1 | Product owner | Bandwidth for public viewers |
| OQ-9 | Should public deployment expose bundles at all? | WS-6.2 OQ-3 | Product / Backend | 2 of 5 query functions may be unnecessary |

### Medium (resolve during implementation)

| ID | Question | Source | Assigned To | Impact |
|----|----------|--------|-------------|--------|
| OQ-10 | Should `data-mode.ts` log a warning for unrecognized mode values? | WS-6.1 Q-4 | react-developer | Developer experience |
| OQ-11 | Client-side vs server-side aggregation for coverage metrics? | WS-6.2 OQ-5, OQ-6 | Backend / react-developer | Performance at scale |
| OQ-12 | Does vendored @tarva/ui need CSS/style assets or is everything Tailwind? | WS-6.3 Q-3 | react-developer | Vendoring script |
| OQ-13 | Should `@anthropic-ai/sdk` be removed from dependencies for static builds? | WS-6.3 Q-4, WS-6.4 OQ-6 | react-developer | Install time (minor) |
| OQ-14 | Are there `<Link>` components with `href="/api/..."` that would break? | WS-6.3 Q-5 | react-developer | Broken links in static export |
| OQ-15 | What is the GitHub repository name? | WS-6.3 Q-1, WS-6.4 OQ-2 | Project owner | basePath value |
| OQ-16 | Should workflow include `pnpm typecheck` + `pnpm lint` pre-build? | WS-6.4 OQ-3 | devops-platform-engineer | CI time (+15-30s) vs safety |
| OQ-17 | Are there additional hooks beyond the 5 identified that call `tarvariGet`? | WS-6.1 Q-3 | react-developer | Scope completeness |
| OQ-18 | If WS-6.2 is incomplete when WS-6.1 is implemented, use stubs or sequence strictly? | WS-6.1 Q-2 | react-developer | Implementation order flexibility |

---

## 7. Phase Exit Criteria

Phase 6 is complete when ALL of the following are satisfied:

### Build Integrity

- [ ] `pnpm dev` works unchanged (no regression to local development)
- [ ] `pnpm build` (non-static, console mode) works unchanged
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with no new warnings or errors

### Data Mode Branching (WS-6.1 + WS-6.2)

- [ ] `src/lib/data-mode.ts` exports `DataMode`, `DATA_MODE`, `isSupabaseMode`, `isConsoleMode`
- [ ] `DATA_MODE` defaults to `'console'` when env var is unset
- [ ] All data hooks (5-6) import from both `@/lib/data-mode` and `@/lib/supabase/queries`
- [ ] Console mode produces identical behavior to pre-phase codebase (network tab shows only `localhost:8000` requests)
- [ ] TanStack Query configuration (queryKey, staleTime, refetchInterval, enabled) is identical across both modes
- [ ] `src/lib/supabase/queries.ts` exports all typed query functions with correct return types
- [ ] No hook directly imports from `@/lib/supabase/client` (queries module is the boundary)

### Static Export (WS-6.3)

- [ ] `pnpm build:static` completes without errors and produces an `out/` directory
- [ ] `out/` directory contains MapLibre GL chunks
- [ ] Serving `out/` with a static file server renders the login page and (post-login) the coverage map
- [ ] API routes remain functional during `pnpm dev`
- [ ] API routes are excluded from static build and restored after build
- [ ] `@tarva/ui` components render correctly in static export
- [ ] Vendored `@tarva/ui` directory exists and the build succeeds without `../../tarva-ui-library`
- [ ] Legacy API consumer hooks return graceful defaults in supabase mode (no fetch errors)

### Deployment (WS-6.4)

- [ ] `.github/workflows/deploy-pages.yml` is valid YAML and triggers on push to `main` + `workflow_dispatch`
- [ ] Workflow uses Node 22 + pnpm (never npm)
- [ ] Build step injects `NEXT_PUBLIC_DATA_MODE=supabase` and Supabase credentials from secrets
- [ ] Deployed site is accessible at GitHub Pages URL
- [ ] Deployed site renders the alert viewer (not blank page or error)
- [ ] Concurrent pushes to `main` cancel in-progress deployments

### End-to-End (requires Backend Phase E.1)

- [ ] Public viewer shows approved intel data from Supabase views
- [ ] No unapproved or sensitive data is visible
- [ ] Console mode (`DATA_MODE=console`) continues working normally alongside

---

## 8. Inputs Required by Next Phase

Phase 6 is the final phase in the Summaries & More plan. There is no Phase 7. However, the following outputs feed into operational and future work:

| Output | Produced By | Consumer | Description |
|--------|------------|----------|-------------|
| Deployed GitHub Pages URL | WS-6.4 | Stakeholders, demo audiences | Public URL for the alert viewer |
| `NEXT_PUBLIC_DATA_MODE` convention | WS-6.1 | Future hooks, new data features | Any new data hook must follow the branching pattern |
| Vendored @tarva/ui | WS-6.3 | CI pipeline, any future workflow | Must be updated when @tarva/ui changes |
| `build:static` / `build:pages` scripts | WS-6.3 | CI, local testing | Entry points for static export builds |
| Supabase view contract | WS-6.2 (assumed), Backend E.1 (delivers) | Any new Supabase query function | Column schemas for public views |

**Deferred items that Phase 6 enables:**

| Item | Trigger |
|------|---------|
| Custom domain for GitHub Pages | Post-deployment DNS configuration |
| PR preview deployments (Vercel/Netlify) | When PR review needs live previews |
| PWA/service worker for offline access | If public viewer needs offline support |
| Publish @tarva/ui to npm (replace vendoring) | When registry infrastructure is ready |
| Supabase `Database` type updates for views | When view schemas are confirmed by backend |
| Client-side bbox filtering in Supabase mode | If map performance requires viewport-based filtering |
| Post-deployment smoke test in CI | When deployment reliability needs automated verification |

---

## 9. Gaps and Recommendations

### Gap 1: Naming Inconsistencies Across SOWs (CRITICAL)

**Finding:** Three naming conflicts exist between workstreams (Conflicts 1, 2, 3 in Section 3). If implemented as-written, the code will not compile.

**Recommendation:** Before any implementation begins, the react-developer must produce a single "Phase 6 Naming Contract" document that resolves:
- Supabase function export names (recommend `fetch*FromSupabase`)
- Data mode value names (recommend `'console' | 'supabase'`, never `'tarvari'`)
- Base path env var name (recommend `GITHUB_PAGES`, non-`NEXT_PUBLIC_`)

### Gap 2: useBundleDetail Hook Missing from WS-6.1 (HIGH)

**Finding:** WS-6.2 creates `fetchBundleDetailFromSupabase` but WS-6.1 does not add branching to `use-bundle-detail.ts`. This means the bundle detail view will always call the TarvaRI API, even in supabase mode.

**Recommendation:** Add a Deliverable 4.8 to WS-6.1 covering `use-bundle-detail.ts`, following the same branching pattern as the other 5 hooks.

### Gap 3: No UI Adaptation for Zeroed Source Metrics (MEDIUM)

**Finding:** WS-6.2 D-3 zeroes source-level fields in `CoverageMetrics` for public mode. Components like `CoverageOverviewStats` and `CategoryCard` will display `0` for source counts. No workstream addresses hiding or adapting these UI elements.

**Recommendation:** Add a small follow-up task: in supabase mode, conditionally hide source-count displays (e.g., the "Sources" and "Active Sources" labels in overview stats, the `sourceCount` display in category cards). This can be gated on `isSupabaseMode` from `data-mode.ts`. Note: Phase 0 (AD-9) already removes the redundant "Sources" and "Active" rows from CoverageOverviewStats, which partially addresses this. Verify that no remaining UI surfaces display zeroed source data.

### Gap 4: No Integration Test Plan (MEDIUM)

**Finding:** Each SOW defines acceptance criteria for its own deliverables, but no SOW covers end-to-end integration testing of the full build-deploy pipeline. The closest is WS-6.3 AC-12 (build in clean environment) and WS-6.4 AC-15 (manual visual verification).

**Recommendation:** Define a Phase 6 integration test checklist:
1. Clean checkout of the repository (no `../../tarva-ui-library`)
2. Run `bash scripts/ci-install.sh`
3. Run `pnpm build:pages`
4. Serve `out/` and verify login, map rendering, and data display
5. Simulate the full GitHub Actions workflow locally with `act` (optional)

### Gap 5: Pre/Post Build Script Robustness (MEDIUM)

**Finding:** WS-6.3's API route exclusion uses `mv` in pre/post build scripts. If the build fails between pre and post, `src/app/api/` remains renamed to `src/app/_api-disabled/`. The developer must manually restore it.

**Recommendation:** Add a trap or error handler:
```bash
trap '[ -d src/app/_api-disabled ] && mv src/app/_api-disabled src/app/api' EXIT
```
Or use a wrapper script that always restores regardless of build exit code.

### Gap 6: No Post-Deployment Verification (LOW)

**Finding:** WS-6.4 explicitly scopes out post-deployment health checks. The first indication of a broken deployment is a user report.

**Recommendation:** Add a lightweight post-deploy step to the workflow:
```yaml
- name: Verify deployment
  run: curl -sf "${{ steps.deployment.outputs.page_url }}" | grep -q '<title>' || exit 1
```
This adds ~5 seconds and catches blank-page failures immediately.

### Gap 7: Lockfile Divergence Risk (LOW)

**Finding:** WS-6.3 R-7 acknowledges that `pnpm install --frozen-lockfile` may fail in CI when the workspace is rewritten from `../../tarva-ui-library` to `vendor/@tarva-ui`. The recommended mitigation (`--no-frozen-lockfile`) weakens reproducibility.

**Recommendation:** Maintain a CI-specific lockfile (`pnpm-lock-ci.yaml`) generated by the vendoring script, or use `pnpm install --frozen-lockfile=false` (pnpm v9 syntax) with a subsequent `pnpm store prune` to keep the store clean. Document the tradeoff explicitly.

---

## 10. Effort & Sequencing Assessment (PMO)

### Effort Breakdown

| WS | Estimated Size | Story Points (T-shirt) | Calendar Days | Notes |
|----|---------------|----------------------|---------------|-------|
| 6.2 | M | 5 | 1 | Purely additive (1 new file). Low risk. Can stub if views unknown. |
| 6.1 | M | 5 | 1 | Mechanical pattern applied to 5-6 hooks. Blocked on WS-6.2. |
| 6.3 | M | 8 | 1.5-2 | Largest scope: next.config.ts + vendoring + API exclusion + 9 file modifications. Highest complexity. |
| 6.4 | S | 3 | 0.5 | Single YAML file. Depends on WS-6.3 decisions. |
| **Total** | | **21** | **3.5-4.5** | |

### Recommended Execution Sequence

```
Day 1 (morning)    WS-6.2: Create supabase/queries.ts (1 new file, ~200 lines)
Day 1 (afternoon)  WS-6.1: Add branching to 5-6 hooks + create data-mode.ts
                   Verify: pnpm typecheck + pnpm build (console mode)

Day 2              WS-6.3: Static export configuration
                   - Modify next.config.ts
                   - Add build scripts
                   - Vendor @tarva/ui (requires local tarva-ui-library)
                   - API route exclusion scripts
                   - Modify 9 legacy API consumer files
                   Verify: pnpm build:static + serve out/ + smoke test

Day 3 (morning)    WS-6.4: Create deploy-pages.yml
                   Verify: Push to main, observe GitHub Actions run

Day 3 (afternoon)  Integration testing + conflict resolution
                   Manual setup: enable GitHub Pages, create secrets
                   End-to-end verification (requires Backend Phase E.1)
```

### Critical Path

```
WS-6.2 (1d) --> WS-6.1 (1d) --> WS-6.3 (1.5-2d) --> WS-6.4 (0.5d) = 4-4.5 days
```

No parallelism is possible within Phase 6. The critical path IS the only path.

### Risk-Adjusted Estimate

| Scenario | Duration | Assumptions |
|----------|----------|-------------|
| Best case | 3 days | No naming conflicts, @tarva/ui vendors cleanly, MapLibre works in static export |
| Expected | 4 days | 1 naming conflict resolution, minor vendoring issues, MapLibre works |
| Worst case | 6 days | Multiple naming conflicts, @tarva/ui vendoring fails (need alternative strategy), MapLibre requires script-tag fallback, lockfile issues in CI |

### Phase 6 in Context (Full Plan)

Phase 6 is the final viewer phase. It depends only on Backend Phase E (not on any earlier viewer phase). It can execute in parallel with Phase 4 (Geo Intelligence) or Phase 5 (Enhanced Filters) since there are no inter-phase dependencies.

```
Recommended schedule from combined-recommendations:
Day 12-15:   Phase 6 (public deploy) -- parallel with Phase 4

Phase 6 internal critical path:
Day 12:      WS-6.2 + WS-6.1
Day 13-14:   WS-6.3
Day 15:      WS-6.4 + integration test + deploy
```

### Go/No-Go Checklist

Before starting Phase 6 implementation:

- [ ] Naming conflicts resolved (Section 3, Gap 1)
- [ ] `useBundleDetail` scope confirmed for WS-6.1 (Gap 2)
- [ ] Backend Phase E.1 view schemas confirmed or explicitly accepted as assumptions (OQ-6, OQ-7)
- [ ] Passphrase auth decision made (OQ-5)
- [ ] GitHub repository name confirmed (OQ-15)
- [ ] `../../tarva-ui-library` available locally for initial vendoring
- [ ] GitHub Pages enabled on repository (manual setup)
- [ ] Repository secrets created (SUPABASE_URL, SUPABASE_ANON_KEY)
