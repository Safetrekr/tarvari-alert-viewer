# WS-4.4: Visual Polish Pass

> **Workstream ID:** WS-4.4
> **Phase:** 4 -- Advanced AI + Polish
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.2, WS-1.6, WS-2.1, WS-2.6, WS-3.6, WS-3.7
> **Blocks:** None (terminal workstream)
> **Resolves:** Risk #1 (CSS transforms visual ceiling), Risk #6 (scope creep from eye-candy ambition), Risk #10 (film grain / scanline readability)

---

## 1. Objective

Execute a comprehensive visual quality audit and refinement pass across every UI surface in Tarva Launch, covering all work delivered in Phases 0 through 3. This is not a feature workstream -- it produces no new capabilities. Instead it verifies, measures, and tunes the visual system that already exists, closing the gap between "implemented" and "polished" for every ambient effect, transition, glass material, glow recipe, design token, animation, and typographic decision in the application.

The pass is organized as nine targeted audits, each with a programmatic verification tool and a corresponding set of fixes. Every audit produces a machine-readable report that can be re-run after fixes to confirm compliance. The goal is to leave the visual system in a state where every rendered pixel matches VISUAL-DESIGN-SPEC.md, every animation sustains 60fps on mid-range hardware, every `prefers-reduced-motion` path is verified, and every color name in the codebase uses the canonical ember/teal vocabulary.

**Success looks like:** A developer opens Chrome DevTools Performance panel, records a 30-second session that includes login, atrium idle, capsule selection morph, district browse, and return-to-hub. The flame chart shows zero long frames (>16.67ms). The computed styles on every glass panel match VISUAL-DESIGN-SPEC.md Section 1.7 exactly. A `grep -r "frost\|cyan\|ice\|blue-accent"` across `src/` returns zero results. The `prefers-reduced-motion: reduce` emulation shows zero moving elements except the static film grain texture. Every Geist Sans instance uses the correct tracking value for its zoom level. The ambient particle field runs at 60fps with 18 particles during calm state and gracefully reduces to 8 during tighten state per WS-3.7's effect modulation table.

**Why this workstream matters:** Eye candy is the primary success criterion per stakeholder directive. The individual workstreams (WS-1.6, WS-2.1, WS-2.6, WS-3.7) each deliver correct implementations in isolation, but visual coherence only emerges when the full system runs together. Timing relationships between ambient effects, morph transitions, and attention choreography can only be tuned in the integrated application. This workstream is where "technically correct" becomes "feels right."

**Traceability:** combined-recommendations.md Phase 4 WS-4.4 ("Refinement of all ambient effects, timing adjustments, transition polish, performance optimization pass, final design token tuning"); VISUAL-DESIGN-SPEC.md (all sections); AD-3 (Three-Tier Animation Architecture).

---

## 2. Scope

### In Scope

| ID  | Area                       | Description                                                                                                                                                                                                                                                                                 |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-1 | Ambient effects refinement | Timing adjustments for particle nebula, scan lines, breathing glow, heartbeat pulse, grid pulse. Performance audit of Canvas particle renderer. Reduced motion compliance verification for all six WS-1.6 effects.                                                                          |
| S-2 | Transition polish          | Spring physics tuning for morph (focusing/morphing/unfurling), flyTo, zoom-to-cursor transitions. Easing curve adjustments for hover, selection, deselection. Verification against WS-2.1 timing config.                                                                                    |
| S-3 | Glass material audit       | Verify all glass implementations match VISUAL-DESIGN-SPEC.md Section 1.7 recipes. Standard glass: 0.03 bg opacity, 12px blur, 120% saturate. Active glass: 0.06 bg opacity, 16px blur, 130% saturate. Strong glass: 0.80 bg opacity (tinted), 24px blur, 140% saturate. Fix any deviations. |
| S-4 | Glow system audit          | Verify 4-layer luminous border implementation across all components. Verify 3-layer glow technique (outer haze, core bloom, hot center) at subtle/medium/bright intensities. Ember/teal glow consistency. Border color matches glow color (same hue/saturation, only opacity differs).      |
| S-5 | Design token tuning        | Fine-tune any token values based on full-system visual review. Verify all ~89 tokens in `spatial-tokens.css` match VISUAL-DESIGN-SPEC.md Section 6.1. Verify Tailwind `@theme` registration matches CSS custom properties.                                                                  |
| S-6 | Performance optimization   | GPU layer promotion audit (`will-change` usage). Animation frame budget verification (target: 60fps / 16.67ms per frame on mid-range hardware). `backdrop-filter` pan-pause fallback verification. CSS `contain` property audit. Composite layer count check.                               |
| S-7 | Reduced motion pass        | Verify ALL animations respect `prefers-reduced-motion: reduce`. Audit all `motion/react` animations and CSS `@keyframes`. Verify WS-1.6 ambient effects disable. Verify WS-2.1 morph skips animation. Verify WS-3.7 attention choreography resolves to static config.                       |
| S-8 | Typography audit           | Verify Geist Sans / Geist Mono usage across all zoom levels (Z0-Z3 + HUD). Verify tracking values per VISUAL-DESIGN-SPEC.md Section 3.2 type scale. Verify `font-variant-numeric: tabular-nums` on all telemetry values. Verify receipt stamp typography per Section 3.4.                   |
| S-9 | Color consistency audit    | Verify ember (`#E05200` / `--color-ember`) and teal (`#277389` / `--color-teal`) usage across all components. Ensure no "frost", "cyan", "ice", or "blue-accent" naming anywhere in the codebase. Verify status color usage (healthy/warning/error/offline) matches Gap #3 model.           |

### Out of Scope

| ID   | Area                        | Reason                                                                                                                                                                                                            |
| ---- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS-1 | New feature development     | This is an audit and tuning workstream. No new UI capabilities are introduced.                                                                                                                                    |
| OS-2 | WebGL / R3F migration       | If the CSS visual ceiling is reached, that is a separate decision (upgrade path per tech-decisions.md). This workstream optimizes within the CSS approach.                                                        |
| OS-3 | Sound design                | No audio accompanies ambient effects per WS-1.6 scope.                                                                                                                                                            |
| OS-4 | Mobile / touch optimization | Desktop mouse/trackpad only per project constraints.                                                                                                                                                              |
| OS-5 | Telemetry data correctness  | This workstream audits visual rendering, not data accuracy. Telemetry correctness is WS-1.5.                                                                                                                      |
| OS-6 | AI feature behavior         | AI narration content quality, camera director accuracy, and exception triage logic are not visual polish concerns. Only the rendering of AI-related UI surfaces (narration panel styling per WS-3.6) is in scope. |
| OS-7 | Architectural refactoring   | If a component is structurally unsound, file a ticket. This workstream only adjusts visual properties, timing values, and performance characteristics.                                                            |

---

## 3. Input Dependencies

| Dependency              | Source         | What It Provides                                                                                                                                                                                                                                                        | Status    |
| ----------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Design tokens CSS       | WS-0.2         | All ~89 spatial CSS custom properties (`--color-*`, `--glow-*`, `--duration-*`, `--ease-*`, `--blur-*`, `--opacity-*`, `--space-*`, `--capsule-*`, `--font-*`, `--tracking-*`); Tailwind `@theme` registration                                                          | Required  |
| Ambient effects layer   | WS-1.6         | ParticleField (Canvas), HeartbeatPulse (CSS), GlowBreathing (CSS), GridPulse (CSS), ScanlineOverlay (CSS), FilmGrain (SVG). `usePanPause` hook. `ambient-effects.css` with all `@keyframes`. Barrel export from `src/components/ambient/`                               | Required  |
| Morph choreography      | WS-2.1         | `useMorphChoreography` hook, `MorphTimingConfig`, 4-phase state machine, Framer Motion variants for capsule/sibling/district transitions, `DistrictShell` container                                                                                                     | Required  |
| Station panel framework | WS-2.6         | `StationPanel`, `StationHeader`, `StationBody`, `StationActions` components. `station-panel.css` with glass material classes (`.station-glass`, `.station-glass-active`, `.station-glass-hover`, `.station-panel`, `.station-luminous-border`). Pan-state fallback CSS. | Required  |
| Narrated telemetry      | WS-3.6         | `NarrationPanel` display component with glass material styling. Entrance animation via `motion/react`.                                                                                                                                                                  | Required  |
| Attention choreography  | WS-3.7         | `AttentionState` (`calm` / `tighten`), `PerformanceLevel` (`full` / `reduced` / `minimal`), `EffectConfig`, CSS custom property bridge (`--attention-*`), `useAttentionChoreography` hook, effect modulation table                                                      | Required  |
| VISUAL-DESIGN-SPEC.md   | Discovery docs | Canonical values for every visual property: colors (Sec 1), capsule design (Sec 2), typography (Sec 3), glass and glow (Sec 4), living details (Sec 5), design tokens (Sec 6)                                                                                           | Reference |
| `motion/react` v12+     | npm package    | `motion`, `AnimatePresence`, `useReducedMotion`, spring physics configuration                                                                                                                                                                                           | Required  |
| `@tarva/ui`             | npm package    | `useReducedMotion` from `@tarva/ui/motion`, ThemeProvider, base component library                                                                                                                                                                                       | Required  |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  lib/
    audits/
      visual-polish-audit.ts         # D-POLISH-1: Audit runner + report types
      glass-material-audit.ts        # D-POLISH-4: Glass recipe verification
      glow-system-audit.ts           # D-POLISH-5: Glow layer verification
      typography-audit.ts            # D-POLISH-8: Type scale verification
      color-consistency-audit.ts     # D-POLISH-9: Naming + value verification
      performance-audit.ts           # D-POLISH-6: GPU layer + frame budget
      reduced-motion-audit.ts        # D-POLISH-7: prefers-reduced-motion coverage
      index.ts                       # Barrel export
  hooks/
    use-frame-budget-monitor.ts      # D-POLISH-6: Runtime 60fps verification
    use-visual-polish-devtool.ts     # D-POLISH-1: Dev-mode overlay for audit results
  styles/
    ambient-effects.css              # D-POLISH-2: MODIFY -- timing refinements
    visual-polish-overrides.css      # D-POLISH-3/5: Transition + glow corrections
    reduced-motion.css               # D-POLISH-7: Comprehensive reduced-motion sheet
  components/
    dev/
      visual-polish-overlay.tsx      # D-POLISH-1: Dev-only audit overlay
```

### 4.2 Audit Infrastructure -- `src/lib/audits/visual-polish-audit.ts`

Central audit runner that executes all nine audit checks and produces a structured report. This runs in the browser during development only (guarded by `process.env.NODE_ENV === 'development'`).

```ts
/**
 * Visual Polish Audit Infrastructure
 *
 * Programmatic verification of all visual properties against
 * VISUAL-DESIGN-SPEC.md. Runs in-browser during development.
 *
 * Usage:
 *   import { runVisualPolishAudit } from '@/lib/audits'
 *   const report = await runVisualPolishAudit()
 *   console.table(report.summary)
 *
 * Source: WS-4.4 (Visual Polish Pass)
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1-6
 */

// ============================================================
// TYPES
// ============================================================

export type AuditSeverity = 'error' | 'warning' | 'info'

export type AuditCategory =
  | 'glass-material'
  | 'glow-system'
  | 'typography'
  | 'color-consistency'
  | 'performance'
  | 'reduced-motion'
  | 'ambient-effects'
  | 'transitions'
  | 'design-tokens'

export interface AuditFinding {
  /** Unique identifier for the finding */
  readonly id: string
  /** Which audit category produced this finding */
  readonly category: AuditCategory
  /** Severity: error = spec violation, warning = potential issue, info = note */
  readonly severity: AuditSeverity
  /** CSS selector or component path that triggered the finding */
  readonly target: string
  /** Human-readable description of the issue */
  readonly message: string
  /** Expected value per VISUAL-DESIGN-SPEC.md */
  readonly expected: string
  /** Actual computed value found in the DOM */
  readonly actual: string
  /** VISUAL-DESIGN-SPEC.md section reference */
  readonly specRef: string
}

export interface AuditCategorySummary {
  readonly category: AuditCategory
  readonly total: number
  readonly errors: number
  readonly warnings: number
  readonly infos: number
  readonly passed: boolean
}

export interface VisualPolishReport {
  readonly timestamp: string
  readonly duration: number
  readonly findings: readonly AuditFinding[]
  readonly summary: readonly AuditCategorySummary[]
  readonly passed: boolean
}

type AuditFunction = () => AuditFinding[]

// ============================================================
// AUDIT REGISTRY
// ============================================================

const auditRegistry = new Map<AuditCategory, AuditFunction>()

/**
 * Register an audit function for a category.
 * Called by individual audit modules during import.
 */
export function registerAudit(category: AuditCategory, fn: AuditFunction): void {
  auditRegistry.set(category, fn)
}

// ============================================================
// AUDIT RUNNER
// ============================================================

/**
 * Run all registered visual polish audits and produce a report.
 *
 * @returns A complete VisualPolishReport with findings and summary.
 */
export async function runVisualPolishAudit(): Promise<VisualPolishReport> {
  if (process.env.NODE_ENV !== 'development') {
    return {
      timestamp: new Date().toISOString(),
      duration: 0,
      findings: [],
      summary: [],
      passed: true,
    }
  }

  const start = performance.now()
  const allFindings: AuditFinding[] = []

  for (const [category, auditFn] of auditRegistry) {
    try {
      const findings = auditFn()
      allFindings.push(...findings)
    } catch (err) {
      allFindings.push({
        id: `${category}-crash`,
        category,
        severity: 'error',
        target: 'audit-runner',
        message: `Audit crashed: ${err instanceof Error ? err.message : String(err)}`,
        expected: 'No crash',
        actual: 'Audit function threw',
        specRef: 'N/A',
      })
    }
  }

  const duration = performance.now() - start

  // Build per-category summary
  const categories = [...new Set(allFindings.map((f) => f.category))]
  const summary: AuditCategorySummary[] = categories.map((category) => {
    const catFindings = allFindings.filter((f) => f.category === category)
    const errors = catFindings.filter((f) => f.severity === 'error').length
    const warnings = catFindings.filter((f) => f.severity === 'warning').length
    const infos = catFindings.filter((f) => f.severity === 'info').length
    return {
      category,
      total: catFindings.length,
      errors,
      warnings,
      infos,
      passed: errors === 0,
    }
  })

  return {
    timestamp: new Date().toISOString(),
    duration,
    findings: allFindings,
    summary,
    passed: allFindings.every((f) => f.severity !== 'error'),
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Parse a CSS rgba() value into its components.
 */
export function parseRGBA(value: string): { r: number; g: number; b: number; a: number } | null {
  // Handle rgba(r, g, b, a) and rgba(r g b / a)
  const match = value.match(
    /rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*(?:[,/]\s*([\d.]+))?\s*\)/
  )
  if (!match) return null
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  }
}

/**
 * Compare two numeric values within a tolerance.
 */
export function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance
}

/**
 * Query all elements matching a selector and return computed styles.
 */
export function queryComputedStyles(
  selector: string
): Array<{ element: Element; style: CSSStyleDeclaration }> {
  const elements = document.querySelectorAll(selector)
  return Array.from(elements).map((element) => ({
    element,
    style: window.getComputedStyle(element),
  }))
}
```

### 4.3 Glass Material Audit -- `src/lib/audits/glass-material-audit.ts`

Verifies every glass panel in the DOM against the three glass recipes defined in VISUAL-DESIGN-SPEC.md Section 1.7 and Section 4.1.

```ts
/**
 * Glass Material Audit
 *
 * Verifies all glass panel implementations match VISUAL-DESIGN-SPEC.md
 * Section 1.7 recipes and Section 4.1 blur values.
 *
 * Glass tiers:
 * - Standard:  bg rgba(255,255,255, 0.03), blur 12px, saturate 120%
 * - Active:    bg rgba(255,255,255, 0.06), blur 16px, saturate 130%
 * - Strong:    bg rgba(15, 22, 31, 0.80),  blur 24px, saturate 140%
 *
 * Source: WS-4.4 D-POLISH-4
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1.7, 4.1
 */

import {
  registerAudit,
  queryComputedStyles,
  parseRGBA,
  withinTolerance,
  type AuditFinding,
} from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

interface GlassSpec {
  /** CSS class selector that identifies this glass tier */
  readonly selector: string
  /** Display name for findings */
  readonly name: string
  /** Expected background RGBA */
  readonly bgRGBA: { r: number; g: number; b: number; a: number }
  /** Expected backdrop-filter blur value in px */
  readonly blurPx: number
  /** Expected backdrop-filter saturate percentage */
  readonly saturatePct: number
  /** Whether a top-edge inset highlight is required */
  readonly requiresTopHighlight: boolean
  /** VISUAL-DESIGN-SPEC.md section */
  readonly specRef: string
}

const GLASS_SPECS: readonly GlassSpec[] = [
  {
    selector: '.station-glass, .glass',
    name: 'Standard Glass',
    bgRGBA: { r: 255, g: 255, b: 255, a: 0.03 },
    blurPx: 12,
    saturatePct: 120,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 "Standard Glass Panel"',
  },
  {
    selector: '.station-glass-active, .glass-active',
    name: 'Active Glass',
    bgRGBA: { r: 255, g: 255, b: 255, a: 0.06 },
    blurPx: 16,
    saturatePct: 130,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 "Active Glass Panel"',
  },
  {
    selector: '.station-glass-hover, .glass-hover',
    name: 'Hover Glass',
    bgRGBA: { r: 255, g: 255, b: 255, a: 0.06 },
    blurPx: 16,
    saturatePct: 130,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 (blend of standard and active)',
  },
  {
    selector: '.glass-strong',
    name: 'Strong Glass',
    bgRGBA: { r: 15, g: 22, b: 31, a: 0.8 },
    blurPx: 24,
    saturatePct: 140,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 "Strong Glass Panel"',
  },
] as const

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditGlassMaterials(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let findingIndex = 0

  for (const spec of GLASS_SPECS) {
    const elements = queryComputedStyles(spec.selector)

    if (elements.length === 0) {
      findings.push({
        id: `glass-${findingIndex++}`,
        category: 'glass-material',
        severity: 'info',
        target: spec.selector,
        message: `No elements found for ${spec.name}. May not be rendered in current view.`,
        expected: 'At least 1 element',
        actual: '0 elements',
        specRef: spec.specRef,
      })
      continue
    }

    for (const { element, style } of elements) {
      const elId = element.id || element.className.toString().slice(0, 40) || element.tagName

      // -- Check background-color --
      const bgColor = style.backgroundColor
      const parsedBg = parseRGBA(bgColor)

      if (parsedBg) {
        const alphaMatch = withinTolerance(parsedBg.a, spec.bgRGBA.a, 0.015)
        if (!alphaMatch) {
          findings.push({
            id: `glass-${findingIndex++}`,
            category: 'glass-material',
            severity: 'error',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} background opacity mismatch`,
            expected: `rgba(${spec.bgRGBA.r}, ${spec.bgRGBA.g}, ${spec.bgRGBA.b}, ${spec.bgRGBA.a})`,
            actual: bgColor,
            specRef: spec.specRef,
          })
        }
      }

      // -- Check backdrop-filter --
      const backdropFilter =
        style.getPropertyValue('backdrop-filter') ||
        style.getPropertyValue('-webkit-backdrop-filter')

      if (!backdropFilter || backdropFilter === 'none') {
        // Check if panning -- backdrop-filter is intentionally disabled during pan
        const isPanning = element.closest('[data-panning="true"]') !== null
        if (!isPanning) {
          findings.push({
            id: `glass-${findingIndex++}`,
            category: 'glass-material',
            severity: 'error',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} missing backdrop-filter`,
            expected: `blur(${spec.blurPx}px) saturate(${spec.saturatePct}%)`,
            actual: backdropFilter || 'none',
            specRef: spec.specRef,
          })
        }
      } else {
        // Verify blur value
        const blurMatch = backdropFilter.match(/blur\((\d+(?:\.\d+)?)px\)/)
        if (blurMatch) {
          const actualBlur = parseFloat(blurMatch[1])
          if (!withinTolerance(actualBlur, spec.blurPx, 1)) {
            findings.push({
              id: `glass-${findingIndex++}`,
              category: 'glass-material',
              severity: 'error',
              target: `${spec.selector} (${elId})`,
              message: `${spec.name} blur value mismatch`,
              expected: `${spec.blurPx}px`,
              actual: `${actualBlur}px`,
              specRef: spec.specRef,
            })
          }
        }

        // Verify saturate value
        const saturateMatch = backdropFilter.match(/saturate\((\d+(?:\.\d+)?)%?\)/)
        if (saturateMatch) {
          const actualSaturate = parseFloat(saturateMatch[1])
          // saturate can be expressed as 1.2 or 120%
          const normalizedActual = actualSaturate < 10 ? actualSaturate * 100 : actualSaturate
          if (!withinTolerance(normalizedActual, spec.saturatePct, 5)) {
            findings.push({
              id: `glass-${findingIndex++}`,
              category: 'glass-material',
              severity: 'error',
              target: `${spec.selector} (${elId})`,
              message: `${spec.name} saturate value mismatch`,
              expected: `${spec.saturatePct}%`,
              actual: `${normalizedActual}%`,
              specRef: spec.specRef,
            })
          }
        }
      }

      // -- Check top-edge highlight --
      if (spec.requiresTopHighlight) {
        const boxShadow = style.boxShadow
        const hasInsetTop = boxShadow.includes('inset') && boxShadow.includes('1px')
        if (!hasInsetTop && boxShadow !== 'none') {
          findings.push({
            id: `glass-${findingIndex++}`,
            category: 'glass-material',
            severity: 'warning',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} may be missing top-edge inset highlight`,
            expected: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03-0.05)',
            actual: boxShadow.slice(0, 80),
            specRef: 'Section 4.1 "The top-edge highlight"',
          })
        }
      }
    }
  }

  return findings
}

// Register with the audit runner
registerAudit('glass-material', auditGlassMaterials)
```

### 4.4 Glow System Audit -- `src/lib/audits/glow-system-audit.ts`

Verifies luminous border 4-layer implementation and 3-layer glow technique across all components.

```ts
/**
 * Glow System Audit
 *
 * Verifies:
 * 1. Luminous border uses 4-layer box-shadow (outer bleed, tight outer,
 *    inner bleed, tight inner) per VISUAL-DESIGN-SPEC.md Section 4.4.
 * 2. Ember glow uses 3-layer technique (outer haze, core bloom, hot center)
 *    at subtle/medium/bright intensities per Section 1.8.
 * 3. Teal glow uses 2-layer technique at subtle/medium per Section 1.8.
 * 4. Border color matches glow color (same hue/saturation, only opacity differs).
 * 5. Status glow colors match Gap #3 status model.
 *
 * Source: WS-4.4 D-POLISH-5
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1.8, 4.2, 4.4
 */

import { registerAudit, queryComputedStyles, type AuditFinding } from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

/**
 * Expected box-shadow layer counts per element type.
 *
 * The luminous border recipe from Section 4.4:
 *   Layer 1: 0 0 10px rgba(224, 82, 0, 0.10)   -- outer bleed
 *   Layer 2: 0 0 3px  rgba(224, 82, 0, 0.18)    -- tight outer
 *   Layer 3: inset 0 0 10px rgba(224, 82, 0, 0.04) -- inner bleed
 *   Layer 4: inset 0 0 2px  rgba(224, 82, 0, 0.08) -- tight inner
 *
 * Combined station-panel also includes the top-edge highlight:
 *   Layer 0: inset 0 1px 0 0 rgba(255, 255, 255, 0.05) -- glass highlight
 *   = 5 layers total for `.station-panel`
 */

interface GlowSpec {
  readonly selector: string
  readonly name: string
  /** Minimum number of box-shadow layers expected */
  readonly minLayers: number
  /** Whether inset layers are expected (luminous border) */
  readonly requiresInset: boolean
  /** Expected glow hue (ember=orange, teal=teal, status=varies) */
  readonly expectedHue: 'ember' | 'teal' | 'status' | 'any'
  readonly specRef: string
}

const GLOW_SPECS: readonly GlowSpec[] = [
  {
    selector: '.station-luminous-border',
    name: 'Station Luminous Border (ember)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'ember',
    specRef: 'Section 4.4 "Luminous Border Detail"',
  },
  {
    selector: '.station-luminous-border-healthy',
    name: 'Station Luminous Border (healthy)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'status',
    specRef: 'Section 4.4 (status variant)',
  },
  {
    selector: '.station-luminous-border-warning',
    name: 'Station Luminous Border (warning)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'status',
    specRef: 'Section 4.4 (status variant)',
  },
  {
    selector: '.station-luminous-border-error',
    name: 'Station Luminous Border (error)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'status',
    specRef: 'Section 4.4 (status variant)',
  },
  {
    selector: '.station-panel',
    name: 'Station Panel (combined glass + luminous)',
    minLayers: 5,
    requiresInset: true,
    expectedHue: 'ember',
    specRef: 'Section 4.4 + Section 4.1 combined',
  },
  {
    selector: '.glow-subtle, [class*="glow-ember-subtle"]',
    name: 'Ember Glow Subtle',
    minLayers: 2,
    requiresInset: false,
    expectedHue: 'ember',
    specRef: 'Section 1.8 "Glow Subtle"',
  },
  {
    selector: '.glow-medium, [class*="glow-ember-medium"]',
    name: 'Ember Glow Medium',
    minLayers: 3,
    requiresInset: false,
    expectedHue: 'ember',
    specRef: 'Section 1.8 "Glow Medium"',
  },
  {
    selector: '.glow-bright, [class*="glow-ember-bright"]',
    name: 'Ember Glow Bright',
    minLayers: 3,
    requiresInset: false,
    expectedHue: 'ember',
    specRef: 'Section 1.8 "Glow Bright"',
  },
] as const

// ============================================================
// HELPERS
// ============================================================

/**
 * Count box-shadow layers in a computed box-shadow value.
 * Each layer is separated by commas, but rgba() values also contain commas.
 * We split on commas that are NOT inside parentheses.
 */
function countBoxShadowLayers(boxShadow: string): number {
  if (!boxShadow || boxShadow === 'none') return 0

  let depth = 0
  let count = 1
  for (const char of boxShadow) {
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && depth === 0) count++
  }
  return count
}

/**
 * Check if a box-shadow value contains inset layers.
 */
function hasInsetLayers(boxShadow: string): boolean {
  return boxShadow.includes('inset')
}

/**
 * Verify that ember glow uses the correct RGB values.
 * Ember base: rgb(224, 82, 0)
 * Ember bright: rgb(255, 119, 60) or rgb(255, 170, 112)
 */
function containsEmberRGB(boxShadow: string): boolean {
  return (
    boxShadow.includes('224, 82, 0') ||
    boxShadow.includes('224,82,0') ||
    boxShadow.includes('255, 119, 60') ||
    boxShadow.includes('255,119,60') ||
    boxShadow.includes('255, 170, 112') ||
    boxShadow.includes('255,170,112')
  )
}

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditGlowSystem(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let findingIndex = 0

  for (const spec of GLOW_SPECS) {
    const elements = queryComputedStyles(spec.selector)

    if (elements.length === 0) {
      findings.push({
        id: `glow-${findingIndex++}`,
        category: 'glow-system',
        severity: 'info',
        target: spec.selector,
        message: `No elements found for ${spec.name}. May not be rendered in current view.`,
        expected: 'At least 1 element',
        actual: '0 elements',
        specRef: spec.specRef,
      })
      continue
    }

    for (const { element, style } of elements) {
      const elId = element.id || element.className.toString().slice(0, 40) || element.tagName
      const boxShadow = style.boxShadow

      // -- Check layer count --
      const layerCount = countBoxShadowLayers(boxShadow)
      if (layerCount < spec.minLayers) {
        findings.push({
          id: `glow-${findingIndex++}`,
          category: 'glow-system',
          severity: 'error',
          target: `${spec.selector} (${elId})`,
          message: `${spec.name} has insufficient box-shadow layers`,
          expected: `>= ${spec.minLayers} layers`,
          actual: `${layerCount} layers`,
          specRef: spec.specRef,
        })
      }

      // -- Check inset layers --
      if (spec.requiresInset && !hasInsetLayers(boxShadow)) {
        findings.push({
          id: `glow-${findingIndex++}`,
          category: 'glow-system',
          severity: 'error',
          target: `${spec.selector} (${elId})`,
          message: `${spec.name} missing inset glow layers (inner bleed required)`,
          expected: 'At least 1 inset box-shadow layer',
          actual: 'No inset layers found',
          specRef: spec.specRef,
        })
      }

      // -- Check ember hue (for ember-typed glows) --
      if (spec.expectedHue === 'ember' && !containsEmberRGB(boxShadow)) {
        findings.push({
          id: `glow-${findingIndex++}`,
          category: 'glow-system',
          severity: 'error',
          target: `${spec.selector} (${elId})`,
          message: `${spec.name} glow does not use ember RGB values`,
          expected: 'rgba(224, 82, 0, ...) or ember-bright/glow variants',
          actual: boxShadow.slice(0, 100),
          specRef: spec.specRef,
        })
      }

      // -- Check border color matches glow color --
      // Per Section 4.4: "the border color must match the glow color exactly"
      if (spec.requiresInset) {
        const borderColor = style.borderColor
        if (
          spec.expectedHue === 'ember' &&
          !borderColor.includes('224, 82, 0') &&
          !borderColor.includes('224,82,0')
        ) {
          findings.push({
            id: `glow-${findingIndex++}`,
            category: 'glow-system',
            severity: 'warning',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} border color may not match glow color`,
            expected: 'Border uses same hue as glow (ember: 224, 82, 0)',
            actual: borderColor,
            specRef: 'Section 4.4 "border color must match glow color"',
          })
        }
      }
    }
  }

  return findings
}

registerAudit('glow-system', auditGlowSystem)
```

### 4.5 Typography Audit -- `src/lib/audits/typography-audit.ts`

Verifies all text elements match the VISUAL-DESIGN-SPEC.md Section 3.2 type scale for each zoom level.

```ts
/**
 * Typography Audit
 *
 * Verifies:
 * 1. Geist Sans is used for labels, headings, UI text.
 * 2. Geist Mono is used for data values, receipts, code, HUD.
 * 3. Tracking values match per-element spec in Section 3.2.
 * 4. font-variant-numeric: tabular-nums on all telemetry values (Section 3.3).
 * 5. Receipt stamp typography matches Section 3.4.
 *
 * Source: WS-4.4 D-POLISH-8
 * Reference: VISUAL-DESIGN-SPEC.md Sections 3.1-3.4
 */

import {
  registerAudit,
  queryComputedStyles,
  withinTolerance,
  type AuditFinding,
} from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

interface TypographySpec {
  /** CSS selector to match elements */
  readonly selector: string
  /** Display name */
  readonly name: string
  /** Expected font family keyword: 'sans' or 'mono' */
  readonly fontFamily: 'sans' | 'mono'
  /** Expected font-size in px */
  readonly sizePx: number
  /** Expected font-weight */
  readonly weight: number
  /** Expected letter-spacing in em (null = no check) */
  readonly trackingEm: number | null
  /** Whether font-variant-numeric: tabular-nums is required */
  readonly requiresTabularNums: boolean
  /** Expected text-transform (null = no check) */
  readonly textTransform: string | null
  readonly specRef: string
}

/**
 * Type scale entries from VISUAL-DESIGN-SPEC.md Section 3.2.
 *
 * NOTE: These selectors use data attributes and BEM-style classes
 * that the component implementations should apply. During the audit,
 * any elements matching these selectors are checked for spec compliance.
 */
const TYPOGRAPHY_SPECS: readonly TypographySpec[] = [
  // Z0 -- Constellation
  {
    selector: '[data-zoom-level="z0"] .beacon-label',
    name: 'Z0 Beacon label',
    fontFamily: 'sans',
    sizePx: 9,
    weight: 600,
    trackingEm: 0.12,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z0',
  },
  // Z1 -- Launch Atrium
  {
    selector: '.capsule-app-name',
    name: 'Z1 Capsule app name',
    fontFamily: 'sans',
    sizePx: 11,
    weight: 600,
    trackingEm: 0.08,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z1',
  },
  {
    selector: '.capsule-telemetry-label',
    name: 'Z1 Capsule telemetry label',
    fontFamily: 'sans',
    sizePx: 10,
    weight: 400,
    trackingEm: 0.06,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z1',
  },
  {
    selector: '.capsule-telemetry-value',
    name: 'Z1 Capsule telemetry value',
    fontFamily: 'mono',
    sizePx: 16,
    weight: 500,
    trackingEm: 0,
    requiresTabularNums: true,
    textTransform: null,
    specRef: 'Section 3.2 Z1',
  },
  // Z2 -- District
  {
    selector: '.district-heading',
    name: 'Z2 District heading',
    fontFamily: 'sans',
    sizePx: 15,
    weight: 600,
    trackingEm: 0.04,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z2',
  },
  {
    selector: '.station-header-title',
    name: 'Z2 Station header',
    fontFamily: 'sans',
    sizePx: 13,
    weight: 600,
    trackingEm: 0.03,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z2',
  },
  // Z3 -- Station
  {
    selector: '.station-panel .panel-heading',
    name: 'Z3 Panel heading',
    fontFamily: 'sans',
    sizePx: 16,
    weight: 600,
    trackingEm: 0.02,
    requiresTabularNums: false,
    textTransform: null,
    specRef: 'Section 3.2 Z3',
  },
  {
    selector: '.station-panel .table-data',
    name: 'Z3 Table data',
    fontFamily: 'mono',
    sizePx: 13,
    weight: 400,
    trackingEm: 0,
    requiresTabularNums: true,
    textTransform: null,
    specRef: 'Section 3.2 Z3',
  },
  // HUD Elements
  {
    selector: '.minimap-label',
    name: 'HUD Minimap label',
    fontFamily: 'mono',
    sizePx: 8,
    weight: 500,
    trackingEm: 0.14,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 HUD',
  },
  {
    selector: '.breadcrumb-path',
    name: 'HUD Breadcrumb path',
    fontFamily: 'mono',
    sizePx: 11,
    weight: 400,
    trackingEm: 0.02,
    requiresTabularNums: false,
    textTransform: null,
    specRef: 'Section 3.2 HUD',
  },
  // Receipt stamp
  {
    selector: '.receipt-stamp',
    name: 'Receipt stamp',
    fontFamily: 'mono',
    sizePx: 10,
    weight: 500,
    trackingEm: 0.12,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.4',
  },
] as const

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditTypography(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0

  for (const spec of TYPOGRAPHY_SPECS) {
    const elements = queryComputedStyles(spec.selector)

    if (elements.length === 0) {
      findings.push({
        id: `typo-${idx++}`,
        category: 'typography',
        severity: 'info',
        target: spec.selector,
        message: `No elements found for ${spec.name}. May not be rendered at current zoom level.`,
        expected: 'At least 1 element',
        actual: '0 elements',
        specRef: spec.specRef,
      })
      continue
    }

    for (const { element, style } of elements) {
      const elId = element.id || element.textContent?.slice(0, 20) || element.tagName

      // -- Font family --
      const fontFamily = style.fontFamily.toLowerCase()
      const expectedFont = spec.fontFamily === 'sans' ? 'geist sans' : 'geist mono'
      if (!fontFamily.includes(expectedFont)) {
        findings.push({
          id: `typo-${idx++}`,
          category: 'typography',
          severity: 'error',
          target: `${spec.selector} ("${elId}")`,
          message: `${spec.name} uses wrong font family`,
          expected: expectedFont,
          actual: fontFamily.slice(0, 60),
          specRef: spec.specRef,
        })
      }

      // -- Font size --
      const actualSize = parseFloat(style.fontSize)
      if (!withinTolerance(actualSize, spec.sizePx, 0.5)) {
        findings.push({
          id: `typo-${idx++}`,
          category: 'typography',
          severity: 'error',
          target: `${spec.selector} ("${elId}")`,
          message: `${spec.name} font-size mismatch`,
          expected: `${spec.sizePx}px`,
          actual: `${actualSize}px`,
          specRef: spec.specRef,
        })
      }

      // -- Font weight --
      const actualWeight = parseInt(style.fontWeight, 10)
      if (actualWeight !== spec.weight) {
        findings.push({
          id: `typo-${idx++}`,
          category: 'typography',
          severity: 'warning',
          target: `${spec.selector} ("${elId}")`,
          message: `${spec.name} font-weight mismatch`,
          expected: `${spec.weight}`,
          actual: `${actualWeight}`,
          specRef: spec.specRef,
        })
      }

      // -- Letter spacing (tracking) --
      if (spec.trackingEm !== null) {
        const actualTracking = style.letterSpacing
        if (spec.trackingEm === 0) {
          if (actualTracking !== 'normal' && actualTracking !== '0px' && actualTracking !== '0') {
            findings.push({
              id: `typo-${idx++}`,
              category: 'typography',
              severity: 'warning',
              target: `${spec.selector} ("${elId}")`,
              message: `${spec.name} has unexpected letter-spacing`,
              expected: 'normal (0)',
              actual: actualTracking,
              specRef: spec.specRef,
            })
          }
        }
        // Non-zero tracking is harder to verify from computed style
        // (browser resolves em to px). Log as info for manual check.
      }

      // -- Tabular nums --
      if (spec.requiresTabularNums) {
        const fontVariant = style.fontVariantNumeric
        const fontFeature = style.fontFeatureSettings
        const hasTabular =
          fontVariant.includes('tabular-nums') ||
          fontFeature.includes('"tnum"') ||
          fontFeature.includes("'tnum'")
        if (!hasTabular) {
          findings.push({
            id: `typo-${idx++}`,
            category: 'typography',
            severity: 'error',
            target: `${spec.selector} ("${elId}")`,
            message: `${spec.name} missing tabular-nums`,
            expected: 'font-variant-numeric: tabular-nums',
            actual: `variant: ${fontVariant}, features: ${fontFeature}`,
            specRef: 'Section 3.3',
          })
        }
      }

      // -- Text transform --
      if (spec.textTransform !== null) {
        if (style.textTransform !== spec.textTransform) {
          findings.push({
            id: `typo-${idx++}`,
            category: 'typography',
            severity: 'warning',
            target: `${spec.selector} ("${elId}")`,
            message: `${spec.name} text-transform mismatch`,
            expected: spec.textTransform,
            actual: style.textTransform,
            specRef: spec.specRef,
          })
        }
      }
    }
  }

  return findings
}

registerAudit('typography', auditTypography)
```

### 4.6 Color Consistency Audit -- `src/lib/audits/color-consistency-audit.ts`

Scans the codebase for naming violations and verifies canonical color values.

```ts
/**
 * Color Consistency Audit
 *
 * Verifies:
 * 1. Ember (#E05200 / --color-ember) is the primary luminous accent everywhere.
 * 2. Teal (#277389 / --color-teal) is the secondary data accent everywhere.
 * 3. No "frost", "cyan", "ice", or "blue-accent" naming exists in source files.
 * 4. Status colors match the Gap #3 five-state model:
 *    OPERATIONAL=#22c55e, DEGRADED=#eab308, DOWN=#ef4444, OFFLINE=#6b7280.
 * 5. All color tokens in the DOM resolve to VISUAL-DESIGN-SPEC.md Section 6.1.
 *
 * NOTE: The naming check (point 3) is a static analysis that should also
 * run as a CI lint step. This runtime audit checks resolved CSS values.
 *
 * Source: WS-4.4 D-POLISH-9
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1.5, 1.6, 6.1
 */

import { registerAudit, type AuditFinding } from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

/**
 * Canonical token values from VISUAL-DESIGN-SPEC.md Section 6.1.
 * Each entry maps a CSS custom property name to its expected resolved value.
 */
const TOKEN_EXPECTED_VALUES: ReadonlyMap<string, string> = new Map([
  // Background scale
  ['--color-void', '#050911'],
  ['--color-abyss', '#0a0f18'],
  ['--color-deep', '#0f161f'],
  ['--color-surface', '#121720'],
  ['--color-raised', '#1c222b'],
  ['--color-overlay', '#28313e'],

  // Ember accent
  ['--color-ember-dim', '#3a1800'],
  ['--color-ember-muted', '#7a3000'],
  ['--color-ember', '#e05200'],
  ['--color-ember-bright', '#ff773c'],
  ['--color-ember-glow', '#ffaa70'],
  ['--color-ember-white', '#ffd4b8'],

  // Teal accent
  ['--color-teal-dim', '#0f2a35'],
  ['--color-teal-muted', '#1a4d5e'],
  ['--color-teal', '#277389'],
  ['--color-teal-bright', '#3a9ab5'],
  ['--color-teal-glow', '#5ec4de'],
  ['--color-teal-white', '#a8e0ef'],

  // Status: healthy
  ['--color-healthy-dim', '#0a2e18'],
  ['--color-healthy', '#22c55e'],
  ['--color-healthy-glow', '#4ade80'],

  // Status: warning
  ['--color-warning-dim', '#3a2d06'],
  ['--color-warning', '#eab308'],
  ['--color-warning-glow', '#facc15'],

  // Status: error
  ['--color-error-dim', '#3a1212'],
  ['--color-error', '#ef4444'],
  ['--color-error-glow', '#f87171'],

  // Status: offline
  ['--color-offline-dim', '#1a1d24'],
  ['--color-offline', '#6b7280'],
  ['--color-offline-glow', '#9ca3af'],

  // Text scale
  ['--color-text-primary', '#def6ff'],
  ['--color-text-secondary', '#92a9b4'],
  ['--color-text-tertiary', '#55667a'],
  ['--color-text-ghost', '#33445a'],
])

/**
 * Banned naming patterns. These terms must not appear as CSS class names,
 * variable names, or token names anywhere in the source.
 */
const BANNED_NAMES = ['frost', 'cyan', 'ice', 'blue-accent'] as const

// ============================================================
// HELPERS
// ============================================================

/**
 * Convert a hex color to lowercase for comparison.
 * Handles both 3-digit and 6-digit hex.
 */
function normalizeHex(hex: string): string {
  const h = hex.toLowerCase().trim()
  if (h.length === 4) {
    // Expand #abc to #aabbcc
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  }
  return h
}

/**
 * Convert rgb(r, g, b) to #rrggbb hex string.
 */
function rgbToHex(rgb: string): string | null {
  const match = rgb.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
  if (!match) return null
  const r = parseInt(match[1], 10).toString(16).padStart(2, '0')
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0')
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditColorConsistency(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0
  const root = document.documentElement
  const rootStyle = getComputedStyle(root)

  // -- 1. Verify all token values match spec --
  for (const [tokenName, expectedHex] of TOKEN_EXPECTED_VALUES) {
    const rawValue = rootStyle.getPropertyValue(tokenName).trim()

    if (!rawValue) {
      findings.push({
        id: `color-${idx++}`,
        category: 'color-consistency',
        severity: 'error',
        target: `:root`,
        message: `Missing design token: ${tokenName}`,
        expected: expectedHex,
        actual: '(not defined)',
        specRef: 'Section 6.1',
      })
      continue
    }

    // Resolve to hex for comparison
    let resolvedHex: string | null = null
    if (rawValue.startsWith('#')) {
      resolvedHex = normalizeHex(rawValue)
    } else if (rawValue.startsWith('rgb(')) {
      resolvedHex = rgbToHex(rawValue)
    } else if (rawValue.startsWith('rgba(')) {
      // RGBA tokens (borders, etc.) cannot be compared as hex -- skip
      continue
    }

    if (resolvedHex && resolvedHex !== normalizeHex(expectedHex)) {
      findings.push({
        id: `color-${idx++}`,
        category: 'color-consistency',
        severity: 'error',
        target: `:root ${tokenName}`,
        message: `Token value mismatch: ${tokenName}`,
        expected: expectedHex,
        actual: rawValue,
        specRef: 'Section 6.1',
      })
    }
  }

  // -- 2. Check for banned naming in all stylesheets --
  try {
    for (const sheet of document.styleSheets) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        // Cross-origin stylesheet, skip
        continue
      }

      for (const rule of rules) {
        const ruleText = rule.cssText.toLowerCase()
        for (const banned of BANNED_NAMES) {
          if (ruleText.includes(banned)) {
            findings.push({
              id: `color-${idx++}`,
              category: 'color-consistency',
              severity: 'error',
              target: (rule as CSSStyleRule).selectorText || 'unknown rule',
              message: `Banned color name "${banned}" found in stylesheet`,
              expected: 'Use "ember" or "teal" naming convention',
              actual: `Contains "${banned}"`,
              specRef: 'Section 1.5 (ember/teal dual-accent)',
            })
          }
        }
      }
    }
  } catch {
    findings.push({
      id: `color-${idx++}`,
      category: 'color-consistency',
      severity: 'warning',
      target: 'document.styleSheets',
      message: 'Could not fully audit stylesheets (cross-origin or access error)',
      expected: 'Full stylesheet access',
      actual: 'Partial access',
      specRef: 'Section 1.5',
    })
  }

  // -- 3. Check for banned naming in DOM class attributes --
  const allElements = document.querySelectorAll('[class]')
  for (const el of allElements) {
    const classes = el.className.toString().toLowerCase()
    for (const banned of BANNED_NAMES) {
      if (classes.includes(banned)) {
        findings.push({
          id: `color-${idx++}`,
          category: 'color-consistency',
          severity: 'error',
          target: el.tagName + (el.id ? `#${el.id}` : ''),
          message: `Banned color name "${banned}" found in class attribute`,
          expected: 'Use "ember" or "teal" naming',
          actual: classes.slice(0, 60),
          specRef: 'Section 1.5',
        })
      }
    }
  }

  return findings
}

registerAudit('color-consistency', auditColorConsistency)
```

### 4.7 Performance Audit + Frame Budget Monitor -- `src/lib/audits/performance-audit.ts`

Audits GPU layer promotion, `will-change` usage, CSS containment, and composite layer count. The companion hook `useFrameBudgetMonitor` provides continuous 60fps verification at runtime.

```ts
/**
 * Performance Audit
 *
 * Verifies:
 * 1. will-change is applied to the spatial canvas container.
 * 2. CSS contain: layout style paint is applied to capsules and panels.
 * 3. backdrop-filter elements have pan-state fallback.
 * 4. No elements use top/left/margin/width/height for animation
 *    (Section 4.3 rule #6: "Use transform for all movement").
 * 5. Particle canvas overlay has pointer-events: none.
 * 6. will-change is not over-applied (too many promoted layers = memory).
 *
 * Source: WS-4.4 D-POLISH-6
 * Reference: VISUAL-DESIGN-SPEC.md Section 4.3
 */

import { registerAudit, queryComputedStyles, type AuditFinding } from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

/** Maximum acceptable promoted layers before warning */
const MAX_WILL_CHANGE_ELEMENTS = 25

/** Elements that MUST have will-change: transform */
const REQUIRED_WILL_CHANGE: readonly string[] = ['.spatial-canvas', '[data-spatial-canvas]']

/** Elements that MUST have CSS containment */
const REQUIRED_CONTAINMENT: readonly string[] = [
  '.capsule',
  '[data-capsule]',
  '.station-panel',
  '[data-station-panel]',
]

/** Overlays that MUST have pointer-events: none */
const REQUIRED_NO_POINTER: readonly string[] = [
  '.particle-canvas',
  '[data-particle-canvas]',
  '.scanline-overlay',
  '.grid-pulse-overlay',
  '.film-grain-overlay',
  '.noise-overlay',
]

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditPerformance(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0

  // -- 1. Required will-change --
  for (const selector of REQUIRED_WILL_CHANGE) {
    const elements = queryComputedStyles(selector)
    for (const { element, style } of elements) {
      const willChange = style.willChange
      if (!willChange.includes('transform')) {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'error',
          target: selector,
          message: 'Spatial canvas missing will-change: transform',
          expected: 'will-change: transform',
          actual: `will-change: ${willChange}`,
          specRef: 'Section 4.3 rule #1',
        })
      }
    }
  }

  // -- 2. CSS containment --
  for (const selector of REQUIRED_CONTAINMENT) {
    const elements = queryComputedStyles(selector)
    for (const { element, style } of elements) {
      const contain = style.contain
      if (!contain.includes('layout') || !contain.includes('style') || !contain.includes('paint')) {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'warning',
          target: selector,
          message: 'Element missing CSS containment',
          expected: 'contain: layout style paint',
          actual: `contain: ${contain}`,
          specRef: 'Section 4.3 rule #4',
        })
      }
    }
  }

  // -- 3. Overlay pointer-events --
  for (const selector of REQUIRED_NO_POINTER) {
    const elements = queryComputedStyles(selector)
    for (const { element, style } of elements) {
      if (style.pointerEvents !== 'none') {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'error',
          target: selector,
          message: 'Overlay element must have pointer-events: none',
          expected: 'pointer-events: none',
          actual: `pointer-events: ${style.pointerEvents}`,
          specRef: 'Section 5.1 (overlays)',
        })
      }
    }
  }

  // -- 4. will-change overuse check --
  const allWillChange = document.querySelectorAll('*')
  let willChangeCount = 0
  for (const el of allWillChange) {
    const style = getComputedStyle(el)
    if (style.willChange !== 'auto') {
      willChangeCount++
    }
  }
  if (willChangeCount > MAX_WILL_CHANGE_ELEMENTS) {
    findings.push({
      id: `perf-${idx++}`,
      category: 'performance',
      severity: 'warning',
      target: 'document',
      message: `Too many elements with will-change (${willChangeCount}). Excessive layer promotion wastes GPU memory.`,
      expected: `<= ${MAX_WILL_CHANGE_ELEMENTS} elements`,
      actual: `${willChangeCount} elements`,
      specRef: 'Section 4.3 (general performance)',
    })
  }

  // -- 5. Transition property audit (no top/left/margin/width/height) --
  const transitionElements = document.querySelectorAll(
    '[style*="transition"], [class*="transition"]'
  )
  for (const el of transitionElements) {
    const style = getComputedStyle(el)
    const transition = style.transition
    const bannedProps = ['top', 'left', 'right', 'bottom', 'margin', 'width', 'height']
    for (const prop of bannedProps) {
      // Check if transition explicitly targets a banned property
      // (not just "all" which is acceptable but flagged as warning)
      const regex = new RegExp(`\\b${prop}\\b`)
      if (regex.test(transition) && !transition.includes('transform')) {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'error',
          target: el.tagName + (el.id ? `#${el.id}` : ''),
          message: `Element transitions "${prop}" instead of using transform`,
          expected: 'Use transform: translate()/scale() for all movement',
          actual: `transition includes "${prop}"`,
          specRef: 'Section 4.3 rule #6',
        })
      }
    }
  }

  return findings
}

registerAudit('performance', auditPerformance)
```

**Companion hook:** `src/hooks/use-frame-budget-monitor.ts`

```ts
'use client'

/**
 * Frame Budget Monitor
 *
 * Continuously measures frame timing via requestAnimationFrame.
 * Classifies performance into the three tiers used by WS-3.7
 * Attention Choreography and this WS-4.4 Polish Pass.
 *
 * Returns a rolling average FPS and flags any frames that exceed
 * the 16.67ms budget (at 60fps).
 *
 * Dev-mode only. Returns static values in production.
 *
 * Source: WS-4.4 D-POLISH-6
 * Reference: VISUAL-DESIGN-SPEC.md Section 4.3, WS-3.7 PerformanceLevel
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface FrameBudgetState {
  /** Rolling average FPS over the sample window */
  readonly avgFps: number
  /** Number of frames that exceeded 16.67ms in the sample window */
  readonly droppedFrames: number
  /** Performance tier classification */
  readonly performanceLevel: 'full' | 'reduced' | 'minimal'
  /** Whether monitoring is active */
  readonly isMonitoring: boolean
  /** Total frames sampled */
  readonly totalFrames: number
}

interface UseFrameBudgetMonitorOptions {
  /** Number of frames to average over. Default: 120 (2 seconds at 60fps). */
  readonly sampleWindow?: number
  /** Whether to start monitoring immediately. Default: true in dev. */
  readonly enabled?: boolean
}

const FRAME_BUDGET_MS = 16.67 // 1000ms / 60fps

export function useFrameBudgetMonitor(
  options: UseFrameBudgetMonitorOptions = {}
): FrameBudgetState {
  const { sampleWindow = 120, enabled = process.env.NODE_ENV === 'development' } = options

  const [state, setState] = useState<FrameBudgetState>({
    avgFps: 60,
    droppedFrames: 0,
    performanceLevel: 'full',
    isMonitoring: false,
    totalFrames: 0,
  })

  const frameTimesRef = useRef<number[]>([])
  const lastFrameRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const totalFramesRef = useRef<number>(0)

  const classify = useCallback((fps: number): 'full' | 'reduced' | 'minimal' => {
    if (fps >= 55) return 'full'
    if (fps >= 30) return 'reduced'
    return 'minimal'
  }, [])

  useEffect(() => {
    if (!enabled) return

    let mounted = true

    const tick = (now: number) => {
      if (!mounted) return

      if (lastFrameRef.current > 0) {
        const delta = now - lastFrameRef.current
        frameTimesRef.current.push(delta)
        totalFramesRef.current++

        // Trim to sample window
        if (frameTimesRef.current.length > sampleWindow) {
          frameTimesRef.current.shift()
        }

        // Update state every 30 frames (~0.5s) to avoid excessive re-renders
        if (totalFramesRef.current % 30 === 0) {
          const times = frameTimesRef.current
          const avgDelta = times.reduce((sum, t) => sum + t, 0) / times.length
          const avgFps = Math.round(1000 / avgDelta)
          const dropped = times.filter((t) => t > FRAME_BUDGET_MS).length

          setState({
            avgFps,
            droppedFrames: dropped,
            performanceLevel: classify(avgFps),
            isMonitoring: true,
            totalFrames: totalFramesRef.current,
          })
        }
      }

      lastFrameRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, sampleWindow, classify])

  return state
}
```

### 4.8 Reduced Motion Audit -- `src/lib/audits/reduced-motion-audit.ts`

Verifies every animation in the system has a `prefers-reduced-motion: reduce` path.

```ts
/**
 * Reduced Motion Audit
 *
 * Verifies:
 * 1. All CSS @keyframes referenced by ambient-effects.css are disabled
 *    inside @media (prefers-reduced-motion: reduce).
 * 2. All motion/react animated components use useReducedMotion() and
 *    provide a static fallback.
 * 3. The ParticleField Canvas renders static positions (no drift).
 * 4. WS-2.1 morph choreography skips animated phases.
 * 5. WS-3.7 attention choreography resolves to static EffectConfig.
 *
 * This audit is split into two parts:
 * - Runtime CSS check (can the browser confirm animations are off?)
 * - Static checklist (must be manually verified and checked off)
 *
 * Source: WS-4.4 D-POLISH-7
 * Reference: VISUAL-DESIGN-SPEC.md (all animation sections), AD-3
 */

import { registerAudit, type AuditFinding } from './visual-polish-audit'

// ============================================================
// KNOWN ANIMATION CLASSES
// ============================================================

/**
 * All CSS classes that apply animation. These MUST have their animation
 * property set to "none" when prefers-reduced-motion: reduce is active.
 *
 * Source: WS-1.6 ambient-effects.css @media rule.
 */
const ANIMATED_CLASSES = [
  '.ambient-heartbeat',
  '.ambient-breathe',
  '.ambient-grid-pulse',
  '.ambient-scanline',
  '.health-bar', // heartbeat animation
  '.hub-center', // breathe animation
  '.grid-pulse-overlay', // grid-pulse animation
  '.scanline', // scan animation
] as const

/**
 * All motion/react components that must check useReducedMotion().
 * These are verified by checking for the data-reduced-motion attribute
 * that components should apply when reduced motion is active.
 */
const MOTION_COMPONENTS = [
  '[data-morph-container]', // WS-2.1 morph orchestrator
  '[data-station-entrance]', // WS-2.1 station entrance
  '[data-receipt-stamp]', // WS-2.6 receipt stamp animation
  '[data-narration-panel]', // WS-3.6 narration panel entrance
  '[data-next-best-actions]', // WS-3.7 action chips
] as const

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditReducedMotion(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0

  // Detect if reduced motion is currently active
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isReducedMotion) {
    findings.push({
      id: `rm-${idx++}`,
      category: 'reduced-motion',
      severity: 'info',
      target: 'media query',
      message:
        'prefers-reduced-motion is NOT active. Enable it in OS settings or ' +
        'Chrome DevTools (Rendering > Emulate CSS media feature) to run the ' +
        'full reduced motion audit.',
      expected: 'prefers-reduced-motion: reduce',
      actual: 'no-preference',
      specRef: 'AD-3 (ambient tier)',
    })
    return findings
  }

  // -- 1. Check that all animated CSS classes have animation: none --
  for (const selector of ANIMATED_CLASSES) {
    const elements = document.querySelectorAll(selector)
    for (const el of elements) {
      const style = getComputedStyle(el)
      const animation = style.animation || style.getPropertyValue('animation')
      const animName = style.animationName

      if (animName !== 'none' && animName !== '' && !animation.includes('none')) {
        findings.push({
          id: `rm-${idx++}`,
          category: 'reduced-motion',
          severity: 'error',
          target: selector,
          message: `Animation still active during prefers-reduced-motion: reduce`,
          expected: 'animation: none !important',
          actual: `animation-name: ${animName}`,
          specRef: 'WS-1.6 ambient-effects.css @media rule',
        })
      }
    }
  }

  // -- 2. Check that ParticleField Canvas is static --
  const particleCanvases = document.querySelectorAll('canvas[data-particle-canvas]')
  for (const canvas of particleCanvases) {
    const isStatic = canvas.getAttribute('data-reduced-motion') === 'true'
    if (!isStatic) {
      findings.push({
        id: `rm-${idx++}`,
        category: 'reduced-motion',
        severity: 'error',
        target: 'canvas[data-particle-canvas]',
        message: 'ParticleField should render static positions in reduced motion',
        expected: 'data-reduced-motion="true"',
        actual: canvas.getAttribute('data-reduced-motion') || '(not set)',
        specRef: 'WS-1.6 ParticleField reduced motion behavior',
      })
    }
  }

  // -- 3. Check motion/react components for reduced motion handling --
  for (const selector of MOTION_COMPONENTS) {
    const elements = document.querySelectorAll(selector)
    for (const el of elements) {
      // In reduced motion, motion/react components should either:
      // (a) Render with no transition (instant state), or
      // (b) Apply data-reduced-motion="true" for verification.
      const style = getComputedStyle(el)
      const transition = style.transition
      const hasReducedAttr = el.getAttribute('data-reduced-motion') === 'true'

      // If element has active transitions and no reduced-motion marker,
      // it may not be handling reduced motion correctly.
      if (
        !hasReducedAttr &&
        transition &&
        transition !== 'none' &&
        transition !== 'all 0s ease 0s'
      ) {
        findings.push({
          id: `rm-${idx++}`,
          category: 'reduced-motion',
          severity: 'warning',
          target: selector,
          message: 'motion/react component may not handle reduced motion',
          expected: 'Instant state change or data-reduced-motion="true"',
          actual: `transition: ${transition.slice(0, 60)}`,
          specRef: 'AD-3 (choreography tier)',
        })
      }
    }
  }

  return findings
}

registerAudit('reduced-motion', auditReducedMotion)
```

### 4.9 Ambient Effects Timing Refinement -- `src/styles/ambient-effects.css` (MODIFY)

Refinements to the existing `ambient-effects.css` from WS-1.6. All changes are timing adjustments and performance improvements based on full-system visual review.

```css
/* =================================================================
   Tarva Launch -- Ambient Effects Keyframes (Polished)
   =================================================================
   Source: WS-1.6 (original), WS-4.4 (timing refinements)
   Reference: VISUAL-DESIGN-SPEC.md Sections 5.1-5.6
   Tier: Ambient (AD-3) -- compositor thread, zero main-thread cost.

   CHANGES from WS-1.6 baseline (WS-4.4 polish):
   - Heartbeat: added subtle opacity hold at peak for readability
   - Breathe: widened glow delta for more visible oscillation
   - Grid pulse: adjusted timing curve for smoother fade-out tail
   - Scan: added will-change hint for GPU compositing
   - Added shimmer keyframe for particle opacity oscillation
   - Added attention-dampen keyframe for tighten-state suppression
   ================================================================= */

/* -----------------------------------------------------------------
   5.2 Heartbeat Pulse (POLISHED)
   Applied to capsule health indicator bars.
   Cycle: 7s. Sharp rise (0-12%), subtle hold (12-16%), slow fall.
   WS-4.4 change: added 4% hold at peak for better readability.
   ----------------------------------------------------------------- */
@keyframes heartbeat {
  0%,
  100% {
    opacity: 0.35;
    transform: scaleY(1);
  }
  12% {
    opacity: 0.55;
    transform: scaleY(1.8);
  }
  16% {
    opacity: 0.52;
    transform: scaleY(1.65);
  }
  30% {
    opacity: 0.4;
    transform: scaleY(1.1);
  }
}

/* -----------------------------------------------------------------
   5.3 Launch Center Glow Breathing (POLISHED)
   Cycle: 5s. Smooth sine-wave glow oscillation.
   WS-4.4 change: increased peak blur from 48px to 52px and peak
   opacity from 0.14 to 0.16 for stronger visual presence when
   viewed alongside other ambient effects.
   ----------------------------------------------------------------- */
@keyframes breathe {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(224, 82, 0, 0.06),
      0 0 8px rgba(224, 82, 0, 0.1);
  }
  50% {
    box-shadow:
      0 0 52px rgba(224, 82, 0, 0.16),
      0 0 18px rgba(224, 82, 0, 0.24);
  }
}

/* -----------------------------------------------------------------
   5.4 Grid Pulse (POLISHED)
   Radial wave expanding from hub center.
   WS-4.4 change: extended tail fade from 40%-100% to 35%-100%
   for smoother dissipation. Reduced peak opacity from 1.0 to 0.8
   to avoid competing with capsule glows.
   ----------------------------------------------------------------- */
@keyframes grid-pulse {
  0% {
    opacity: 0;
    background-size: 0% 0%;
  }
  5% {
    opacity: 0.8;
    background-size: 10% 10%;
  }
  35% {
    opacity: 0.5;
    background-size: 200% 200%;
  }
  100% {
    opacity: 0;
    background-size: 400% 400%;
  }
}

/* -----------------------------------------------------------------
   5.5 Scanline Sweep (POLISHED)
   Triggered on state change events. Top-to-bottom traversal.
   WS-4.4 change: added will-change: transform for GPU compositing.
   ----------------------------------------------------------------- */
@keyframes scan {
  0% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(var(--scan-height, 228px));
  }
}

/* -----------------------------------------------------------------
   Particle Shimmer (NEW in WS-4.4)
   Per-particle opacity oscillation sub-cycle.
   Used by ParticleField Canvas fallback and CSS particle variants.
   Duration: 8-12s per particle (set via --shimmer-duration).
   ----------------------------------------------------------------- */
@keyframes shimmer {
  0%,
  100% {
    opacity: var(--shimmer-min, 0.06);
  }
  50% {
    opacity: var(--shimmer-max, 0.18);
  }
}

/* -----------------------------------------------------------------
   Attention Dampen (NEW in WS-4.4)
   Transitional keyframe used during calm -> tighten state change.
   Smoothly reduces ambient animation intensity over 300ms.
   Applied by WS-3.7 attention choreography CSS bridge.
   ----------------------------------------------------------------- */
@keyframes attention-dampen {
  from {
    --attention-ambient-scale: 1;
  }
  to {
    --attention-ambient-scale: var(--attention-target-scale, 0.3);
  }
}

/* -----------------------------------------------------------------
   Scanline elements: GPU compositing hint.
   ----------------------------------------------------------------- */
.ambient-scanline,
.scanline {
  will-change: transform;
}

/* -----------------------------------------------------------------
   Reduced motion: disable ALL ambient keyframes.
   Film grain is static and remains unaffected.
   Shimmer and attention-dampen are also suppressed.
   ----------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .ambient-heartbeat,
  .ambient-breathe,
  .ambient-grid-pulse,
  .ambient-scanline,
  .ambient-shimmer,
  .ambient-attention-dampen,
  .health-bar,
  .hub-center,
  .grid-pulse-overlay,
  .scanline {
    animation: none !important;
  }
}
```

### 4.10 Transition Polish -- `src/styles/visual-polish-overrides.css`

Targeted CSS overrides for transition timing, spring physics visual tuning, and glow corrections. These are applied after all component stylesheets and represent the final tuning pass.

```css
/* =================================================================
   Tarva Launch -- Visual Polish Overrides
   =================================================================
   Source: WS-4.4 (Visual Polish Pass)
   Applied AFTER all component stylesheets.
   Contains: transition timing corrections, glow intensity tuning,
   spring-physics visual compensation, and pan-state optimizations.

   Load order:
   1. @tarva/ui base styles
   2. spatial-tokens.css (WS-0.2)
   3. ambient-effects.css (WS-1.6, polished by WS-4.4)
   4. station-panel.css (WS-2.6)
   5. attention-choreography.css (WS-3.7)
   6. visual-polish-overrides.css (THIS FILE -- last)
   ================================================================= */

/* -----------------------------------------------------------------
   TRANSITION TIMING CORRECTIONS
   Polish pass found that hover transitions feel snappier at 180ms
   than the spec's 200ms when combined with the glass material change.
   The 20ms reduction removes a perceptible "lag" after cursor enters.
   ----------------------------------------------------------------- */
.capsule,
[data-capsule] {
  transition:
    transform 180ms var(--ease-hover),
    box-shadow 200ms var(--ease-glow),
    background-color 200ms ease-out,
    border-color 200ms ease-out;
}

/* -----------------------------------------------------------------
   MORPH PHASE TIMING VISUAL COMPENSATION
   During the "focusing" phase (300ms), the camera spring and capsule
   scale animate simultaneously. The scale needs to lead by ~30ms
   to feel connected to the camera motion rather than lagging behind.
   This is achieved by shortening the scale transition duration.
   ----------------------------------------------------------------- */
[data-morph-phase='focusing'] .capsule[data-selected='true'] {
  transition: transform 270ms var(--ease-morph);
}

/* Siblings drift out slightly faster to clear visual space */
[data-morph-phase='focusing'] .capsule[data-selected='false'] {
  transition:
    transform 300ms var(--ease-morph),
    opacity 250ms ease-out;
}

/* -----------------------------------------------------------------
   UNFURLING STATION ENTRANCE STAGGER REFINEMENT
   The base 80ms stagger from WS-2.1 works for 3 stations but
   feels rushed at 5 stations. Use a slightly longer stagger (90ms)
   and a softer easing for a more "unfurling" feel.
   ----------------------------------------------------------------- */
[data-morph-phase='unfurling'] [data-station-entrance] {
  --station-stagger: 90ms;
}

/* -----------------------------------------------------------------
   GLOW INTENSITY CORRECTIONS
   Full-system review revealed that ember glow-subtle is too dim
   against the void background when multiple capsules are visible.
   Increase the outer haze opacity from 0.08 to 0.10 for better
   ambient presence at Z1 atrium view.
   ----------------------------------------------------------------- */
.capsule:not(:hover):not([data-selected='true']) {
  box-shadow:
    0 0 14px rgba(224, 82, 0, 0.1),
    0 0 5px rgba(224, 82, 0, 0.14);
}

/* -----------------------------------------------------------------
   GLASS PANEL PAN-STATE FALLBACK REFINEMENT
   WS-2.6 swaps backdrop-filter to none during pan. The transition
   back to blur after pan-end should be imperceptible. Use a 100ms
   fade-in for the blur restoration to avoid a visual "pop".
   ----------------------------------------------------------------- */
.station-panel,
.station-glass,
.station-glass-active,
.capsule {
  transition:
    backdrop-filter 100ms ease-out,
    -webkit-backdrop-filter 100ms ease-out;
}

/* During pan: immediate removal (no transition delay) */
[data-panning='true'] .station-panel,
[data-panning='true'] .station-glass,
[data-panning='true'] .station-glass-active,
[data-panning='true'] .capsule {
  transition: none;
}

/* -----------------------------------------------------------------
   HUB CENTER GLYPH GLOW FLOOR
   The breathing animation dips to 0.06 opacity at its minimum,
   which can make the hub center feel "dead" when other capsule
   glows are brighter. Set a minimum glow floor so the center
   always maintains a faint ember presence.
   ----------------------------------------------------------------- */
.hub-center {
  box-shadow:
    0 0 20px rgba(224, 82, 0, 0.06),
    0 0 8px rgba(224, 82, 0, 0.1);
  /* The breathe animation overrides this; this is the static fallback */
}

/* -----------------------------------------------------------------
   TEAL DATA GLOW CONSISTENCY
   Ensure all telemetry sparklines and data values that use teal
   glow share the same 2-layer recipe from VISUAL-DESIGN-SPEC.md
   Section 1.8.
   ----------------------------------------------------------------- */
.sparkline-glow,
[data-telemetry-highlight] {
  box-shadow:
    0 0 12px rgba(39, 115, 137, 0.1),
    0 0 4px rgba(58, 153, 184, 0.15);
}

.sparkline-glow:hover,
[data-telemetry-highlight]:hover {
  box-shadow:
    0 0 20px rgba(39, 115, 137, 0.15),
    0 0 8px rgba(96, 200, 232, 0.25);
}

/* -----------------------------------------------------------------
   FILM GRAIN Z-INDEX FIX
   Film grain must be above everything but below the command palette.
   WS-1.6 set z-index: 9999 which conflicts with modals. Correct
   to z-40 (below command palette at z-50).
   ----------------------------------------------------------------- */
.noise-overlay,
.film-grain-overlay {
  z-index: 40;
}

/* -----------------------------------------------------------------
   NARRATION PANEL GLASS TREATMENT
   WS-3.6 NarrationPanel should use standard glass, not active glass,
   because it is supplementary information, not the focused element.
   ----------------------------------------------------------------- */
[data-narration-panel] {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
}
```

### 4.11 Comprehensive Reduced Motion Stylesheet -- `src/styles/reduced-motion.css`

A single file that guarantees every animation path in the application is suppressed when the user prefers reduced motion. This is the safety net that catches any animation not already handled by individual component `useReducedMotion()` checks.

```css
/* =================================================================
   Tarva Launch -- Comprehensive Reduced Motion Overrides
   =================================================================
   Source: WS-4.4 D-POLISH-7 (Reduced Motion Pass)
   Reference: VISUAL-DESIGN-SPEC.md (all animation sections), AD-3

   This stylesheet is the LAST-RESORT safety net. Individual components
   should already handle reduced motion via useReducedMotion() from
   @tarva/ui/motion. This file catches anything they miss.

   Load order: LAST (after visual-polish-overrides.css)
   ================================================================= */

@media (prefers-reduced-motion: reduce) {
  /* ---------------------------------------------------------------
     TIER 1: Ambient CSS Animations (WS-1.6)
     All CSS @keyframes animations are disabled.
     --------------------------------------------------------------- */
  .ambient-heartbeat,
  .ambient-breathe,
  .ambient-grid-pulse,
  .ambient-scanline,
  .ambient-shimmer,
  .ambient-attention-dampen,
  .health-bar,
  .hub-center,
  .grid-pulse-overlay,
  .scanline,
  .scanline-ghost-1,
  .scanline-ghost-2 {
    animation: none !important;
    transition: none !important;
  }

  /* ---------------------------------------------------------------
     TIER 2: Choreography Transitions (WS-2.1, WS-2.6)
     All motion/react animated elements get instant transitions.
     --------------------------------------------------------------- */
  .capsule,
  [data-capsule],
  [data-morph-container],
  [data-station-entrance],
  [data-district-shell],
  .station-panel,
  [data-station-panel] {
    transition: none !important;
    animation: none !important;
  }

  /* ---------------------------------------------------------------
     TIER 3: Hover and interaction micro-transitions
     Preserve color/opacity changes (informational) but remove
     transforms and motion.
     --------------------------------------------------------------- */
  .capsule:hover,
  [data-capsule]:hover {
    transform: none !important;
    /* Allow background-color and border-color changes (static) */
  }

  /* ---------------------------------------------------------------
     TIER 4: Receipt stamp animation (WS-2.6)
     Show receipt information instantly, no fade/slide.
     --------------------------------------------------------------- */
  [data-receipt-stamp] {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
  }

  /* ---------------------------------------------------------------
     TIER 5: Narration panel entrance (WS-3.6)
     --------------------------------------------------------------- */
  [data-narration-panel] {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  /* ---------------------------------------------------------------
     TIER 6: Next-best-actions chips (WS-3.7)
     --------------------------------------------------------------- */
  [data-next-best-actions] {
    animation: none !important;
    transition: none !important;
  }

  /* ---------------------------------------------------------------
     TIER 7: Global catch-all for any CSS transition or animation
     that was missed by the above specific rules.
     Uses a low-specificity selector so component-level rules
     can override if they intentionally allow certain transitions.
     --------------------------------------------------------------- */
  *:not(.reduced-motion-exempt) {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }

  /* ---------------------------------------------------------------
     EXCEPTIONS: Elements that remain unaffected by reduced motion.
     Film grain is already static (SVG filter, no animation).
     Color changes are informational and non-motion.
     --------------------------------------------------------------- */
  .noise-overlay,
  .film-grain-overlay {
    /* Static SVG filter -- no animation to disable */
  }
}
```

### 4.12 Audit Barrel Export -- `src/lib/audits/index.ts`

```ts
/**
 * Visual Polish Audit Barrel Export
 *
 * Import this module to register all audits and access the runner.
 * Individual audit modules self-register via registerAudit() on import.
 *
 * Usage:
 *   import { runVisualPolishAudit } from '@/lib/audits'
 *   const report = await runVisualPolishAudit()
 *
 * Source: WS-4.4
 */

// Import all audit modules (self-registering via registerAudit)
import './glass-material-audit'
import './glow-system-audit'
import './typography-audit'
import './color-consistency-audit'
import './performance-audit'
import './reduced-motion-audit'

// Re-export the runner and types
export {
  runVisualPolishAudit,
  type VisualPolishReport,
  type AuditFinding,
  type AuditCategorySummary,
  type AuditCategory,
  type AuditSeverity,
} from './visual-polish-audit'
```

### 4.13 Dev-Only Visual Polish Overlay -- `src/components/dev/visual-polish-overlay.tsx`

A development-mode overlay that renders audit results in the bottom-left corner of the viewport for continuous monitoring during the polish pass.

```tsx
'use client'

/**
 * Visual Polish Dev Overlay
 *
 * Renders a compact audit summary in the bottom-left corner during
 * development. Click to expand full findings. Re-runs audit on
 * demand via a "Re-audit" button.
 *
 * Only renders when process.env.NODE_ENV === 'development'.
 * Completely tree-shaken in production builds.
 *
 * Source: WS-4.4 D-POLISH-1
 */

import { useState, useCallback, useEffect } from 'react'
import { runVisualPolishAudit, type VisualPolishReport, type AuditFinding } from '@/lib/audits'
import { useFrameBudgetMonitor } from '@/hooks/use-frame-budget-monitor'

// Guard: only render in development
const IS_DEV = process.env.NODE_ENV === 'development'

export function VisualPolishOverlay() {
  if (!IS_DEV) return null
  return <OverlayInner />
}

function OverlayInner() {
  const [report, setReport] = useState<VisualPolishReport | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const frameBudget = useFrameBudgetMonitor()

  const runAudit = useCallback(async () => {
    setLoading(true)
    try {
      const result = await runVisualPolishAudit()
      setReport(result)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run once on mount
  useEffect(() => {
    const timer = setTimeout(runAudit, 2000) // Wait for DOM to settle
    return () => clearTimeout(timer)
  }, [runAudit])

  const errorCount = report?.findings.filter((f) => f.severity === 'error').length ?? 0
  const warningCount = report?.findings.filter((f) => f.severity === 'warning').length ?? 0

  const statusColor =
    errorCount > 0
      ? 'var(--color-error)'
      : warningCount > 0
        ? 'var(--color-warning)'
        : 'var(--color-healthy)'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--color-text-secondary)',
        pointerEvents: 'auto',
      }}
    >
      {/* Compact badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'rgba(15, 22, 31, 0.90)',
          border: `1px solid ${statusColor}`,
          borderRadius: 6,
          padding: '4px 8px',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor,
          }}
        />
        POLISH {errorCount}E {warningCount}W | {frameBudget.avgFps}fps
      </button>

      {/* Expanded panel */}
      {expanded && report && (
        <div
          style={{
            background: 'rgba(15, 22, 31, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: 12,
            marginTop: 4,
            maxHeight: 400,
            overflowY: 'auto',
            width: 420,
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span>
              Audit: {report.findings.length} findings in {report.duration.toFixed(0)}ms
            </span>
            <button
              onClick={runAudit}
              disabled={loading}
              style={{
                background: 'rgba(224, 82, 0, 0.2)',
                border: '1px solid rgba(224, 82, 0, 0.3)',
                borderRadius: 4,
                padding: '2px 6px',
                color: 'var(--color-ember-bright)',
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}
            >
              {loading ? '...' : 'Re-audit'}
            </button>
          </div>

          {/* Category summary */}
          {report.summary.map((cat) => (
            <div
              key={cat.category}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span>{cat.category}</span>
              <span
                style={{
                  color: cat.passed ? 'var(--color-healthy)' : 'var(--color-error)',
                }}
              >
                {cat.errors}E {cat.warnings}W {cat.infos}I
              </span>
            </div>
          ))}

          {/* Findings list */}
          <div style={{ marginTop: 8 }}>
            {report.findings
              .filter((f) => f.severity !== 'info')
              .slice(0, 20)
              .map((f: AuditFinding) => (
                <div
                  key={f.id}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}
                >
                  <span
                    style={{
                      color: f.severity === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                      marginRight: 4,
                    }}
                  >
                    [{f.severity.toUpperCase()}]
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{f.target}</span>
                  <div style={{ paddingLeft: 8, opacity: 0.7 }}>{f.message}</div>
                </div>
              ))}
          </div>

          {/* Frame budget */}
          <div
            style={{
              marginTop: 8,
              padding: '4px 0',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            FPS: {frameBudget.avgFps} | Dropped: {frameBudget.droppedFrames} | Tier:{' '}
            {frameBudget.performanceLevel}
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                      | Verification                                                                                                                                                                                                                                                                                        |
| ----- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Glass material audit reports zero errors                       | Run `runVisualPolishAudit()` in browser console; filter `category === 'glass-material'` findings; assert `errors === 0`                                                                                                                                                                             |
| AC-2  | Glow system audit reports zero errors                          | Run audit; filter `category === 'glow-system'`; all luminous borders have >= 4 box-shadow layers; all ember glows use correct RGB values                                                                                                                                                            |
| AC-3  | Typography audit reports zero errors                           | Run audit; filter `category === 'typography'`; all Geist Sans/Mono assignments match Section 3.2; all telemetry values have `tabular-nums`                                                                                                                                                          |
| AC-4  | Color consistency audit reports zero errors                    | Run audit; filter `category === 'color-consistency'`; all ~89 tokens resolve to Section 6.1 values; zero banned names in stylesheets or class attributes                                                                                                                                            |
| AC-5  | Performance audit reports zero errors                          | Run audit; filter `category === 'performance'`; spatial canvas has `will-change: transform`; capsules have CSS containment; overlays have `pointer-events: none`; no layout-property transitions                                                                                                    |
| AC-6  | Frame budget monitor shows >= 55 fps average                   | Load the Launch Atrium with 6 capsules + all ambient effects. Record 30-second session including: idle (5s), hover capsules (5s), select + morph (5s), browse district (5s), deselect + return (5s), idle (5s). `useFrameBudgetMonitor()` reports `performanceLevel === 'full'` throughout          |
| AC-7  | Reduced motion audit reports zero errors                       | Enable `prefers-reduced-motion: reduce` in Chrome DevTools Rendering panel. Run audit; filter `category === 'reduced-motion'`. Zero animated elements visible. ParticleField canvas shows static dots. Morph transitions are instant.                                                               |
| AC-8  | Ambient effects timing feels natural in full-system context    | Qualitative check: launch the app, watch the Atrium for 30 seconds. Heartbeat pulses are visible but not distracting. Hub breathing is smooth and continuous. Grid pulse is barely perceptible. Particle drift is lazy and organic. No two effects appear to sync up (stagger offsets are working). |
| AC-9  | Morph transition sustains 60fps                                | Open Chrome DevTools Performance panel. Record a capsule selection morph (idle -> focusing -> morphing -> unfurling -> settled). The flame chart shows zero frames exceeding 16.67ms.                                                                                                               |
| AC-10 | All `motion/react` animations use `animate` prop, not `layout` | `grep -r "layout" src/components/ --include="*.tsx"` returns zero instances of Framer Motion `layout` prop on elements inside the spatial canvas container. (Per AD-3: never use layout animations inside CSS-transformed container.)                                                               |
| AC-11 | Film grain z-index does not block command palette or modals    | Open the command palette (Cmd+K). The command palette overlay is fully interactive and visually above the film grain. Modals are above the grain.                                                                                                                                                   |
| AC-12 | Narration panel uses standard glass, not active glass          | Inspect the `[data-narration-panel]` element in DevTools. Background opacity is 0.03 (not 0.06). Blur is 12px (not 16px). Saturate is 120% (not 130%).                                                                                                                                              |
| AC-13 | `pnpm run lint` passes with zero errors after all changes      | Execute `pnpm run lint` from project root. Zero lint errors. All new files follow project ESLint + Prettier configuration.                                                                                                                                                                          |
| AC-14 | Static color name audit passes                                 | Execute `grep -ri "frost\|cyan\|ice\|blue-accent" src/` from project root. Zero results.                                                                                                                                                                                                            |

---

## 6. Decisions Made

| ID    | Decision                                                                             | Rationale                                                                                                                                                                                                                                                             | Date       |
| ----- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| DM-1  | Ambient timing adjustments are applied via CSS modifications, not runtime JavaScript | CSS @keyframes run on the compositor thread (GPU) with zero main-thread cost. Adjusting timing in JS would move work to the main thread and risk frame drops.                                                                                                         | 2026-02-25 |
| DM-2  | Audits are runtime DOM checks, not static analysis                                   | Static analysis (AST parsing) cannot verify computed styles. The visual spec defines pixel-level properties that can only be verified against the rendered DOM in a running browser.                                                                                  | 2026-02-25 |
| DM-3  | Polish overrides are in a separate CSS file, not inline edits to source files        | Keeps the polish pass reversible. If any override causes a regression, it can be isolated. The file loads last in the cascade and uses targeted selectors.                                                                                                            | 2026-02-25 |
| DM-4  | Heartbeat peak hold extended by 4% of cycle                                          | The original 0-12% rise was technically correct but visually the peak was imperceptible at the 7s cycle duration. The 12-16% hold gives the eye time to register the pulse.                                                                                           | 2026-02-25 |
| DM-5  | Breathing glow peak increased from 48px/0.14 to 52px/0.16                            | In the full system with 6 capsule glows competing for attention, the hub center breathing was visually lost. The 8% increase restores its role as the visual anchor.                                                                                                  | 2026-02-25 |
| DM-6  | Capsule hover transition shortened from 200ms to 180ms                               | The 200ms spec value felt laggy when combined with the glass material transition. 180ms removes the perceptible delay while remaining within the "fast interaction" range.                                                                                            | 2026-02-25 |
| DM-7  | Film grain z-index corrected from 9999 to 40                                         | z-9999 blocked the command palette (z-50) and modals. z-40 keeps grain above spatial content but below overlays.                                                                                                                                                      | 2026-02-25 |
| DM-8  | Reduced motion global catch-all uses 0.001ms duration, not 0s                        | `animation-duration: 0s` can cause some browsers to skip the animation entirely (including `animationend` events that code may depend on). `0.001ms` is functionally instant but preserves event firing.                                                              | 2026-02-25 |
| DM-9  | Station stagger increased from 80ms to 90ms for unfurling                            | 80ms works for 3 stations but at 5 stations the total unfurl time (400ms) was too fast to read. 90ms extends to 450ms which feels more deliberate.                                                                                                                    | 2026-02-25 |
| DM-10 | Narration panel assigned standard glass, not active glass                            | The narration panel is supplementary information, not the focused element at Z3. Active glass (0.06 opacity, 16px blur) would visually compete with the station panel it is nested in. Standard glass (0.03 opacity, 12px blur) creates the correct visual hierarchy. | 2026-02-25 |

---

## 7. Open Questions

| ID   | Question                                                                                                                                                                        | Impact                                                                                                            | Owner                     | Status |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------- | ------ |
| OQ-1 | Should the visual polish audit run automatically on every dev server start, or only on-demand?                                                                                  | DX: auto-run adds ~200ms to initial page load in dev; on-demand requires remembering to run it.                   | `world-class-ui-designer` | Open   |
| OQ-2 | Should the frame budget monitor be visible by default in dev, or hidden behind a keyboard shortcut?                                                                             | DX: always-visible adds a small performance cost from the state updates every 30 frames.                          | `world-class-ui-designer` | Open   |
| OQ-3 | Are the breathing glow peak adjustments (48px->52px, 0.14->0.16) acceptable to the stakeholder, or should they remain at spec values?                                           | Visual: the adjustment is subtle but measurable. Stakeholder may prefer the original spec.                        | Stakeholder               | Open   |
| OQ-4 | Should the capsule hover timing change (200ms->180ms) be propagated back to VISUAL-DESIGN-SPEC.md as a spec update?                                                             | Consistency: the spec and implementation would diverge if not updated.                                            | `world-class-ui-designer` | Open   |
| OQ-5 | Should the audit system be extended to verify `motion/react` spring physics configs (stiffness, damping, mass) against spec values, or is timing-based verification sufficient? | Depth: spring configs determine the "feel" of transitions but are harder to verify programmatically from the DOM. | `react-developer`         | Open   |

---

## 8. Risk Register

| ID  | Risk                                                                                                        | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Timing adjustments feel worse than the original spec values                                                 | Medium     | Low    | Low      | All overrides are in `visual-polish-overrides.css` which can be disabled or reverted with a single file deletion. The original WS-1.6 and WS-2.1 timing remains in component source.                                                                      |
| R-2 | Global reduced-motion catch-all (`animation-duration: 0.001ms !important`) breaks animation-dependent logic | Low        | Medium | Low      | The catch-all targets `*:not(.reduced-motion-exempt)`. Any component that depends on `animationend` events can add the `.reduced-motion-exempt` class and handle reduced motion in JS via `useReducedMotion()`.                                           |
| R-3 | Runtime audit DOM queries cause perceptible frame drops on large pages                                      | Low        | Low    | Low      | Audits only run in development mode (`process.env.NODE_ENV === 'development'`). They are not in the production bundle. The initial run is delayed by 2 seconds after mount to avoid competing with critical rendering.                                    |
| R-4 | Polish override CSS specificity conflicts with component styles                                             | Medium     | Medium | Medium   | Override selectors are intentionally targeted (not `!important` except for reduced motion). If conflicts arise, increase specificity by prepending `[data-theme="tarva-core"]` to the selector.                                                           |
| R-5 | Film grain z-index change (9999->40) causes grain to appear below some spatial content                      | Low        | Low    | Low      | The spatial canvas content is at z-index: auto (default). z-40 is well above all spatial layers. Only fixed-position overlays (minimap, breadcrumb, zoom indicator at z-30) could potentially overlap, but grain at z-40 is above them, which is correct. |
| R-6 | Audits produce false positives when components have not yet mounted (initial render)                        | Medium     | Low    | Low      | The dev overlay delays the initial audit by 2 seconds. The "Re-audit" button allows re-running after navigation to ensure all components are in the DOM. Individual audit functions log `severity: 'info'` (not error) when elements are not found.       |
