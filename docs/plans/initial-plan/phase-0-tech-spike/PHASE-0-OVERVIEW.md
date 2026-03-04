# Phase 0 Overview: Tech Spike & Setup

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md (pending creation)
> **Phase Objective:** Validate the CSS transforms ZUI approach end-to-end and establish the project foundation.
> **Estimated Complexity:** S (1 week)
> **Workstreams:** WS-0.1 (Project Scaffolding), WS-0.2 (Design Tokens Setup), WS-0.3 (ZUI Tech Spike)
> **Date:** 2026-02-25

---

## 1. Executive Summary

Phase 0 is the foundation-and-gate phase for Tarva Launch. It has two purposes: (1) scaffold a fully buildable Next.js 16 + TypeScript + Tailwind v4 project with the complete design token vocabulary, and (2) run a structured tech spike that proves -- or disproves -- that CSS transforms can sustain 60fps spatial navigation with 10+ DOM elements. Every subsequent phase depends on this gate passing.

Three workstreams cover the scope. WS-0.1 (Project Scaffolding) creates the greenfield codebase with directory structure, toolchain, skeleton stores, and `@tarva/ui` integration. WS-0.2 (Design Tokens Setup) defines all ~89 spatial design tokens as CSS custom properties and registers them in the Tailwind v4 `@theme` namespace. WS-0.3 (ZUI Tech Spike) implements a camera store, spatial math utilities, pan/zoom/momentum/culling, and a test harness, then runs a quantitative performance protocol culminating in a go/no-go verdict.

The three SOWs are architecturally coherent, with five specific conflicts identified (Section 3) -- all resolvable. The most significant planning risk is the react-developer bottleneck: the same agent owns both WS-0.1 and WS-0.3 in serial, leaving approximately 4-5 working days for the spike within a 5-7 day window. One open question (OQ-1: `@tarva/ui` installation method) is blocking and must be resolved before execution begins.

---

## 2. Key Findings (grouped by theme)

### Spatial Engine Architecture

- **CSS transforms approach is consistently specified.** All three SOWs and the discovery artifacts (AD-1, AD-3, Gap Resolution #1, tech-decisions.md) agree on the single-container CSS transform architecture: `<SpatialViewport>` captures events, `<SpatialCanvas>` receives `transform: translate(x, y) scale(z)`, and Zustand `subscribe()` writes directly to `element.style.transform` to bypass React reconciliation. No contradictions across documents.
- **Camera store API will evolve during Phase 0.** WS-0.1 creates a skeleton camera store with simple setters (`setPosition`, `setZoom`). WS-0.3 replaces it with a physics-aware store (`panBy`, `zoomTo`, `flyTo`, `resetToLaunch`). This replacement is expected but not explicitly documented (see Conflict #2).
- **Go/no-go criteria are well-defined.** WS-0.3 defines a 9-criterion decision matrix with three verdict levels. The thresholds (55fps avg for GO, 45 for CONDITIONAL GO) are realistic for CSS transforms. The spike resolves 4 project-level risks (R#2, R#6) and validates 2 assumptions (A#6, A#8).

### Design Token System

- **Token values are traceable to VISUAL-DESIGN-SPEC.md Section 6.1.** WS-0.2 transcribes all token values verbatim from the canonical spec. Decision D-0.2.5 correctly establishes Section 6.1 as the precedence source when narrative sections contain slightly different values.
- **Dual-layer token architecture is sound.** The `@theme inline` block bridges `@tarva/ui` semantic tokens (runtime `var()` references), while the `@theme` block registers spatial tokens with static hex values. This two-block pattern is proven in the Agent Builder codebase and documented in Tailwind v4 conventions.
- **Glow tokens require arbitrary-value syntax.** Compound `box-shadow` values cannot be registered in `@theme`. They are CSS custom properties consumed via `shadow-[var(--glow-ember-subtle)]`. WS-0.2 R-0.2.3 correctly flags this as a risk needing runtime validation.
- **One token override conflict exists.** `--duration-instant` is `0ms` in `@tarva/ui` but `100ms` in the Launch spatial tokens. Import order (spatial-tokens.css after @tarva/ui/styles.css) means Launch's value wins. Impact on @tarva/ui component animations needs verification during WS-0.2 execution.

### Toolchain and Project Foundation

- **The toolchain is fully specified and ecosystem-consistent.** Next.js 16, React 19, TypeScript strict, Tailwind v4 CSS-first, ESLint 9 flat config, Prettier with Tailwind plugin, pnpm, Zustand 5 with immer -- all matching the Agent Builder reference patterns.
- **`@tarva/ui` integration is the primary dependency risk.** Three of the four WS-0.1 risks relate to `@tarva/ui` availability or compatibility. OQ-1 (installation method: npm registry vs. `link:` protocol) is flagged as blocking by WS-0.1 and must be resolved before execution.
- **Forced dark mode is consistently applied.** All SOWs agree: `forcedTheme="dark"`, `colorScheme="tarva-core"`, no theme toggle, no light mode. This is correct per VISUAL-DESIGN-SPEC.md.

### Naming and Terminology Compliance

- **"ember"/"teal" naming is used consistently** across all SOWs. No instances of "frost," "cyan," or other prohibited color names.
- **"@tarva/ui" is used correctly** throughout. No standalone "shadcn" references.
- **"(launch)/" route group is used consistently** in all SOWs. However, AD-9 in combined-recommendations.md still references `(hub)/`. WS-0.3 D6 documents this as an intentional deviation per PLANNING-LOG.md Deviation #2.

---

## 3. Cross-Workstream Conflicts

### Conflict #1: `globals.css` and `layout.tsx` Dual Ownership

**SOWs involved:** WS-0.1 (Section 4.6, 4.11) vs. WS-0.2 (Section 4.1, 4.4)

**Disagreement:** Both WS-0.1 and WS-0.2 specify full file contents for `src/app/globals.css` and `src/app/layout.tsx`. The versions differ in substantive ways:

| File          | WS-0.1 Version                               | WS-0.2 Version                                                                                                                                   |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `globals.css` | Minimal `@theme inline` with 19 color tokens | Expanded `@theme inline` with 31 color tokens (adds sidebar-_, chart-_), plus `@import '../styles/spatial-tokens.css'` and a full `@theme` block |
| `layout.tsx`  | Includes `QueryProvider` wrapping children   | Omits `QueryProvider` entirely                                                                                                                   |
| `layout.tsx`  | `defaultTheme="dark"` + `forcedTheme="dark"` | Only `forcedTheme="dark"` + `enableSystem={false}`                                                                                               |

**Resolution recommendation:** WS-0.2 should be treated as a MODIFICATION of the WS-0.1 baseline, not a replacement. Specifically:

1. WS-0.2's `globals.css` supersedes WS-0.1's version (WS-0.2's is the complete version).
2. WS-0.2's `layout.tsx` must PRESERVE the `QueryProvider` from WS-0.1. The omission appears to be an oversight, not a deliberate removal -- TanStack Query is a core dependency per tech-decisions.md.
3. The `ThemeProvider` props should use WS-0.2's configuration (`forcedTheme="dark"`, `enableSystem={false}`, no `defaultTheme`) as it is the more precise specification.

**Severity:** Low. Resolvable by instructing the WS-0.2 implementer to merge rather than replace.

### Conflict #2: `camera.store.ts` API Surface

**SOWs involved:** WS-0.1 (Section 4.18) vs. WS-0.3 (Section 4.1.1)

**Disagreement:** WS-0.1 creates a skeleton camera store with these actions: `setPosition(x, y)`, `setZoom(zoom)`, `setSemanticLevel(level)`, `reset()`. WS-0.3 requires a fundamentally different API: `panBy(dx, dy)`, `zoomTo(nextZoom, cursorX, cursorY)`, `flyTo(targetX, targetY, targetZoom)`, `resetToLaunch()`, `setCamera(patch)`, `setAnimating(animating)`. The type name also differs: WS-0.1 uses `SemanticLevel`; WS-0.3 uses `SemanticZoomLevel`. WS-0.3 adds an `isAnimating` state field not present in WS-0.1.

**Resolution recommendation:** WS-0.1 should create the camera store as a MINIMAL STUB -- just the type exports and an empty store with placeholder state -- with an explicit comment that WS-0.3 will replace the implementation. Alternatively, WS-0.1 could adopt WS-0.3's type names (`SemanticZoomLevel`, `CameraState` with `isAnimating`) in the skeleton to avoid downstream confusion. The simpler approach: WS-0.1 creates the file with WS-0.3's types but only the state shape (no action implementations), and WS-0.3 fills in the actions.

**Severity:** Low. WS-0.3 runs after WS-0.1 and will replace the file regardless. The risk is that WS-0.2 or other parallel work might import the WS-0.1 skeleton and depend on its API shape. Since WS-0.2 does not import camera state, this risk is contained.

### Conflict #3: Missing `src/styles/` Directory

**SOWs involved:** WS-0.1 (Section 4.1) vs. WS-0.2 (Section 4.2)

**Disagreement:** WS-0.2 creates `src/styles/spatial-tokens.css`, but WS-0.1's directory structure (Section 4.1) does not include a `src/styles/` directory. AD-9 in combined-recommendations.md also does not list this directory.

**Resolution recommendation:** Add `src/styles/.gitkeep` to WS-0.1's directory structure (Section 4.1). This is a one-line addition that unblocks WS-0.2. Alternatively, WS-0.2 can note that it creates this directory as part of its deliverables.

**Severity:** Trivial. The implementer will create the directory regardless.

### Conflict #4: Spacing Token Naming Prefix

**SOWs involved:** WS-0.2 (Section 4.2 vs. Section 4.1)

**Disagreement (internal to WS-0.2):** The spatial-tokens.css file uses `--space-*` prefix (e.g., `--space-capsule-padding`), while the `@theme` block in globals.css uses `--spacing-*` prefix (e.g., `--spacing-capsule-padding`). VISUAL-DESIGN-SPEC.md itself exhibits the same split: Section 6.1 uses `--space-*` and Section 6.2 uses `--spacing-*`. This means the same value is accessible under two different names: `var(--space-capsule-padding)` in CSS and `spacing-capsule-padding` as a Tailwind utility.

**Resolution recommendation:** This is intentional -- Tailwind v4 auto-detects `--spacing-*` tokens for spacing utilities, while the `:root` CSS custom properties use the shorter `--space-*` prefix. Document this dual-naming convention in the design tokens README or in a code comment in `globals.css` to prevent developer confusion. Ensure components use `--spacing-*` in Tailwind classes and `var(--space-*)` in raw CSS.

**Severity:** Low. Functionally correct but a source of potential confusion.

### Conflict #5: WS-0.3 File Path Prefix Omission

**SOWs involved:** WS-0.3 (Appendix A) vs. WS-0.1 (Section 4.1)

**Disagreement:** WS-0.3 Appendix A lists `app/(launch)/spike/page.tsx` without the `src/` prefix. The project uses a `src/` directory structure (WS-0.1 Section 4.1 shows `src/app/(launch)/page.tsx`). All other WS-0.3 file paths correctly include `src/`.

**Resolution recommendation:** Correct the path in WS-0.3 Appendix A and Section 4.1.5 to `src/app/(launch)/spike/page.tsx`.

**Severity:** Trivial. Typographical error.

---

### File Modification Convention

When a later workstream provides full file contents for a file already created by an earlier workstream, the later version supersedes the earlier version entirely. Any elements from the earlier version that must be preserved are explicitly listed in the later SOW's deliverable section.

| File                                          | Created By | Superseded By | Preservation Notes                                            |
| --------------------------------------------- | ---------- | ------------- | ------------------------------------------------------------- |
| `src/app/globals.css`                         | WS-0.1     | WS-0.2        | Full replacement. WS-0.2 version is complete.                 |
| `src/app/layout.tsx`                          | WS-0.1     | WS-0.2        | Full replacement. WS-0.2 preserves QueryProvider from WS-0.1. |
| `src/stores/camera.store.ts`                  | WS-0.1     | WS-0.3        | Full replacement. WS-0.3 has spike-validated API.             |
| `src/components/providers/theme-provider.tsx` | WS-0.1     | WS-0.2        | Identical content. No conflict.                               |

---

## 4. Architecture Decisions (consolidated from all SOWs)

| ID                         | Decision                                                                                               | Rationale                                                                                                     | SOW Source                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Theme & Visual**         |                                                                                                        |                                                                                                               |                            |
| D-THEME-1                  | Force dark mode via `forcedTheme="dark"`                                                               | Launch is a spatial ZUI designed exclusively for dark backgrounds. No light mode exists in the design spec.   | WS-0.1 D-1, WS-0.2 D-0.2.1 |
| D-THEME-2                  | Separate spatial tokens into `src/styles/spatial-tokens.css`                                           | Keeps globals.css focused on Tailwind config; spatial-tokens.css becomes the single editable source of truth. | WS-0.2 D-0.2.2             |
| D-THEME-3                  | Use `@theme` (static values) for spatial tokens, `@theme inline` (var references) for @tarva/ui bridge | Spatial tokens use static hex values for tree-shaking; @tarva/ui tokens resolve at runtime via CSS variables. | WS-0.2 D-0.2.3             |
| D-THEME-4                  | Section 6.1 of VISUAL-DESIGN-SPEC.md is canonical when values conflict with narrative sections         | Finalized values supersede exploratory values in earlier sections.                                            | WS-0.2 D-0.2.5             |
| D-THEME-5                  | Glow tokens as CSS custom properties, not Tailwind @theme entries                                      | Tailwind v4 @theme does not support multi-value box-shadow. Consumed via arbitrary-value syntax.              | WS-0.2 D-0.2.6             |
| D-THEME-6                  | Capsule dimensions and opacity tokens are CSS-only, not in @theme                                      | Spatial engine internals, not general-purpose utilities. Avoids polluting the utility namespace.              | WS-0.2 D-0.2.7, D-0.2.8    |
| **Toolchain & Project**    |                                                                                                        |                                                                                                               |                            |
| D-TOOL-1                   | Use `next/font/google` for Geist fonts (not the `geist` npm package)                                   | Matches Agent Builder, enables Next.js font optimization (preload, no layout shift).                          | WS-0.1 D-2                 |
| D-TOOL-2                   | Re-export ThemeProvider through `"use client"` wrapper                                                 | @tarva/ui compiled chunks lose `"use client"` during code-splitting, causing SSR failures.                    | WS-0.1 D-3                 |
| D-TOOL-3                   | CSS-first Tailwind v4 integration via `@theme inline` in globals.css                                   | Tailwind v4 uses CSS config, not tailwind.config.ts. `@source` directive scans @tarva/ui dist.                | WS-0.1 D-4                 |
| D-TOOL-4                   | Immer middleware for all Zustand stores                                                                | Immutable updates with mutable syntax; consistent with Agent Builder patterns.                                | WS-0.1 D-5                 |
| D-TOOL-5                   | Standalone project (no pnpm workspace)                                                                 | Tarva Launch is not a monorepo. @tarva/ui consumed as published package.                                      | WS-0.1 D-6                 |
| D-TOOL-6                   | Prettier: no semicolons, single quotes, ES5 trailing commas                                            | Matches Agent Builder `.prettierrc` for ecosystem consistency.                                                | WS-0.1 D-7                 |
| D-TOOL-7                   | TanStack Query staleTime 30s default                                                                   | Balances telemetry freshness with avoiding unnecessary refetches. Overridable per-query.                      | WS-0.1 D-8                 |
| D-TOOL-8                   | Providers directory under `components/` (not co-located in `app/`)                                     | Provider components are shared infrastructure, not route-specific. Matches Agent Builder.                     | WS-0.1 D-9                 |
| **Spatial Engine (Spike)** |                                                                                                        |                                                                                                               |                            |
| D-SPIKE-1                  | Spike code lives in production project (not separate repo)                                             | Validates actual build environment; successful code seeds WS-1.1; spike route removed after.                  | WS-0.3 D1                  |
| D-SPIKE-2                  | Camera store uses immer despite performance sensitivity                                                | `subscribe()` bypasses React; immer only runs in state update functions (once per rAF frame).                 | WS-0.3 D2                  |
| D-SPIKE-3                  | Custom FPS monitor utility (not stats.js)                                                              | Lightweight, embeddable, produces exportable data for the report. ~40 lines.                                  | WS-0.3 D3                  |
| D-SPIKE-4                  | Placeholder elements match production capsule dimensions (192x228px, 28px radius)                      | Realistic element sizes produce more representative performance data.                                         | WS-0.3 D4                  |
| D-SPIKE-5                  | Spike does not test particles or ambient CSS animations                                                | Particles (Canvas) and CSS @keyframes run on separate threads, orthogonal to spatial engine perf.             | WS-0.3 D5                  |
| D-SPIKE-6                  | Route group is `(launch)/` not `(hub)/`                                                                | Per PLANNING-LOG.md Deviation #2: hub-to-launch rename consistency.                                           | WS-0.3 D6                  |
| D-SPIKE-7                  | Spike does not integrate design tokens                                                                 | Isolates spatial engine performance from token system complexity. Uses inline styles.                         | WS-0.3 D7                  |
| D-SPIKE-8                  | Zoom-to-cursor uses viewport-relative coordinates                                                      | Avoids bugs when viewport does not start at (0,0) in the page. Standard practice.                             | WS-0.3 D8                  |

---

## 5. Cross-Workstream Dependencies

```
WS-0.1 (Project Scaffolding)
  |
  +---> WS-0.2 (Design Tokens Setup)     [parallel]
  |       Needs: src/app/ structure, postcss.config.mjs, @tarva/ui installed
  |       Creates: src/styles/spatial-tokens.css (NEW directory)
  |
  +---> WS-0.3 (ZUI Tech Spike)          [parallel]
          Needs: Next.js project, TypeScript strict, Tailwind v4, directory per AD-9
          Replaces: src/stores/camera.store.ts (from WS-0.1 skeleton)
          Does NOT need: WS-0.2 tokens (uses inline styles)
```

**Key dependency facts:**

- WS-0.2 and WS-0.3 are INDEPENDENT of each other. WS-0.3 explicitly isolates from design tokens (D-SPIKE-7).
- WS-0.2 and WS-0.3 both depend only on WS-0.1.
- WS-0.2 modifies two WS-0.1 files (`globals.css`, `layout.tsx`) and creates one new directory (`src/styles/`).
- WS-0.3 replaces one WS-0.1 file (`camera.store.ts`) and creates ~12 new files.
- Both WS-0.2 and WS-0.3 use the `theme-provider.tsx` and `providers/` directory created by WS-0.1 without modification.

**External dependencies (outside Phase 0):**

- `@tarva/ui` v1.0.0+ must be installable (OQ-1 -- blocking).
- Agent Builder reference codebase (`tarva-claude-agents-frontend`) is read-only reference for patterns.
- `@tarva/ui` library source (`tarva-ui-library`) is read-only reference for token verification.

---

## 6. Consolidated Open Questions

### Blocking (must resolve before execution)

| ID   | Question                                                                                 | SOW    | Impact                                     | Recommended Owner |
| ---- | ---------------------------------------------------------------------------------------- | ------ | ------------------------------------------ | ----------------- |
| OQ-1 | How will `@tarva/ui` be installed? (npm registry, private registry, or `link:` protocol) | WS-0.1 | Blocks `pnpm install` for the entire phase | Project Lead      |

### Should Resolve Before Execution

| ID      | Question                                                                                        | SOW    | Impact                                                 | Recommended Owner |
| ------- | ----------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------ | ----------------- |
| OQ-4    | Should `.nvmrc` or `packageManager` field enforce Node 22+ and pnpm version?                    | WS-0.1 | Developer onboarding reliability                       | Project Lead      |
| Q-0.2.4 | Does the `--duration-instant` override (0ms -> 100ms) break any @tarva/ui component animations? | WS-0.2 | Could cause subtle timing bugs in @tarva/ui components | react-developer   |

### Answered During Execution

| ID      | Question                                                                               | SOW    | Resolved By                                          |
| ------- | -------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------- |
| OQ-2    | Include `tw-animate-css` as a dependency?                                              | WS-0.1 | WS-0.2 execution (if animations need it)             |
| OQ-3    | Include `@supabase/ssr` alongside `@supabase/supabase-js`?                             | WS-0.1 | WS-1.3 (Login Experience)                            |
| Q-0.2.1 | Does the `@source` directive path need adjustment for pnpm?                            | WS-0.2 | WS-0.2 execution (verify after WS-0.1)               |
| Q-0.2.2 | Will `next/font/google` work in air-gapped CI, or switch to `next/font/local`?         | WS-0.2 | WS-0.1 execution (no CI in Phase 0, defer)           |
| Q-0.2.3 | Does `--spacing-hud-inset-lg` auto-register in Tailwind or need explicit @theme entry? | WS-0.2 | WS-0.2 execution (test empirically)                  |
| Q1      | What scroll wheel delta factor feels best for zoom? (0.001, 0.002, 0.003)              | WS-0.3 | Spike testing                                        |
| Q2      | Permanent vs. toggled `will-change: transform`?                                        | WS-0.3 | Spike testing (compare FPS)                          |
| Q3      | Does `transform-origin: 0 0` vs `50% 50%` affect zoom-to-cursor formula?               | WS-0.3 | Spike testing (set 0 0 explicitly)                   |
| Q4      | Does SpatialCanvas need `pointer-events: none`?                                        | WS-0.3 | Spike testing                                        |
| Q5      | Optimal spring config for flyTo?                                                       | WS-0.3 | Spike testing (start with stiffness:170, damping:26) |
| Q6      | Culling via unmount vs. `visibility: hidden`?                                          | WS-0.3 | Spike testing (compare FPS with 30+ elements)        |

---

## 7. Phase Exit Criteria

| #     | Criterion                                                                                                                                                | Met?    | Evidence                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------- |
| EC-1  | Project scaffolding complete: `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm format:check` all pass with zero errors | Pending | WS-0.1 AC-1 through AC-6                                                                              |
| EC-2  | AD-9 directory structure exists with all directories and placeholder files                                                                               | Pending | WS-0.1 AC-7 (verified via `find src -type d`)                                                         |
| EC-3  | `@tarva/ui` ThemeProvider renders with forced dark mode and Geist fonts                                                                                  | Pending | WS-0.1 AC-9 (visual inspection at localhost:3000)                                                     |
| EC-4  | All ~89 spatial design tokens defined in `src/styles/spatial-tokens.css` with values matching VISUAL-DESIGN-SPEC.md Section 6.1                          | Pending | WS-0.2 AC-2 (token parity check)                                                                      |
| EC-5  | Spatial tokens produce working Tailwind utilities (`bg-void`, `text-ember-bright`, `duration-morph`, `ease-hover`, etc.)                                 | Pending | WS-0.2 AC-3 (utility generation verification)                                                         |
| EC-6  | ZUI spike harness runs: pan (click-drag), zoom (scroll wheel), semantic level switching, viewport culling, and flyTo spring animation all functional     | Pending | WS-0.3 AC-1 through AC-9                                                                              |
| EC-7  | 60fps target validated: >= 55 avg FPS with 10 elements during sustained pan/zoom (no backdrop-filter)                                                    | Pending | WS-0.3 AC-4 (FPS monitor + Chrome DevTools)                                                           |
| EC-8  | Spike report written with quantitative data and go/no-go verdict                                                                                         | Pending | WS-0.3 AC-12, AC-13 (file exists at `docs/plans/initial-plan/phase-0-tech-spike/spike-report-zui.md`) |
| EC-9  | Go/No-Go verdict is GO or CONDITIONAL GO                                                                                                                 | Pending | WS-0.3 Section 4.4 decision matrix                                                                    |
| EC-10 | All blocking open questions resolved (OQ-1 at minimum)                                                                                                   | Pending | Pre-execution resolution confirmed                                                                    |

**Phase 0 is COMPLETE when:** EC-1 through EC-8 are met, AND EC-9 yields GO or CONDITIONAL GO, AND EC-10 is resolved. If EC-9 yields NO GO, Phase 0 is complete but Phase 1 scope changes (pivot to R3F hybrid per tech-decisions.md fallback).

---

## 8. Inputs Required by Next Phase

Phase 1 (Spatial Core + Login) requires the following outputs from Phase 0:

| Input                                                                        | Source                   | Consumed By                                                          |
| ---------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Buildable, linted, type-safe Next.js 16 project                              | WS-0.1                   | All Phase 1 workstreams                                              |
| Complete design token system (spatial-tokens.css + globals.css @theme)       | WS-0.2                   | WS-1.2 (Launch Atrium), WS-1.3 (Login), WS-1.6 (Ambient Effects)     |
| Go/No-Go verdict (GO or CONDITIONAL GO)                                      | WS-0.3 spike report      | Phase 1 planning: confirms CSS transforms architecture               |
| Camera store final API shape                                                 | WS-0.3 `camera.store.ts` | WS-1.1 (ZUI Engine) -- spike store becomes seed for production       |
| Spatial math utilities (zoom-to-cursor, momentum, culling, spring)           | WS-0.3 `spatial-math.ts` | WS-1.1 (ZUI Engine) -- spike math becomes production code            |
| Tuned spatial parameters (friction, spring config, zoom factor, cull margin) | WS-0.3 spike report      | WS-1.1 constants; values documented in spike report recommendations  |
| FPS vs. element count scaling curve                                          | WS-0.3 spike report      | WS-1.1 + WS-1.2 -- informs maximum element count per view            |
| Backdrop-filter mitigation strategy (confirmed or revised)                   | WS-0.3 spike report      | WS-1.2 (capsule glass material), WS-1.6 (ambient effects during pan) |
| Semantic zoom hysteresis thresholds (confirmed or adjusted)                  | WS-0.3 spike report      | WS-1.1 (production zoom level config)                                |
| Culling strategy recommendation (unmount vs. visibility)                     | WS-0.3 spike report      | WS-1.1 (ViewportCuller implementation)                               |
| Text readability assessment per zoom level                                   | WS-0.3 spike report      | WS-1.2 (capsule typography), WS-2.7 (Constellation View Z0)          |

**If NO GO:** The spike report must include R3F hybrid evaluation notes and a revised Phase 1 SOW outline. The design tokens and project scaffolding remain valid regardless of the spatial engine choice.

---

## 9. Gaps and Recommendations

### Gap 1: `src/styles/` Directory Not in WS-0.1 or AD-9

**Impact:** WS-0.2 creates `src/styles/spatial-tokens.css` but WS-0.1 does not create the `src/styles/` directory.

**Recommendation:** Add `src/styles/.gitkeep` to WS-0.1 Section 4.1 directory tree. Update AD-9 in combined-recommendations.md to include `src/styles/` as a recognized directory for Launch-specific CSS.

### Gap 2: AD-9 in `combined-recommendations.md` Still References `(hub)/`

**Impact:** AD-9 says `(hub)/` but all SOWs use `(launch)/`. The upstream artifact is stale.

**Recommendation:** Update AD-9 in combined-recommendations.md to use `(launch)/`. Reference PLANNING-LOG.md Deviation #2 as the authority for this rename.

### Gap 3: No Testing Framework in Phase 0

**Impact:** WS-0.1 defers Vitest setup. WS-0.3 creates pure spatial math functions (`zoomToPoint`, `resolveSemanticLevel`, `applyMomentumDecay`, `springStep`) that are ideal unit test candidates. The spike would benefit from basic assertions on the math.

**Recommendation:** This gap is acceptable for Phase 0 (spike code is prototype-quality). However, when WS-0.3 code is promoted to production in WS-1.1, Vitest should be set up and the spatial math functions should be the first test targets. Flag this as a WS-1.1 prerequisite.

### Gap 4: No Explicit File Modification Protocol Between SOWs

**Impact:** WS-0.2 creates `globals.css` and `layout.tsx` -- files that WS-0.1 also creates. WS-0.3 creates `camera.store.ts` -- also created by WS-0.1. The SOWs do not state whether they REPLACE or PATCH these files.

**Recommendation:** Establish a convention: when a later workstream's SOW provides full file contents for a file created by an earlier workstream, the later version SUPERSEDES the earlier version. Add this to the Master Plan's execution conventions. For WS-0.2 specifically: annotate that `layout.tsx` must preserve the `QueryProvider` from WS-0.1 (see Conflict #1).

### Gap 5: `@tarva/ui` Installation Method Unresolved (BLOCKING)

**Impact:** OQ-1 from WS-0.1. If `@tarva/ui` is not on npm or a private registry, `pnpm install` will fail. The fallback (`link:` protocol to local `tarva-ui-library`) requires documentation and developer setup instructions.

**Recommendation:** Resolve before Phase 0 execution begins. If using `link:` protocol, update WS-0.1 `package.json` to use `"@tarva/ui": "link:../tarva-ui-library"` and add setup instructions to the project README. If using a registry, pin to the exact published version.

### Gap 6: Node.js Version Enforcement

**Impact:** OQ-4 from WS-0.1. Node 22+ is required by Next.js 16. Without enforcement, developers on older Node versions will encounter cryptic build failures.

**Recommendation:** Add `.nvmrc` with `22` and a `"packageManager": "pnpm@10.x.x"` field in `package.json` during WS-0.1 execution. Low effort, high onboarding-reliability value.

### Gap 7: `--duration-instant` Override Risk

**Impact:** WS-0.2 Q-0.2.4. Launch spatial tokens override `@tarva/ui`'s `--duration-instant: 0ms` with `100ms`. If any `@tarva/ui` component uses `--duration-instant` for "no animation" semantics, it will now have a 100ms animation.

**Recommendation:** During WS-0.2 execution, grep the `@tarva/ui` source for `--duration-instant` usage. If found, either rename the Launch token to `--duration-spatial-instant` to avoid collision, or confirm the 100ms value is acceptable for the affected components.

### Gap 8: WS-0.2 References "Next.js 15" in Input Dependencies

**Impact:** WS-0.2 Section 3, row 1 says "Next.js 15 project" but the stack is Next.js 16 (per tech-decisions.md and WS-0.1).

**Recommendation:** Correct the reference to "Next.js 16" in WS-0.2 Section 3.

---

## 10. Effort & Sequencing Assessment (PMO)

### Execution Order

```
Day 1-2:   WS-0.1 (react-developer)    -- Project Scaffolding
Day 2-3:   WS-0.2 (ui-designer)        -- Design Tokens Setup [parallel with WS-0.3]
Day 2-5:   WS-0.3 (react-developer)    -- ZUI Tech Spike implementation
Day 5-6:   WS-0.3 (react-developer)    -- Performance testing + spike report
Day 6-7:   Buffer / go-no-go review
```

### Resource Loading

| Agent                     | WS-0.1   | WS-0.2    | WS-0.3   | Total Load                |
| ------------------------- | -------- | --------- | -------- | ------------------------- |
| `react-developer`         | 1-2 days | --        | 3-5 days | **4-7 days (serialized)** |
| `world-class-ui-designer` | --       | 0.5-1 day | --       | **0.5-1 day**             |

**Bottleneck:** The react-developer is the critical resource. WS-0.1 and WS-0.3 are serial (WS-0.1 must complete before WS-0.3 starts), giving the react-developer 4-7 days of back-to-back work.

The world-class-ui-designer is idle during WS-0.1 and WS-0.3. Their burst of work (WS-0.2) is 0.5-1 day once WS-0.1 completes.

### Effort Estimates vs. Complexity

| Workstream | Discovery Sizing                                  | SOW Deliverable Count                                             | Realistic Estimate | Assessment                                                                                                                                                           |
| ---------- | ------------------------------------------------- | ----------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-0.1     | S (small)                                         | 20 deliverable sections, 12 acceptance criteria                   | 1-2 days           | **Realistic.** Mostly file creation with specified content.                                                                                                          |
| WS-0.2     | S (small)                                         | 4 deliverable files, 9 acceptance criteria                        | 0.5-1 day          | **Realistic.** Values are pre-specified; primarily transcription + verification.                                                                                     |
| WS-0.3     | M (medium) in combined-recs, S (as part of phase) | 12 new files, 13 acceptance criteria, 10 test scenarios, 1 report | 3-5 days           | **Tight.** The combined-recommendations correctly sizes this as M. 12 files of non-trivial code + structured test protocol + written report is ambitious for 3 days. |

**Overall phase sizing: S (1 week) is ACHIEVABLE but leaves minimal buffer.** The critical path (WS-0.1 -> WS-0.3) consumes 4-7 working days. A 5-day working week has zero buffer if WS-0.3 takes the full 5 days.

### Parallel Execution Opportunities

1. **WS-0.2 runs fully in parallel with WS-0.3.** No dependency between them. The ui-designer can execute WS-0.2 while the react-developer is building the spike.
2. **WS-0.3 testing can overlap with WS-0.3 implementation.** The react-developer can run initial performance tests on completed components before all 12 files are finished.
3. **OQ-1 resolution can happen in parallel with SOW finalization.** The project lead should resolve the `@tarva/ui` installation question immediately, before WS-0.1 execution begins.

### Bottleneck Risks

| Risk                                                     | Likelihood | Impact                               | Mitigation                                                                                                  |
| -------------------------------------------------------- | ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| react-developer blocked by OQ-1 (@tarva/ui availability) | Medium     | High -- blocks entire phase          | Resolve OQ-1 immediately; have link: protocol fallback ready                                                |
| WS-0.3 scope exceeds 3-day estimate                      | Medium     | Medium -- pushes phase beyond 1 week | Time-box spike implementation to 3 days; reduce test matrix if needed (prioritize A1, A3, C1, C2 scenarios) |
| WS-0.1 reveals @tarva/ui compatibility issues            | Low        | High -- debugging delays cascade     | Pin exact dependency versions; have Agent Builder as known-good reference                                   |
| Spike yields NO GO verdict                               | Low        | Critical -- invalidates Phase 1 plan | R3F hybrid fallback is documented in tech-decisions.md; adds 1-2 weeks to timeline                          |

### Recommended Execution Order Within Phase

1. **Pre-execution (Day 0):** Resolve OQ-1 (`@tarva/ui` installation method). Confirm Node 22+ and pnpm are available.
2. **WS-0.1 first (Day 1-2):** Unblocks everything. react-developer focuses exclusively on scaffolding.
3. **WS-0.2 and WS-0.3 in parallel (Day 2-6):**
   - ui-designer starts WS-0.2 immediately after WS-0.1 completes.
   - react-developer starts WS-0.3 immediately after WS-0.1 completes.
   - WS-0.2 will finish well before WS-0.3.
4. **WS-0.3 testing and report (Day 5-6):** After implementation, run the performance test matrix and write the spike report.
5. **Phase gate review (Day 6-7):** Review spike report, issue go/no-go, confirm Phase 1 readiness.

### Critical Path Summary

```
OQ-1 Resolution --> WS-0.1 (1-2d) --> WS-0.3 Implementation (3d) --> WS-0.3 Testing+Report (1-2d) --> Go/No-Go
                                   \
                                    --> WS-0.2 (0.5-1d) [off critical path]
```

**Total critical path: 5-7 working days.** The "S (1 week)" estimate is achievable if the react-developer maintains focus and OQ-1 is resolved before Day 1. Recommend planning for 6 working days with a 1-day buffer for the go/no-go review.

---

## Appendix A: Risk Register (Consolidated from All SOWs)

| ID      | Risk                                                             | SOW    | Likelihood | Impact   | Mitigation                                         |
| ------- | ---------------------------------------------------------------- | ------ | ---------- | -------- | -------------------------------------------------- |
| R-0.1-1 | @tarva/ui not available on registry                              | WS-0.1 | Medium     | High     | Resolve OQ-1; fallback to link: protocol           |
| R-0.1-2 | @tarva/ui peer dependency version mismatch                       | WS-0.1 | Low        | Medium   | Pin to React 19.2.3, Tailwind 4.1.18               |
| R-0.1-3 | ESLint flat config incompatibility                               | WS-0.1 | Low        | Low      | Pin eslint-config-next to 16.1.4                   |
| R-0.2-1 | @tarva/ui token override conflict (--duration-instant)           | WS-0.2 | Medium     | High     | Verify @tarva/ui usage; rename if collision found  |
| R-0.2-2 | @theme + @theme inline ordering interaction                      | WS-0.2 | Low        | High     | Pattern proven in Agent Builder                    |
| R-0.2-3 | Glow shadow tokens rejected by Tailwind arbitrary values         | WS-0.2 | Medium     | Medium   | Fallback to CSS utility classes                    |
| R-0.2-4 | Font variable naming mismatch (--font-geist-sans vs --font-sans) | WS-0.2 | Low        | Medium   | Same pattern works in Agent Builder                |
| R-0.2-5 | WS-0.1 dependency delayed                                        | WS-0.2 | Low        | Critical | WS-0.1 is simple scaffolding; low delay risk       |
| R-0.3-1 | Zoom-to-cursor precision at extreme zoom levels                  | WS-0.3 | Medium     | High     | Spike test C1 validates; clamp to [0.08, 3.0]      |
| R-0.3-2 | Hysteresis bands too narrow                                      | WS-0.3 | Medium     | Medium   | Spike test C2; widen to 15% if flicker persists    |
| R-0.3-3 | backdrop-filter drops FPS below 45                               | WS-0.3 | High       | Medium   | Pan-pause mitigation; fallback to solid background |
| R-0.3-4 | subscribe() does not bypass React reconciliation                 | WS-0.3 | Low        | High     | Monitor React DevTools; fallback to vanilla store  |
| R-0.3-5 | Momentum velocity erratic on trackpads                           | WS-0.3 | Medium     | Low      | Increase sample count or use time-weighted avg     |
| R-0.3-7 | Spike scope creep                                                | WS-0.3 | Medium     | Medium   | Time-box to 3 days; explicit out-of-scope list     |

---

## Appendix B: Acceptance Criteria Summary

| SOW       | # Criteria | Key Verification Methods                                                                                                                          |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-0.1    | 12         | CLI commands (`pnpm build/lint/typecheck/format:check`), browser navigation, directory inspection                                                 |
| WS-0.2    | 9          | Token parity audit vs. VISUAL-DESIGN-SPEC.md, Tailwind utility generation test, browser rendering inspection, computed style verification         |
| WS-0.3    | 13         | FPS monitor data, Chrome DevTools Performance recordings, zoom-to-cursor visual validation, hysteresis flicker counting, spike report publication |
| **Total** | **34**     |                                                                                                                                                   |
