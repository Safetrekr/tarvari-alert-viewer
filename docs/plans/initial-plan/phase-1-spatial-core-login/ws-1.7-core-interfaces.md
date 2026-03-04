# WS-1.7: Core Interfaces

> **Workstream ID:** WS-1.7
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `chief-technology-architect`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (scaffolding)
> **Blocks:** WS-1.5 (SystemStateProvider), WS-2.6 (StationTemplateRegistry), WS-3.1 (ReceiptStore), WS-3.3 (CommandPalette), WS-3.4 (AIRouter, CameraController), WS-3.5 (StationTemplateRegistry)
> **Resolves:** None

## 1. Objective

Define the six TypeScript interface contracts that form the AI-integration seam for Tarva Launch. These interfaces decouple the spatial engine, telemetry system, audit log, station catalog, AI routing, and command input from their underlying implementations -- so that Phase 1 ships with manual/polling/stub implementations and Phase 3 plugs in AI features without changing any consumer code.

Per AD-7, the system works without AI. If AI breaks, telemetry and spatial navigation still function. Every interface defined here has a Phase 1 implementation that delivers full functionality without any AI dependency.

**Success looks like:** Two independent teams could implement against these interfaces without coordination. A Phase 3 engineer reads `CameraController` and knows exactly how to wire the AI Camera Director. A Phase 1 engineer reads `ReceiptStore` and knows exactly how to record a login receipt.

**Traceability:** AD-7 (AI Integration Architecture), Gap #2 (Spine Object Model), Gap #3 (Status Model), AD-8 (Station Content per District), tech-decisions.md (AI routing table, Zustand stores, telemetry architecture).

## 2. Scope

### In Scope

- Shared domain types: `AppIdentifier`, `HealthState`, `SemanticLevel`, `CameraPosition`, `SpatialLocation`, spine object types (`ActivityType`, `ActivityStatus`), receipt classification types (`EventType`, `Severity`, `ReceiptSource`)
- `CameraController` interface with `CameraDirective`, `CameraTarget`, and `FlyToOptions` types; Phase 1 `ManualCameraController` that delegates to `camera.store`
- `SystemStateProvider` interface with `SystemSnapshot`, `AppState`, `GlobalMetrics`, and `DependencyStatus` types; Phase 1 `PollingSystemStateProvider` that reads from `districts.store`
- `ReceiptStore` interface with `LaunchReceipt` (12-field schema per AIA assessment), `AIReceiptMetadata`, `ReceiptInput`, and `ReceiptFilters` types; Phase 1 `InMemoryReceiptStore`
- `StationTemplateRegistry` interface with `StationTemplate`, `StationLayout`, `StationAction`, and `TriggerCondition` types; Phase 1 `StaticStationTemplateRegistry` with hardcoded stations per AD-8
- `AIRouter` interface with `AIFeature`, `AIProvider`, `AIRequest`, `AIResponse`, `RoutingRule`, and `ProviderStatus` types; Phase 1 `StubAIRouter` that returns unavailable for all features
- `CommandPalette` interface with `PaletteCommand`, `CommandResult`, `CommandArgs`, and `PaletteSuggestion` types; Phase 1 `StructuredCommandPalette` that pattern-matches structured commands only
- Barrel export file (`index.ts`)
- Update to `camera.store.ts` `SemanticLevel` type to import from shared types (alignment)

### Out of Scope

- Supabase schema for `launch_receipts` (WS-3.1)
- Actual TanStack Query polling integration (WS-1.5)
- Framer Motion choreography for camera animations (WS-1.1)
- cmdk UI rendering for command palette (WS-3.3)
- Ollama/Claude SDK integration (WS-3.4, WS-4.1)
- Station React component implementations (WS-2.x)
- Receipt stamp animation component (WS-3.1)
- Natural language command parsing (WS-3.3)
- Telemetry Route Handler implementation (WS-1.5)

## 3. Input Dependencies

| Dependency                                                         | Source                                            | Status    |
| ------------------------------------------------------------------ | ------------------------------------------------- | --------- |
| Camera state model (`offsetX`, `offsetY`, `zoom`, `semanticLevel`) | AD-1 (Camera State Management)                    | Finalized |
| Semantic zoom levels with hysteresis                               | AD-2 (Semantic Zoom)                              | Finalized |
| 5-state health model                                               | Gap #3 (Status Model)                             | Finalized |
| 5-object spine model                                               | Gap #2 (Spine Object Model)                       | Finalized |
| 12-field receipt schema                                            | AD-6 (Receipt System) + IA Assessment Section 5   | Finalized |
| AI routing table                                                   | tech-decisions.md (Feature-by-Feature AI Routing) | Finalized |
| Station content per district                                       | AD-8 (Station Content per District)               | Finalized |
| App identifiers and canonical names                                | Gap #4 (App Naming)                               | Finalized |
| Command palette commands and synonym ring                          | IA Assessment Section 4                           | Finalized |
| Zustand store skeletons                                            | WS-0.1 (`camera.store.ts`, `districts.store.ts`)  | Delivered |
| Project scaffolding with TypeScript strict mode                    | WS-0.1                                            | Delivered |

## 4. Deliverables

### 4.1 Shared Domain Types -- `src/lib/interfaces/types.ts`

All domain types shared across multiple interfaces. This file is the single source of truth for the Launch's type vocabulary.

```ts
/**
 * Shared domain types for Tarva Launch.
 *
 * These types form the vocabulary of the Launch's core interfaces.
 * Every type here is referenced by at least two interface contracts.
 *
 * References:
 * - Gap #2 (Spine Object Model)
 * - Gap #3 (Status Model)
 * - Gap #4 (App Naming)
 * - AD-1 (Camera State Management)
 * - AD-2 (Semantic Zoom with Hysteresis)
 * - AD-6 (Receipt System)
 * - IA Assessment Sections 2-5
 */

// ============================================================================
// App Identity
// ============================================================================

/**
 * Canonical application identifiers.
 * Matches the `code/ID` column in Gap #4 (App Naming).
 * tarvaCODE is included as a stub district per stakeholder directive.
 */
export type AppIdentifier =
  | 'agent-builder'
  | 'tarva-chat'
  | 'project-room'
  | 'tarva-core'
  | 'tarva-erp'
  | 'tarva-code'

/** Display names for each app. Used in capsules, breadcrumbs, and receipts. */
export const APP_DISPLAY_NAMES: Readonly<Record<AppIdentifier, string>> = {
  'agent-builder': 'Agent Builder',
  'tarva-chat': 'Tarva Chat',
  'project-room': 'Project Room',
  'tarva-core': 'TarvaCORE',
  'tarva-erp': 'TarvaERP',
  'tarva-code': 'tarvaCODE',
} as const

/** Two-letter codes for Z0 beacon labels. Per IA Assessment Section 4. */
export const APP_SHORT_CODES: Readonly<Record<AppIdentifier, string>> = {
  'agent-builder': 'AB',
  'tarva-chat': 'CH',
  'project-room': 'PR',
  'tarva-core': 'CO',
  'tarva-erp': 'ER',
  'tarva-code': 'CD',
} as const

/** All known app identifiers as a readonly array. */
export const ALL_APP_IDS: readonly AppIdentifier[] = [
  'agent-builder',
  'tarva-chat',
  'project-room',
  'tarva-core',
  'tarva-erp',
  'tarva-code',
] as const

// ============================================================================
// Health & Telemetry
// ============================================================================

/**
 * Five-state health model per Gap #3 (Status Model).
 *
 * - OPERATIONAL: All checks passing. Green, pulsing.
 * - DEGRADED: Running with reduced capability. Amber, steady.
 * - DOWN: Previously operational, now unresponsive. Red, flashing.
 * - OFFLINE: Not running, expected. Dim/muted, no pulse.
 * - UNKNOWN: No telemetry connection ever established. Gray, dashed.
 */
export type HealthState = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'OFFLINE' | 'UNKNOWN'

/**
 * Status colors per Gap #3 and VISUAL-DESIGN-SPEC.md.
 * Maps to @tarva/ui status token variables.
 */
export const HEALTH_COLORS: Readonly<Record<HealthState, string>> = {
  OPERATIONAL: 'var(--status-success)',
  DEGRADED: 'var(--status-warning)',
  DOWN: 'var(--status-danger)',
  OFFLINE: 'var(--status-neutral)',
  UNKNOWN: 'var(--status-neutral)',
} as const

// ============================================================================
// Spatial Navigation
// ============================================================================

/**
 * Semantic zoom levels per AD-2.
 *
 * - Z0 Constellation: zoom < 0.27. Districts as luminous beacons.
 * - Z1 Launch Atrium: zoom 0.30-0.79. Capsules with status strips.
 * - Z2 District: zoom 0.80-1.49. Selected app with 3-5 stations.
 * - Z3 Station: zoom >= 1.50. Tight functional panels.
 */
export type SemanticLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'

/** Camera position in world coordinates. */
export interface CameraPosition {
  /** Horizontal offset in world pixels. 0 = center. */
  readonly offsetX: number
  /** Vertical offset in world pixels. 0 = center. */
  readonly offsetY: number
  /** Zoom factor. 0.08 (far Z0) to 3.0 (close Z3). Default landing: 0.50. */
  readonly zoom: number
}

/**
 * Spatial location context. Captures WHERE in the Launch an event originated.
 * Stored in receipts and used for receipt rehydration (viewport restore).
 */
export interface SpatialLocation {
  readonly semanticLevel: SemanticLevel
  readonly district: AppIdentifier | null
  readonly station: string | null
}

// ============================================================================
// Spine Object Model (Gap #2)
// ============================================================================

/**
 * Activity types per Gap #2 (Spine Object Model).
 * "Activity" is the Launch-level supertype that resolves the "Run" collision.
 *
 * At Z0-Z1: "12 activities". At Z2-Z3: "3 generation runs" (Builder).
 */
export type ActivityType =
  | 'generation_run'
  | 'agent_execution'
  | 'conversation'
  | 'reasoning_session'

/** Universal activity statuses across all app types. */
export type ActivityStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'

// ============================================================================
// Receipt Classification (IA Assessment Section 5)
// ============================================================================

/** Receipt event types. Used for Evidence Ledger faceted filtering. */
export type EventType = 'navigation' | 'action' | 'error' | 'approval' | 'system'

/** Severity levels. Used for Evidence Ledger faceted filtering. */
export type Severity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Receipt source. 'launch' for events generated by the Launch itself.
 * App identifiers for events observed from external apps.
 */
export type ReceiptSource = 'launch' | AppIdentifier

/** Actor type for receipt attribution. */
export type Actor = 'human' | 'ai' | 'system'

// ============================================================================
// Utility Types
// ============================================================================

/** Unsubscribe function returned by subscribe() methods. */
export type Unsubscribe = () => void

/** ISO 8601 timestamp string with milliseconds. */
export type ISOTimestamp = string
```

### 4.2 CameraController -- `src/lib/interfaces/camera-controller.ts`

The spatial navigation contract. Phase 1 delivers manual navigation. Phase 3 plugs in the AI Camera Director that interprets natural language into `CameraDirective` objects.

```ts
/**
 * CameraController -- Spatial navigation API.
 *
 * Phase 1: Manual navigation (pan, zoom, flyTo, resetToLaunch).
 * Phase 3: AI Camera Director interprets NL commands into CameraDirectives.
 *
 * The CameraController is the ONLY write path to camera state.
 * All consumers (ZUI engine, minimap, breadcrumb, AI) go through this interface.
 *
 * References: AD-1 (Camera State Management), AD-7 interface #1
 */

import type { AppIdentifier, CameraPosition, SemanticLevel, Unsubscribe } from './types'

// ============================================================================
// Camera Target (where to navigate)
// ============================================================================

/**
 * Discriminated union for navigation targets.
 * Used by CameraDirective and flyTo().
 */
export type CameraTarget =
  | { readonly type: 'position'; readonly position: CameraPosition }
  | { readonly type: 'district'; readonly districtId: AppIdentifier }
  | { readonly type: 'station'; readonly districtId: AppIdentifier; readonly stationId: string }
  | { readonly type: 'home' }
  | { readonly type: 'constellation' }

// ============================================================================
// Camera Directive (the AI output format)
// ============================================================================

/**
 * A complete camera navigation instruction.
 *
 * In Phase 1, directives are created by manual interactions (capsule click,
 * command palette "go core", return-to-hub hotkey).
 *
 * In Phase 3, the AI Camera Director produces directives from natural language:
 * "Show me what's broken" -> { target: { type: 'district', districtId: 'project-room' },
 *   highlights: ['project-room'], narration: 'Project Room has 2 active alerts...' }
 */
export interface CameraDirective {
  /** Where to navigate. */
  readonly target: CameraTarget
  /** App capsules to visually highlight during/after navigation. */
  readonly highlights?: readonly AppIdentifier[]
  /** App capsules to visually dim during/after navigation. */
  readonly fades?: readonly AppIdentifier[]
  /** AI-generated explanation of why this navigation was chosen. */
  readonly narration?: string
  /** Who initiated this directive. */
  readonly source: 'manual' | 'ai' | 'command-palette'
}

// ============================================================================
// FlyTo Options
// ============================================================================

/** Configuration for animated camera transitions. */
export interface FlyToOptions {
  /** Spring stiffness. Higher = snappier. Default: 170. */
  readonly stiffness?: number
  /** Spring damping. Higher = less oscillation. Default: 26. */
  readonly damping?: number
  /** Animation duration cap in ms. Default: 800. */
  readonly maxDuration?: number
  /** If true, generate a receipt for this navigation. Default: true. */
  readonly recordReceipt?: boolean
}

// ============================================================================
// Camera State Listener
// ============================================================================

/** Payload delivered to camera subscribers on every state change. */
export interface CameraSnapshot {
  readonly position: CameraPosition
  readonly semanticLevel: SemanticLevel
  /** True during active pan, zoom, or flyTo animation. */
  readonly isAnimating: boolean
}

// ============================================================================
// CameraController Interface
// ============================================================================

/**
 * The CameraController owns all camera mutations.
 *
 * Implementation hierarchy:
 * - navigate() is the universal entry point (accepts CameraDirective).
 * - panBy(), zoomTo(), flyTo(), resetToLaunch() are convenience methods
 *   that internally create directives and call navigate().
 * - subscribe() enables 60fps consumers (SpatialCanvas) to read state
 *   without React re-renders.
 */
export interface CameraController {
  /**
   * Execute a camera directive. This is the primary method that both
   * manual interactions and AI Camera Director use.
   *
   * The directive may include highlights, fades, and narration.
   * The controller is responsible for:
   * 1. Resolving the target to world coordinates
   * 2. Animating the camera to the target
   * 3. Applying highlight/fade effects
   * 4. Recording a receipt (if not suppressed)
   */
  navigate(directive: CameraDirective): Promise<void>

  /**
   * Translate the camera by (dx, dy) in world pixels.
   * Used during pointer-drag panning. No animation, no receipt.
   */
  panBy(dx: number, dy: number): void

  /**
   * Set the zoom level, optionally zooming toward a cursor position.
   * The cursor point in world coordinates stays fixed under the pointer.
   *
   * @param zoom - Target zoom level (clamped to 0.08-3.0)
   * @param cursorWorldX - World X coordinate under the cursor (optional)
   * @param cursorWorldY - World Y coordinate under the cursor (optional)
   */
  zoomTo(zoom: number, cursorWorldX?: number, cursorWorldY?: number): void

  /**
   * Animate the camera to a target with spring physics.
   * Returns a Promise that resolves when the animation completes.
   */
  flyTo(target: CameraTarget, options?: FlyToOptions): Promise<void>

  /**
   * Return to Z1 Launch Atrium at center (0, 0) zoom 0.50.
   * Equivalent to flyTo({ type: 'home' }).
   */
  resetToLaunch(): Promise<void>

  /** Read the current camera position (snapshot, not reactive). */
  getPosition(): CameraPosition

  /** Read the current semantic zoom level. */
  getSemanticLevel(): SemanticLevel

  /** Read the full camera snapshot including animation state. */
  getSnapshot(): CameraSnapshot

  /**
   * Subscribe to camera state changes. The listener is called on every
   * frame during animation and on every manual pan/zoom.
   *
   * For 60fps consumers (SpatialCanvas), use this instead of React state.
   */
  subscribe(listener: (snapshot: CameraSnapshot) => void): Unsubscribe
}

// ============================================================================
// Phase 1 Implementation: ManualCameraController
// ============================================================================

/**
 * Phase 1 CameraController. Delegates to the camera Zustand store.
 *
 * - navigate() resolves targets to positions using a static district layout map
 * - panBy(), zoomTo() write directly to the store
 * - flyTo() uses requestAnimationFrame with spring physics
 * - No AI integration (directives with narration are accepted but narration is ignored)
 *
 * Phase 3 replacement: AICameraController wraps this and adds
 * NL -> CameraDirective translation via AIRouter.
 */
export class ManualCameraController implements CameraController {
  private listeners: Set<(snapshot: CameraSnapshot) => void> = new Set()
  private animating = false
  private position: CameraPosition = { offsetX: 0, offsetY: 0, zoom: 0.5 }
  private semanticLevel: SemanticLevel = 'Z1'

  /**
   * District center positions in world coordinates.
   * Phase 1 uses static layout. Phase 2+ may compute dynamically.
   */
  private static readonly DISTRICT_POSITIONS: Readonly<Record<string, CameraPosition>> = {
    home: { offsetX: 0, offsetY: 0, zoom: 0.5 },
    constellation: { offsetX: 0, offsetY: 0, zoom: 0.2 },
    'agent-builder': { offsetX: -260, offsetY: 150, zoom: 1.0 },
    'tarva-chat': { offsetX: 260, offsetY: 150, zoom: 1.0 },
    'project-room': { offsetX: 0, offsetY: 300, zoom: 1.0 },
    'tarva-core': { offsetX: 260, offsetY: -150, zoom: 1.0 },
    'tarva-erp': { offsetX: -260, offsetY: -150, zoom: 1.0 },
    'tarva-code': { offsetX: 0, offsetY: -300, zoom: 1.0 },
  }

  async navigate(directive: CameraDirective): Promise<void> {
    const target = this.resolveTarget(directive.target)
    await this.animateToPosition(target)
    // Phase 1: highlights, fades, and narration are accepted but not acted upon.
    // Phase 3 will wire these to visual effects and UI overlays.
  }

  panBy(dx: number, dy: number): void {
    this.position = {
      offsetX: this.position.offsetX + dx,
      offsetY: this.position.offsetY + dy,
      zoom: this.position.zoom,
    }
    this.updateSemanticLevel()
    this.notifyListeners()
  }

  zoomTo(zoom: number, cursorWorldX?: number, cursorWorldY?: number): void {
    const clampedZoom = Math.max(0.08, Math.min(3.0, zoom))

    if (cursorWorldX !== undefined && cursorWorldY !== undefined) {
      // Zoom-to-cursor: keep the world point under the cursor fixed.
      const scale = clampedZoom / this.position.zoom
      this.position = {
        offsetX: cursorWorldX - (cursorWorldX - this.position.offsetX) * scale,
        offsetY: cursorWorldY - (cursorWorldY - this.position.offsetY) * scale,
        zoom: clampedZoom,
      }
    } else {
      this.position = { ...this.position, zoom: clampedZoom }
    }

    this.updateSemanticLevel()
    this.notifyListeners()
  }

  async flyTo(target: CameraTarget, options?: FlyToOptions): Promise<void> {
    const dest = this.resolveTarget(target)
    await this.animateToPosition(dest, options)
  }

  async resetToLaunch(): Promise<void> {
    await this.flyTo({ type: 'home' })
  }

  getPosition(): CameraPosition {
    return { ...this.position }
  }

  getSemanticLevel(): SemanticLevel {
    return this.semanticLevel
  }

  getSnapshot(): CameraSnapshot {
    return {
      position: { ...this.position },
      semanticLevel: this.semanticLevel,
      isAnimating: this.animating,
    }
  }

  subscribe(listener: (snapshot: CameraSnapshot) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private resolveTarget(target: CameraTarget): CameraPosition {
    switch (target.type) {
      case 'position':
        return target.position
      case 'district':
        return (
          ManualCameraController.DISTRICT_POSITIONS[target.districtId] ??
          ManualCameraController.DISTRICT_POSITIONS.home
        )
      case 'station':
        // Phase 1: navigate to district center. Phase 2 refines to station offset.
        return (
          ManualCameraController.DISTRICT_POSITIONS[target.districtId] ??
          ManualCameraController.DISTRICT_POSITIONS.home
        )
      case 'home':
        return ManualCameraController.DISTRICT_POSITIONS.home
      case 'constellation':
        return ManualCameraController.DISTRICT_POSITIONS.constellation
    }
  }

  /**
   * Animate to a target position using a simple spring model.
   * Phase 1 uses linear interpolation. Phase 3 replaces with proper spring physics.
   */
  private animateToPosition(dest: CameraPosition, options?: FlyToOptions): Promise<void> {
    const maxDuration = options?.maxDuration ?? 800
    const start = { ...this.position }
    const startTime = performance.now()

    this.animating = true

    return new Promise<void>((resolve) => {
      const step = (now: number) => {
        const elapsed = now - startTime
        const t = Math.min(1, elapsed / maxDuration)
        // Ease-out cubic for smooth deceleration.
        const eased = 1 - Math.pow(1 - t, 3)

        this.position = {
          offsetX: start.offsetX + (dest.offsetX - start.offsetX) * eased,
          offsetY: start.offsetY + (dest.offsetY - start.offsetY) * eased,
          zoom: start.zoom + (dest.zoom - start.zoom) * eased,
        }

        this.updateSemanticLevel()
        this.notifyListeners()

        if (t < 1) {
          requestAnimationFrame(step)
        } else {
          this.animating = false
          this.notifyListeners()
          resolve()
        }
      }

      requestAnimationFrame(step)
    })
  }

  /**
   * Derive semantic level from zoom with hysteresis per AD-2.
   * Thresholds use the "enter at" values for simplicity in Phase 1.
   * Phase 3 adds full hysteresis with separate enter/exit thresholds.
   */
  private updateSemanticLevel(): void {
    const z = this.position.zoom
    if (z < 0.27) this.semanticLevel = 'Z0'
    else if (z < 0.8) this.semanticLevel = 'Z1'
    else if (z < 1.5) this.semanticLevel = 'Z2'
    else this.semanticLevel = 'Z3'
  }

  private notifyListeners(): void {
    const snapshot = this.getSnapshot()
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }
}
```

### 4.3 SystemStateProvider -- `src/lib/interfaces/system-state-provider.ts`

The telemetry data contract. Phase 1 reads from the `districts.store` populated by TanStack Query polling (WS-1.5). Phase 3 adds AI context assembly.

```ts
/**
 * SystemStateProvider -- Telemetry data API.
 *
 * Phase 1: Polling via TanStack Query + districts.store (WS-1.5).
 * Phase 3: AI context provider (AIRouter reads system state for decisions).
 *
 * This interface is READ-ONLY. Consumers query the current state and
 * subscribe to changes. The polling mechanism (TanStack Query) is
 * the responsibility of WS-1.5; this interface abstracts over it.
 *
 * References: AD-5 (Telemetry Polling), AD-7 interface #2,
 * Gap #3 (Status Model), IA Assessment Sections 1-3
 */

import type { AppIdentifier, HealthState, ISOTimestamp, Unsubscribe } from './types'

// ============================================================================
// Dependency Status
// ============================================================================

/**
 * Health status of a single dependency (database, API, service).
 * Displayed in the Status station (Z3) per IA Assessment Section 1.
 */
export interface DependencyStatus {
  /** Dependency name (e.g., "Supabase", "Ollama", "Claude API"). */
  readonly name: string
  /** Current health state. */
  readonly status: HealthState
  /** Response latency in ms. Null if unreachable. */
  readonly latencyMs: number | null
  /** Error message if not healthy. */
  readonly error: string | null
}

// ============================================================================
// App State
// ============================================================================

/**
 * Complete telemetry state for a single Tarva application.
 *
 * The 5 universal capsule fields (Health, Pulse, Last Event, Alerts,
 * Freshness) from IA Assessment Section 1 map directly to properties here.
 */
export interface AppState {
  /** Canonical app identifier. */
  readonly id: AppIdentifier
  /** Human-readable display name (e.g., "Agent Builder"). */
  readonly displayName: string

  // --- Universal capsule fields (IA Assessment Z1) ---

  /** Current operational health state (5-state model). */
  readonly health: HealthState
  /**
   * Primary activity metric as a human-readable string.
   * Examples: "3 runs active", "8 conversations", "-- idle"
   */
  readonly pulse: string
  /**
   * Most recent significant event description.
   * Null if no events have been observed.
   */
  readonly lastEvent: string | null
  /** ISO 8601 timestamp of the last event. Null if none. */
  readonly lastEventAt: ISOTimestamp | null
  /** Count of active alerts/warnings. Red badge if > 0. */
  readonly alertCount: number
  /**
   * Milliseconds since last meaningful activity.
   * Null if no activity has ever been observed.
   * Amber threshold: > 3600000 (1h). Red threshold: > 86400000 (24h).
   */
  readonly freshnessMs: number | null

  // --- Extended telemetry ---

  /** Per-dependency health statuses (shown in Status station at Z3). */
  readonly dependencies: readonly DependencyStatus[]
  /**
   * Contact history for OFFLINE vs DOWN determination (Gap #3).
   * If firstContact is null, the Launch has never reached this app.
   */
  readonly contactHistory: {
    readonly firstContact: ISOTimestamp | null
    readonly lastContact: ISOTimestamp | null
  }
  /** App-specific payload. Opaque to the Launch; rendered by station templates. */
  readonly raw: Record<string, unknown>
}

// ============================================================================
// Global Metrics (Z0 Constellation View)
// ============================================================================

/**
 * Aggregate metrics for the Constellation (Z0) view.
 * Per IA Assessment Section 1: 3 global metrics for sub-2-second glanceability.
 */
export interface GlobalMetrics {
  /** Total active alerts across all apps. */
  readonly alertCount: number
  /** Total running activities across all apps. */
  readonly activeWork: number
  /**
   * Worst-of-all health state (system-level pulse).
   * If any app is DOWN, systemPulse is DOWN.
   * If any app is DEGRADED (and none DOWN), systemPulse is DEGRADED.
   * Otherwise OPERATIONAL.
   * OFFLINE and UNKNOWN apps do not degrade the system pulse.
   */
  readonly systemPulse: HealthState
}

// ============================================================================
// System Snapshot
// ============================================================================

/**
 * Complete system state at a point in time.
 *
 * This is the primary data structure that AI features consume in Phase 3.
 * The AI Camera Director, station template selector, and narrated telemetry
 * all receive a SystemSnapshot as context.
 */
export interface SystemSnapshot {
  /** Per-app telemetry state. Keyed by AppIdentifier. */
  readonly apps: Readonly<Record<AppIdentifier, AppState>>
  /** Aggregate metrics for Z0. */
  readonly globalMetrics: GlobalMetrics
  /** When this snapshot was assembled. */
  readonly timestamp: ISOTimestamp
}

// ============================================================================
// Adaptive Polling Configuration (AD-5)
// ============================================================================

/** Polling interval configuration per AD-5 (adaptive polling). */
export interface PollingConfig {
  /** Normal interval in ms. Default: 15000. */
  readonly normalIntervalMs: number
  /** Tightened interval when issues detected. Default: 5000. */
  readonly alertIntervalMs: number
  /** Relaxed interval when all stable for N cycles. Default: 30000. */
  readonly relaxedIntervalMs: number
  /** Number of stable cycles before relaxing. Default: 5. */
  readonly stableCyclesBeforeRelax: number
}

/** Default polling configuration per AD-5. */
export const DEFAULT_POLLING_CONFIG: Readonly<PollingConfig> = {
  normalIntervalMs: 15_000,
  alertIntervalMs: 5_000,
  relaxedIntervalMs: 30_000,
  stableCyclesBeforeRelax: 5,
} as const

// ============================================================================
// SystemStateProvider Interface
// ============================================================================

export interface SystemStateProvider {
  /**
   * Get the most recent system snapshot.
   * Returns null if no telemetry data has been fetched yet.
   */
  getSnapshot(): SystemSnapshot | null

  /**
   * Get the state of a single app by identifier.
   * Returns null if the app has no telemetry data.
   */
  getAppState(id: AppIdentifier): AppState | null

  /**
   * Get the current global metrics (Z0 aggregate).
   * Returns null if no telemetry data has been fetched yet.
   */
  getGlobalMetrics(): GlobalMetrics | null

  /**
   * Force an immediate telemetry refresh, bypassing the polling interval.
   * Returns the refreshed snapshot.
   */
  refresh(): Promise<SystemSnapshot>

  /**
   * Subscribe to system state changes.
   * The listener is called whenever a new telemetry poll completes.
   */
  subscribe(listener: (snapshot: SystemSnapshot) => void): Unsubscribe

  /** Get the current polling configuration. */
  getPollingConfig(): PollingConfig
}

// ============================================================================
// Phase 1 Implementation: PollingSystemStateProvider
// ============================================================================

/**
 * Phase 1 SystemStateProvider. Wraps a data source (districts.store or
 * direct fetch) and exposes the SystemStateProvider contract.
 *
 * In Phase 1:
 * - getSnapshot() assembles a snapshot from the current districts store state
 * - subscribe() bridges to the districts store subscription
 * - refresh() triggers a manual fetch to the /api/telemetry endpoint
 *
 * Phase 3 replacement: AIContextSystemStateProvider decorates this with
 * AI-computed enrichments (narrations, trend analysis, anomaly scoring).
 */
export class PollingSystemStateProvider implements SystemStateProvider {
  private listeners: Set<(snapshot: SystemSnapshot) => void> = new Set()
  private currentSnapshot: SystemSnapshot | null = null
  private pollingConfig: PollingConfig = { ...DEFAULT_POLLING_CONFIG }

  /**
   * Update the internal snapshot. Called by the TanStack Query onSuccess
   * callback in WS-1.5 when new telemetry data arrives.
   */
  updateSnapshot(snapshot: SystemSnapshot): void {
    this.currentSnapshot = snapshot
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  getSnapshot(): SystemSnapshot | null {
    return this.currentSnapshot
  }

  getAppState(id: AppIdentifier): AppState | null {
    return this.currentSnapshot?.apps[id] ?? null
  }

  getGlobalMetrics(): GlobalMetrics | null {
    return this.currentSnapshot?.globalMetrics ?? null
  }

  async refresh(): Promise<SystemSnapshot> {
    // Phase 1: fetch from the telemetry Route Handler.
    // WS-1.5 will wire this to the actual endpoint.
    const response = await fetch('/api/telemetry')
    const data = (await response.json()) as SystemSnapshot
    this.updateSnapshot(data)
    return data
  }

  subscribe(listener: (snapshot: SystemSnapshot) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getPollingConfig(): PollingConfig {
    return { ...this.pollingConfig }
  }

  /** Allow WS-1.5 to adjust polling based on system health (AD-5 adaptive). */
  setPollingConfig(config: Partial<PollingConfig>): void {
    this.pollingConfig = { ...this.pollingConfig, ...config }
  }
}
```

### 4.4 ReceiptStore -- `src/lib/interfaces/receipt-store.ts`

The audit log contract. Phase 1 provides an in-memory store. Phase 3 (WS-3.1) replaces with Supabase persistence.

```ts
/**
 * ReceiptStore -- Audit log API.
 *
 * Phase 1: InMemoryReceiptStore (human actions only).
 * Phase 3: SupabaseReceiptStore (persisted, AI actions with rationale).
 *
 * The receipt schema is the 12-field design from the AIA assessment
 * extended with AI rationale fields per AD-6. Only meaningful actions
 * generate receipts. Expected volume: 5-15 per session.
 *
 * References: AD-6 (Receipt System), AD-7 interface #3,
 * IA Assessment Section 5 (Evidence Ledger Structure)
 */

import type {
  Actor,
  AppIdentifier,
  EventType,
  ISOTimestamp,
  ReceiptSource,
  Severity,
  SpatialLocation,
  Unsubscribe,
} from './types'

// ============================================================================
// AI Receipt Metadata
// ============================================================================

/**
 * Additional fields for AI-initiated actions.
 * Null for human-initiated receipts. Populated in Phase 3.
 *
 * Per AD-6: "AI receipts include additional fields: prompt, reasoning,
 * confidence, alternatives considered, provider, latency."
 */
export interface AIReceiptMetadata {
  /** The prompt or input that triggered the AI action. */
  readonly prompt: string
  /** AI's reasoning for the action taken. */
  readonly reasoning: string
  /** Confidence score from 0.0 (no confidence) to 1.0 (certain). */
  readonly confidence: number
  /** Other options the AI considered but did not select. */
  readonly alternativesConsidered: readonly string[]
  /** Which AI provider executed this action. */
  readonly provider: 'ollama' | 'claude' | 'rule-engine' | 'pattern-matcher'
  /** End-to-end AI response time in milliseconds. */
  readonly latencyMs: number
  /** Model identifier (e.g., "llama3.2", "claude-sonnet-4-20250514"). Null for non-LLM providers. */
  readonly modelId: string | null
}

// ============================================================================
// Launch Receipt (12-field schema + AI extension)
// ============================================================================

/**
 * Immutable record of a meaningful Launch event.
 *
 * Per IA Assessment Section 5:
 * - id: UUID v7 (time-sortable)
 * - correlationId: links related events across Launch + apps
 * - source: which app/Launch generated the event
 * - eventType: classification for faceted filtering
 * - severity: urgency level
 * - summary: human-readable, max 120 chars
 * - detail: structured payload, app-specific
 * - location: spatial context (zoom level, district, station)
 * - timestamp: ISO 8601 with milliseconds
 * - durationMs: for events with duration
 * - actor: human/ai/system attribution
 * - aiMetadata: AI rationale (null for human actions)
 */
export interface LaunchReceipt {
  /** UUID v7 (time-sortable). Generated by the store. */
  readonly id: string
  /** Links related events across Launch + apps. Null for uncorrelated events. */
  readonly correlationId: string | null
  /** Which app or 'launch' generated this event. */
  readonly source: ReceiptSource
  /** Event classification for Evidence Ledger filtering. */
  readonly eventType: EventType
  /** Urgency level. */
  readonly severity: Severity
  /** Human-readable summary, max 120 characters. */
  readonly summary: string
  /** Structured detail payload. App-specific. Rendered as collapsible raw data. */
  readonly detail: Record<string, unknown> | null
  /** Where in the Launch this event originated. */
  readonly location: SpatialLocation
  /** ISO 8601 with milliseconds. */
  readonly timestamp: ISOTimestamp
  /** Duration for events that span time. Null for instantaneous events. */
  readonly durationMs: number | null
  /** Who initiated this event. */
  readonly actor: Actor
  /** AI rationale fields. Null for human/system-initiated events. */
  readonly aiMetadata: AIReceiptMetadata | null
}

// ============================================================================
// Receipt Input (what consumers provide to record())
// ============================================================================

/**
 * Input for creating a new receipt. The store generates `id` and `timestamp`.
 */
export interface ReceiptInput {
  readonly correlationId?: string | null
  readonly source: ReceiptSource
  readonly eventType: EventType
  readonly severity: Severity
  readonly summary: string
  readonly detail?: Record<string, unknown> | null
  readonly location: SpatialLocation
  readonly durationMs?: number | null
  readonly actor: Actor
  readonly aiMetadata?: AIReceiptMetadata | null
}

// ============================================================================
// Receipt Filters (for Evidence Ledger queries)
// ============================================================================

/**
 * Filter criteria for receipt queries.
 * Maps directly to the 4 Evidence Ledger facets from IA Assessment Section 5.
 */
export interface ReceiptFilters {
  /** Filter by source app(s). Empty = all sources. */
  readonly sources?: readonly ReceiptSource[]
  /** Filter by event type(s). Empty = all types. */
  readonly eventTypes?: readonly EventType[]
  /** Filter by severity level(s). Empty = all severities. */
  readonly severities?: readonly Severity[]
  /** Filter by time range. */
  readonly timeRange?: {
    readonly start: ISOTimestamp
    readonly end: ISOTimestamp
  }
  /** Filter by actor type. */
  readonly actor?: Actor
  /** Filter by district. */
  readonly district?: AppIdentifier
  /** Full-text search across summaries. */
  readonly search?: string
  /** Maximum number of results. Default: 100. */
  readonly limit?: number
  /** Offset for pagination. Default: 0. */
  readonly offset?: number
}

// ============================================================================
// ReceiptStore Interface
// ============================================================================

export interface ReceiptStore {
  /**
   * Record a new receipt. The store generates the `id` (UUID v7) and
   * `timestamp` (current time). Returns the complete receipt.
   */
  record(input: ReceiptInput): Promise<LaunchReceipt>

  /**
   * Query receipts with filtering and pagination.
   * Results are ordered by timestamp descending (newest first).
   */
  query(filters?: ReceiptFilters): Promise<LaunchReceipt[]>

  /** Get a single receipt by ID. Returns null if not found. */
  getById(id: string): Promise<LaunchReceipt | null>

  /**
   * Get all receipts sharing a correlation ID.
   * Used to display causal chains in the Evidence Ledger.
   */
  getByCorrelation(correlationId: string): Promise<LaunchReceipt[]>

  /** Get the total count of receipts matching the given filters. */
  count(filters?: ReceiptFilters): Promise<number>

  /**
   * Subscribe to new receipts as they are recorded.
   * The listener is called with each new receipt immediately after storage.
   */
  subscribe(listener: (receipt: LaunchReceipt) => void): Unsubscribe
}

// ============================================================================
// Phase 1 Implementation: InMemoryReceiptStore
// ============================================================================

/**
 * Phase 1 ReceiptStore. Holds receipts in an in-memory array.
 *
 * Limitations:
 * - Receipts are lost on page refresh (no persistence)
 * - No full-text search (search filter does basic string.includes())
 * - No UUID v7 (uses crypto.randomUUID() which is v4)
 *
 * Phase 3 replacement: SupabaseReceiptStore (WS-3.1) persists to the
 * `launch_receipts` table with proper UUID v7 and full-text search.
 */
export class InMemoryReceiptStore implements ReceiptStore {
  private receipts: LaunchReceipt[] = []
  private listeners: Set<(receipt: LaunchReceipt) => void> = new Set()

  async record(input: ReceiptInput): Promise<LaunchReceipt> {
    const receipt: LaunchReceipt = {
      id: crypto.randomUUID(),
      correlationId: input.correlationId ?? null,
      source: input.source,
      eventType: input.eventType,
      severity: input.severity,
      summary: input.summary.slice(0, 120),
      detail: input.detail ?? null,
      location: input.location,
      timestamp: new Date().toISOString(),
      durationMs: input.durationMs ?? null,
      actor: input.actor,
      aiMetadata: input.aiMetadata ?? null,
    }

    this.receipts.unshift(receipt) // newest first

    for (const listener of this.listeners) {
      listener(receipt)
    }

    return receipt
  }

  async query(filters?: ReceiptFilters): Promise<LaunchReceipt[]> {
    let results = [...this.receipts]

    if (filters) {
      if (filters.sources && filters.sources.length > 0) {
        const sources = new Set(filters.sources)
        results = results.filter((r) => sources.has(r.source))
      }
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        const types = new Set(filters.eventTypes)
        results = results.filter((r) => types.has(r.eventType))
      }
      if (filters.severities && filters.severities.length > 0) {
        const sevs = new Set(filters.severities)
        results = results.filter((r) => sevs.has(r.severity))
      }
      if (filters.timeRange) {
        const start = new Date(filters.timeRange.start).getTime()
        const end = new Date(filters.timeRange.end).getTime()
        results = results.filter((r) => {
          const t = new Date(r.timestamp).getTime()
          return t >= start && t <= end
        })
      }
      if (filters.actor) {
        results = results.filter((r) => r.actor === filters.actor)
      }
      if (filters.district) {
        results = results.filter((r) => r.location.district === filters.district)
      }
      if (filters.search) {
        const lower = filters.search.toLowerCase()
        results = results.filter((r) => r.summary.toLowerCase().includes(lower))
      }

      const offset = filters.offset ?? 0
      const limit = filters.limit ?? 100
      results = results.slice(offset, offset + limit)
    }

    return results
  }

  async getById(id: string): Promise<LaunchReceipt | null> {
    return this.receipts.find((r) => r.id === id) ?? null
  }

  async getByCorrelation(correlationId: string): Promise<LaunchReceipt[]> {
    return this.receipts.filter((r) => r.correlationId === correlationId)
  }

  async count(filters?: ReceiptFilters): Promise<number> {
    if (!filters) return this.receipts.length
    const results = await this.query({ ...filters, limit: undefined, offset: undefined })
    return results.length
  }

  subscribe(listener: (receipt: LaunchReceipt) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}
```

### 4.5 StationTemplateRegistry -- `src/lib/interfaces/station-template-registry.ts`

The station catalog contract. Phase 1 provides static station definitions per AD-8. Phase 3 adds dynamic selection via rule engine and AI tie-breaking.

```ts
/**
 * StationTemplateRegistry -- Station catalog API.
 *
 * Phase 1: StaticStationTemplateRegistry with hardcoded stations per AD-8.
 * Phase 3: DynamicStationTemplateRegistry with rule-based scoring + AI tie-breaking.
 *
 * Station templates define WHAT a station displays and WHICH actions it offers.
 * They do NOT contain React components -- the rendering is handled by station
 * component implementations in WS-2.x that consume these templates as configuration.
 *
 * References: AD-7 interface #4, AD-8 (Station Content per District),
 * IA Assessment Sections 1-2 (Station Panel Framework)
 */

import type { AppIdentifier } from './types'
import type { SystemSnapshot } from './system-state-provider'

// ============================================================================
// Station Action
// ============================================================================

/** An action button rendered in a station's footer zone. */
export interface StationAction {
  /** Unique action identifier within the station. */
  readonly id: string
  /** Button label text. */
  readonly label: string
  /** Visual variant per @tarva/ui Button component. */
  readonly variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  /**
   * Command string to execute via CommandPalette when clicked.
   * Example: "open agent-builder", "refresh health-checks"
   */
  readonly command: string
  /** Optional icon name from Lucide. */
  readonly icon?: string
}

// ============================================================================
// Station Layout
// ============================================================================

/**
 * Describes the 3-zone layout of a station panel.
 * Per IA Assessment Z3: Header / Body / Actions.
 */
export interface StationLayout {
  /** Header zone: station title and parent context. */
  readonly header: {
    /** Station title displayed in the header. */
    readonly title: string
    /** Optional Lucide icon name. */
    readonly icon?: string
  }
  /**
   * Body zone content type. Determines which React component renders the body.
   * 'table': data table with columns (runs, artifacts, conversations)
   * 'list': vertical list of items (dependencies, alerts, errors)
   * 'metrics': key-value metric display (status dashboard)
   * 'launch': app launch panel (URL, version, launch button)
   * 'custom': custom component (for app-specific rendering)
   */
  readonly bodyType: 'table' | 'list' | 'metrics' | 'launch' | 'custom'
  /** Action buttons in the footer zone. 1-3 buttons. */
  readonly actions: readonly StationAction[]
}

// ============================================================================
// Trigger Condition (Phase 3: Dynamic Selection)
// ============================================================================

/**
 * A condition evaluated against the SystemSnapshot to determine
 * whether a station template should be activated.
 *
 * Phase 1: Triggers are defined but not evaluated (static selection).
 * Phase 3: Rule engine evaluates triggers; AI breaks ties.
 */
export interface TriggerCondition {
  /**
   * Dot-path into SystemSnapshot.
   * Examples:
   * - "apps.agent-builder.alertCount"
   * - "apps.project-room.health"
   * - "globalMetrics.activeWork"
   */
  readonly field: string
  /** Comparison operator. */
  readonly operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists'
  /** Value to compare against. Type must match the field's runtime type. */
  readonly value: unknown
  /** Weight contribution to the template's activation score. 0.0-1.0. */
  readonly weight: number
}

// ============================================================================
// Station Template
// ============================================================================

/**
 * A station template defines a station's identity, layout, and activation rules.
 *
 * Templates are configuration, not components. The rendering layer (WS-2.x)
 * reads templates and maps bodyType to the appropriate React component.
 */
export interface StationTemplate {
  /** Unique template identifier (e.g., "agent-builder--pipeline"). */
  readonly id: string
  /**
   * Which district this template belongs to.
   * '*' for universal templates that appear in every district.
   */
  readonly districtId: AppIdentifier | '*'
  /** Machine-readable station name (e.g., "pipeline", "status", "launch"). */
  readonly name: string
  /** Human-readable display name (e.g., "Pipeline", "Status", "Launch"). */
  readonly displayName: string
  /** Brief description for tooltips and the template browser. */
  readonly description: string
  /** Whether this is a universal station or app-specific. */
  readonly category: 'universal' | 'app-specific'
  /** The 3-zone layout definition. */
  readonly layout: StationLayout
  /**
   * Conditions for dynamic activation (Phase 3).
   * Empty array in Phase 1 (all templates are statically assigned).
   */
  readonly triggers: readonly TriggerCondition[]
  /**
   * Selection priority. Higher = selected first when multiple templates
   * compete for the same slot. Default: 0.
   */
  readonly priority: number
  /**
   * Whether this is a disposable (AI-generated) station.
   * Phase 1: always false. Phase 3: true for AI-selected templates.
   */
  readonly disposable: boolean
}

// ============================================================================
// StationTemplateRegistry Interface
// ============================================================================

export interface StationTemplateRegistry {
  /**
   * Get all station templates for a district, ordered by priority descending.
   *
   * In Phase 1: returns the static set (2 universal + N app-specific).
   * In Phase 3: evaluates triggers against context, returns scored/ranked set.
   *
   * @param districtId - The district to get templates for.
   * @param context - Optional SystemSnapshot for dynamic scoring (Phase 3).
   */
  getTemplatesForDistrict(
    districtId: AppIdentifier,
    context?: SystemSnapshot
  ): readonly StationTemplate[]

  /** Get a single template by its unique ID. */
  getTemplate(templateId: string): StationTemplate | null

  /** Get all registered templates across all districts. */
  getAllTemplates(): readonly StationTemplate[]

  /**
   * Register a new template. Used in Phase 3 for dynamic templates.
   * Phase 1 pre-populates all templates in the constructor.
   */
  registerTemplate(template: StationTemplate): void

  /**
   * Remove a template by ID. Used for disposable station cleanup.
   * Returns true if the template was found and removed.
   */
  removeTemplate(templateId: string): boolean

  /**
   * Evaluate trigger conditions against a SystemSnapshot and return a score.
   * Score is 0.0-1.0 where 1.0 means all conditions matched with full weight.
   *
   * Phase 1: returns 0 (no triggers evaluated).
   * Phase 3: rule engine computes weighted score.
   */
  evaluateTriggers(conditions: readonly TriggerCondition[], context: SystemSnapshot): number
}

// ============================================================================
// Phase 1 Implementation: StaticStationTemplateRegistry
// ============================================================================

/**
 * Phase 1 StationTemplateRegistry. Contains the complete station catalog
 * from AD-8, hardcoded.
 *
 * Station list per AD-8:
 * - Universal: Launch, Status (every district)
 * - Agent Builder: Pipeline, Library
 * - Tarva Chat: Conversations, Agents
 * - Project Room: Runs, Artifacts, Governance
 * - TarvaCORE: Sessions
 * - TarvaERP: Manufacturing (placeholder)
 * - tarvaCODE: (stub only -- universal stations)
 */
export class StaticStationTemplateRegistry implements StationTemplateRegistry {
  private templates: Map<string, StationTemplate> = new Map()

  constructor() {
    this.registerDefaults()
  }

  getTemplatesForDistrict(
    districtId: AppIdentifier,
    _context?: SystemSnapshot
  ): readonly StationTemplate[] {
    const results: StationTemplate[] = []

    for (const template of this.templates.values()) {
      if (template.districtId === '*' || template.districtId === districtId) {
        results.push(template)
      }
    }

    // Sort by priority descending, then by category (universal first).
    return results.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'universal' ? -1 : 1
      }
      return b.priority - a.priority
    })
  }

  getTemplate(templateId: string): StationTemplate | null {
    return this.templates.get(templateId) ?? null
  }

  getAllTemplates(): readonly StationTemplate[] {
    return Array.from(this.templates.values())
  }

  registerTemplate(template: StationTemplate): void {
    this.templates.set(template.id, template)
  }

  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  evaluateTriggers(_conditions: readonly TriggerCondition[], _context: SystemSnapshot): number {
    // Phase 1: no trigger evaluation. Always returns 0.
    return 0
  }

  // --------------------------------------------------------------------------
  // Default Station Templates (AD-8)
  // --------------------------------------------------------------------------

  private registerDefaults(): void {
    // --- Universal Stations ---

    this.registerTemplate({
      id: 'universal--launch',
      districtId: '*',
      name: 'launch',
      displayName: 'Launch',
      description: 'Open the application in a new browser tab.',
      category: 'universal',
      layout: {
        header: { title: 'Launch', icon: 'ExternalLink' },
        bodyType: 'launch',
        actions: [
          {
            id: 'open-app',
            label: 'Open App',
            variant: 'default',
            command: 'open ${districtId}',
            icon: 'ExternalLink',
          },
          {
            id: 'copy-url',
            label: 'Copy URL',
            variant: 'secondary',
            command: 'copy-url ${districtId}',
            icon: 'Copy',
          },
        ],
      },
      triggers: [],
      priority: 100,
      disposable: false,
    })

    this.registerTemplate({
      id: 'universal--status',
      districtId: '*',
      name: 'status',
      displayName: 'Status',
      description: 'Operational health dashboard with dependency status and recent errors.',
      category: 'universal',
      layout: {
        header: { title: 'Status', icon: 'Activity' },
        bodyType: 'metrics',
        actions: [
          {
            id: 'refresh',
            label: 'Refresh',
            variant: 'default',
            command: 'refresh health-checks',
            icon: 'RefreshCw',
          },
          {
            id: 'view-logs',
            label: 'View Full Logs',
            variant: 'secondary',
            command: 'open ${districtId}',
            icon: 'FileText',
          },
        ],
      },
      triggers: [],
      priority: 90,
      disposable: false,
    })

    // --- Agent Builder Stations ---

    this.registerTemplate({
      id: 'agent-builder--pipeline',
      districtId: 'agent-builder',
      name: 'pipeline',
      displayName: 'Pipeline',
      description: 'Active generation run progress and recent runs.',
      category: 'app-specific',
      layout: {
        header: { title: 'Pipeline', icon: 'GitBranch' },
        bodyType: 'table',
        actions: [
          {
            id: 'view-run',
            label: 'View Run Details',
            variant: 'default',
            command: 'show run ${runId}',
            icon: 'Eye',
          },
          {
            id: 'cancel-run',
            label: 'Cancel Run',
            variant: 'destructive',
            command: 'cancel run ${runId}',
            icon: 'XCircle',
          },
        ],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    this.registerTemplate({
      id: 'agent-builder--library',
      districtId: 'agent-builder',
      name: 'library',
      displayName: 'Library',
      description: 'Agent count, recent publishes, and skill maturity breakdown.',
      category: 'app-specific',
      layout: {
        header: { title: 'Library', icon: 'Library' },
        bodyType: 'list',
        actions: [
          {
            id: 'browse-library',
            label: 'Browse Library',
            variant: 'default',
            command: 'open agent-builder',
            icon: 'BookOpen',
          },
        ],
      },
      triggers: [],
      priority: 40,
      disposable: false,
    })

    // --- Tarva Chat Stations ---

    this.registerTemplate({
      id: 'tarva-chat--conversations',
      districtId: 'tarva-chat',
      name: 'conversations',
      displayName: 'Conversations',
      description: 'Active conversations sorted by last activity.',
      category: 'app-specific',
      layout: {
        header: { title: 'Conversations', icon: 'MessageSquare' },
        bodyType: 'table',
        actions: [
          {
            id: 'open-conversation',
            label: 'Open Conversation',
            variant: 'default',
            command: 'open tarva-chat',
            icon: 'ExternalLink',
          },
          {
            id: 'new-conversation',
            label: 'New Conversation',
            variant: 'secondary',
            command: 'open tarva-chat',
            icon: 'Plus',
          },
        ],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    this.registerTemplate({
      id: 'tarva-chat--agents',
      districtId: 'tarva-chat',
      name: 'agents',
      displayName: 'Agents',
      description: 'Loaded agent count and most-used agents.',
      category: 'app-specific',
      layout: {
        header: { title: 'Agents', icon: 'Bot' },
        bodyType: 'list',
        actions: [
          {
            id: 'browse-agents',
            label: 'Browse Agents',
            variant: 'default',
            command: 'open tarva-chat',
            icon: 'Users',
          },
        ],
      },
      triggers: [],
      priority: 40,
      disposable: false,
    })

    // --- Project Room Stations ---

    this.registerTemplate({
      id: 'project-room--runs',
      districtId: 'project-room',
      name: 'runs',
      displayName: 'Runs',
      description: 'Active executions, queue depth, and recent completions.',
      category: 'app-specific',
      layout: {
        header: { title: 'Runs', icon: 'Play' },
        bodyType: 'table',
        actions: [
          {
            id: 'view-run',
            label: 'View Run',
            variant: 'default',
            command: 'show run ${runId}',
            icon: 'Eye',
          },
          {
            id: 'cancel-run',
            label: 'Cancel Run',
            variant: 'destructive',
            command: 'cancel run ${runId}',
            icon: 'XCircle',
          },
          {
            id: 'open-project',
            label: 'Open Project',
            variant: 'secondary',
            command: 'open project-room',
            icon: 'ExternalLink',
          },
        ],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    this.registerTemplate({
      id: 'project-room--artifacts',
      districtId: 'project-room',
      name: 'artifacts',
      displayName: 'Artifacts',
      description: 'Recent artifacts and dependency graph health.',
      category: 'app-specific',
      layout: {
        header: { title: 'Artifacts', icon: 'Package' },
        bodyType: 'table',
        actions: [
          {
            id: 'browse-artifacts',
            label: 'Browse Artifacts',
            variant: 'default',
            command: 'open project-room',
            icon: 'FolderOpen',
          },
        ],
      },
      triggers: [],
      priority: 40,
      disposable: false,
    })

    this.registerTemplate({
      id: 'project-room--governance',
      districtId: 'project-room',
      name: 'governance',
      displayName: 'Governance',
      description: 'Pending approvals, phase gate status, and recent truth entries.',
      category: 'app-specific',
      layout: {
        header: { title: 'Governance', icon: 'Shield' },
        bodyType: 'list',
        actions: [
          {
            id: 'review-item',
            label: 'Review Item',
            variant: 'default',
            command: 'open project-room',
            icon: 'CheckCircle',
          },
          {
            id: 'open-project',
            label: 'Open Project',
            variant: 'secondary',
            command: 'open project-room',
            icon: 'ExternalLink',
          },
        ],
      },
      triggers: [],
      priority: 30,
      disposable: false,
    })

    // --- TarvaCORE Stations ---

    this.registerTemplate({
      id: 'tarva-core--sessions',
      districtId: 'tarva-core',
      name: 'sessions',
      displayName: 'Sessions',
      description: 'Recent reasoning sessions. Fallback: "No session telemetry available."',
      category: 'app-specific',
      layout: {
        header: { title: 'Sessions', icon: 'Brain' },
        bodyType: 'list',
        actions: [],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    // --- TarvaERP Stations ---

    this.registerTemplate({
      id: 'tarva-erp--manufacturing',
      districtId: 'tarva-erp',
      name: 'manufacturing',
      displayName: 'Manufacturing',
      description: 'Manufacturing dashboard placeholder.',
      category: 'app-specific',
      layout: {
        header: { title: 'Manufacturing', icon: 'Factory' },
        bodyType: 'metrics',
        actions: [],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    // Note: tarvaCODE has no app-specific stations (stub district).
    // It receives only the universal Launch and Status stations.
  }
}
```

### 4.6 AIRouter -- `src/lib/interfaces/ai-router.ts`

The AI provider routing contract. Phase 1 is a stub. Phase 3 implements the full routing table from tech-decisions.md.

```ts
/**
 * AIRouter -- Feature-based AI provider routing.
 *
 * Phase 1: StubAIRouter (all features return unavailable).
 * Phase 3: LiveAIRouter routes to Ollama, Claude, rule-engine, or pattern-matcher.
 *
 * The routing table from tech-decisions.md defines which provider handles
 * each feature, with a fallback chain. The AIRouter abstracts this so that
 * consumers call route({ feature: 'camera-director-nl', input: {...} })
 * without knowing which provider will handle it.
 *
 * Per AD-7: "The system works without AI. If AI breaks, telemetry and
 * spatial navigation still function."
 *
 * References: AD-7 (AI Integration Architecture),
 * tech-decisions.md (Feature-by-Feature AI Routing, Cost Control)
 */

import type { ISOTimestamp } from './types'
import type { SystemSnapshot } from './system-state-provider'

// ============================================================================
// AI Features
// ============================================================================

/**
 * All AI-powered features in Tarva Launch.
 * Each feature has a primary provider and optional fallback.
 * Per tech-decisions.md routing table.
 */
export type AIFeature =
  | 'camera-director-structured'
  | 'camera-director-nl'
  | 'station-template-selection'
  | 'narrated-telemetry-batch'
  | 'narrated-telemetry-deep'
  | 'exception-triage'
  | 'builder-mode'

// ============================================================================
// AI Providers
// ============================================================================

/**
 * Available AI providers, ordered by intelligence tier.
 * Per AD-7: pattern-matcher -> rule-engine -> Ollama -> Claude.
 */
export type AIProvider = 'pattern-matcher' | 'rule-engine' | 'ollama' | 'claude'

// ============================================================================
// AI Request / Response
// ============================================================================

/** Input to the AIRouter. Consumers provide the feature and input data. */
export interface AIRequest {
  /** Which feature to invoke. Determines provider selection. */
  readonly feature: AIFeature
  /**
   * Feature-specific input payload. The AIRouter passes this to the
   * selected provider. Shape depends on the feature.
   */
  readonly input: Record<string, unknown>
  /** Optional system state context. Providers may use this for richer responses. */
  readonly context?: SystemSnapshot
  /** Optional timeout in ms. Default: 10000 (10s). */
  readonly timeout?: number
}

/** Output from the AIRouter. Includes provider metadata for receipts. */
export interface AIResponse {
  /** Whether the request succeeded. */
  readonly success: boolean
  /** Which provider handled the request. */
  readonly provider: AIProvider
  /**
   * Feature-specific result payload. Shape depends on the feature.
   * For camera-director: CameraDirective
   * For narrated-telemetry: { narration: string }
   * For exception-triage: { classification: string, severity: string, recoveryTemplate: string }
   */
  readonly result: Record<string, unknown>
  /** End-to-end latency in milliseconds. */
  readonly latencyMs: number
  /** True if the primary provider failed and a fallback was used. */
  readonly fallbackUsed: boolean
  /** Error message if success is false. */
  readonly error?: string
  /** Model ID used (e.g., "llama3.2", "claude-sonnet-4-20250514"). Null for non-LLM providers. */
  readonly modelId?: string | null
}

// ============================================================================
// Routing Configuration
// ============================================================================

/**
 * A single routing rule mapping a feature to its provider chain.
 * Per tech-decisions.md Feature-by-Feature AI Routing table.
 */
export interface RoutingRule {
  /** Which feature this rule applies to. */
  readonly feature: AIFeature
  /** First-choice provider. */
  readonly primary: AIProvider
  /** Fallback provider if primary fails. Null = no fallback. */
  readonly fallback: AIProvider | null
  /** Why this routing was chosen (documentation only). */
  readonly rationale: string
}

/** The complete routing table from tech-decisions.md. */
export const AI_ROUTING_TABLE: readonly RoutingRule[] = [
  {
    feature: 'camera-director-structured',
    primary: 'pattern-matcher',
    fallback: null,
    rationale: '"go core", "home", "zoom out" need no LLM.',
  },
  {
    feature: 'camera-director-nl',
    primary: 'ollama',
    fallback: 'claude',
    rationale:
      'Spatial reasoning tractable for small models; camera drifts speculatively during latency.',
  },
  {
    feature: 'station-template-selection',
    primary: 'rule-engine',
    fallback: 'ollama',
    rationale: 'Deterministic scoring preferred; LLM only breaks ties.',
  },
  {
    feature: 'narrated-telemetry-batch',
    primary: 'ollama',
    fallback: 'claude',
    rationale: 'Background generation on 30s cadence; cached; no user-facing latency.',
  },
  {
    feature: 'narrated-telemetry-deep',
    primary: 'claude',
    fallback: 'ollama',
    rationale: 'User explicitly requests explanation; quality matters.',
  },
  {
    feature: 'exception-triage',
    primary: 'ollama',
    fallback: 'rule-engine',
    rationale: 'Classification within small-model capability.',
  },
  {
    feature: 'builder-mode',
    primary: 'claude',
    fallback: null,
    rationale: 'Novel station layouts from NL requires strong reasoning.',
  },
] as const

// ============================================================================
// Provider Status
// ============================================================================

/** Health status of a single AI provider. */
export interface ProviderStatus {
  /** Which provider. */
  readonly provider: AIProvider
  /** Whether the provider is currently reachable and ready. */
  readonly available: boolean
  /** When the last health check was performed. */
  readonly lastCheck: ISOTimestamp | null
  /** Error details if unavailable. */
  readonly error: string | null
}

// ============================================================================
// Cost Tracking (per tech-decisions.md Cost Control)
// ============================================================================

/** Per-session AI cost tracking. Displayed in settings panel. */
export interface AISessionCost {
  /** Total AI API calls this session. */
  readonly totalCalls: number
  /** Calls by provider. */
  readonly callsByProvider: Readonly<Record<AIProvider, number>>
  /** Calls by feature. */
  readonly callsByFeature: Readonly<Record<AIFeature, number>>
  /** Estimated total cost in USD (Claude API only; Ollama is free). */
  readonly estimatedCostUsd: number
}

// ============================================================================
// AIRouter Interface
// ============================================================================

export interface AIRouter {
  /**
   * Route an AI request to the appropriate provider.
   *
   * The router:
   * 1. Looks up the routing rule for the feature
   * 2. Checks if the primary provider is available
   * 3. If available, sends the request to the primary
   * 4. If primary fails, tries the fallback (if defined)
   * 5. Records the routing decision in the response
   *
   * Phase 1: always returns { success: false, error: 'AI not available' }
   */
  route(request: AIRequest): Promise<AIResponse>

  /**
   * Check if a specific AI feature is available (provider reachable).
   * Phase 1: always returns false.
   */
  isAvailable(feature: AIFeature): boolean

  /** Get the health status of all AI providers. */
  getProviderStatus(): readonly ProviderStatus[]

  /** Get the routing rule for a specific feature. */
  getRoutingRule(feature: AIFeature): RoutingRule | null

  /** Get the complete routing table. */
  getRoutingTable(): readonly RoutingRule[]

  /** Get the current session's AI cost tracking. */
  getSessionCost(): AISessionCost
}

// ============================================================================
// Phase 1 Implementation: StubAIRouter
// ============================================================================

/**
 * Phase 1 AIRouter. All features return unavailable.
 *
 * This stub ensures that:
 * - Consumers can call route() without errors
 * - isAvailable() returns false (AI features are gated on this check)
 * - The routing table is accessible for documentation/UI purposes
 * - Session cost tracking starts at zero
 *
 * Phase 3 replacement: LiveAIRouter connects to Ollama and Claude.
 */
export class StubAIRouter implements AIRouter {
  async route(request: AIRequest): Promise<AIResponse> {
    return {
      success: false,
      provider: 'pattern-matcher',
      result: {},
      latencyMs: 0,
      fallbackUsed: false,
      error: `AI feature "${request.feature}" is not available. AI integration ships in Phase 3.`,
      modelId: null,
    }
  }

  isAvailable(_feature: AIFeature): boolean {
    return false
  }

  getProviderStatus(): readonly ProviderStatus[] {
    return [
      { provider: 'pattern-matcher', available: false, lastCheck: null, error: 'Phase 1 stub' },
      { provider: 'rule-engine', available: false, lastCheck: null, error: 'Phase 1 stub' },
      { provider: 'ollama', available: false, lastCheck: null, error: 'Phase 1 stub' },
      { provider: 'claude', available: false, lastCheck: null, error: 'Phase 1 stub' },
    ]
  }

  getRoutingRule(feature: AIFeature): RoutingRule | null {
    return AI_ROUTING_TABLE.find((r) => r.feature === feature) ?? null
  }

  getRoutingTable(): readonly RoutingRule[] {
    return AI_ROUTING_TABLE
  }

  getSessionCost(): AISessionCost {
    return {
      totalCalls: 0,
      callsByProvider: {
        'pattern-matcher': 0,
        'rule-engine': 0,
        ollama: 0,
        claude: 0,
      },
      callsByFeature: {
        'camera-director-structured': 0,
        'camera-director-nl': 0,
        'station-template-selection': 0,
        'narrated-telemetry-batch': 0,
        'narrated-telemetry-deep': 0,
        'exception-triage': 0,
        'builder-mode': 0,
      },
      estimatedCostUsd: 0,
    }
  }
}
```

### 4.7 CommandPalette -- `src/lib/interfaces/command-palette.ts`

The command input contract. Phase 1 handles structured commands. Phase 3 adds NL via AIRouter.

```ts
/**
 * CommandPalette -- Input API.
 *
 * Phase 1: StructuredCommandPalette (pattern-matched structured commands).
 * Phase 3: NLCommandPalette adds "Ask AI..." natural language via AIRouter.
 *
 * The command palette is the primary keyboard navigation tool.
 * In a ZUI without traditional menus, this is critical for power users.
 *
 * Command naming: [Verb] [Object] [in Context]
 * Synonym ring: every app and concept has multiple aliases.
 *
 * References: AD-7 interface #6, IA Assessment Section 4 (Command Palette Design)
 */

import type { AppIdentifier } from './types'
import type { CameraDirective } from './camera-controller'
import type { ReceiptInput } from './receipt-store'

// ============================================================================
// Command Categories
// ============================================================================

/** Command categories per IA Assessment Section 4. */
export type CommandCategory = 'navigation' | 'view' | 'action'

// ============================================================================
// Command Arguments
// ============================================================================

/** Parsed command input passed to command handlers. */
export interface CommandArgs {
  /** The original raw input string as typed by the user. */
  readonly raw: string
  /** Parsed components of the command. */
  readonly parsed: {
    readonly verb: string
    readonly object: string
    readonly context?: string
  }
  /** How the command was invoked. */
  readonly source: 'keyboard' | 'ai'
}

// ============================================================================
// Command Result
// ============================================================================

/** Result of executing a command. */
export interface CommandResult {
  /** Whether the command executed successfully. */
  readonly success: boolean
  /** Camera directive to execute, if this is a navigation command. */
  readonly directive?: CameraDirective
  /** Receipt to record for this action. */
  readonly receipt?: ReceiptInput
  /** Human-readable feedback message. */
  readonly message?: string
  /** Error details if success is false. */
  readonly error?: string
}

// ============================================================================
// Command Handler
// ============================================================================

/**
 * Function that executes a command and returns a result.
 * Handlers are registered with the CommandPalette.
 */
export type CommandHandler = (args: CommandArgs) => Promise<CommandResult>

// ============================================================================
// Palette Command
// ============================================================================

/**
 * A registered command in the palette.
 * Per IA Assessment: format is "[Verb] [Object] [in Context]".
 */
export interface PaletteCommand {
  /** Unique command identifier. */
  readonly id: string
  /** Primary verb (e.g., "go", "show", "open", "refresh"). */
  readonly verb: string
  /** Primary object (e.g., "agent-builder", "status", "alerts"). */
  readonly object: string
  /** Optional context qualifier (e.g., "in Project Room"). */
  readonly context?: string
  /** Display label shown in the palette (e.g., "Go to Agent Builder"). */
  readonly displayLabel: string
  /** Alternative strings that match this command. */
  readonly synonyms: readonly string[]
  /** Category for grouping in the palette UI. */
  readonly category: CommandCategory
  /** Function that executes this command. */
  readonly handler: CommandHandler
}

// ============================================================================
// Palette Suggestion (for fuzzy matching)
// ============================================================================

/** A suggestion shown in the palette dropdown during typing. */
export interface PaletteSuggestion {
  /** The matched command. */
  readonly command: PaletteCommand
  /** Fuzzy match score. 0.0 (no match) to 1.0 (exact match). */
  readonly score: number
  /** Display string with match segments highlighted (HTML-safe). */
  readonly highlightedLabel: string
}

// ============================================================================
// Synonym Ring (IA Assessment Section 4)
// ============================================================================

/**
 * A group of synonyms for a single concept.
 * Used for fuzzy command matching.
 */
export interface SynonymEntry {
  /** The canonical name for this concept. */
  readonly canonical: string
  /** All accepted synonyms (including short codes). */
  readonly synonyms: readonly string[]
}

/** The complete synonym ring from IA Assessment Section 4. */
export const SYNONYM_RING: readonly SynonymEntry[] = [
  {
    canonical: 'Agent Builder',
    synonyms: ['builder', 'agentgen', 'agent gen', 'agent builder', 'AB'],
  },
  { canonical: 'Tarva Chat', synonyms: ['chat', 'tarva chat', 'CH'] },
  { canonical: 'Project Room', synonyms: ['projects', 'project room', 'tarva project', 'PR'] },
  { canonical: 'TarvaCORE', synonyms: ['core', 'tarva core', 'reasoning', 'CO'] },
  { canonical: 'TarvaERP', synonyms: ['erp', 'tarva erp', 'manufacturing', 'warehouse', 'ER'] },
  { canonical: 'tarvaCODE', synonyms: ['code', 'tarva code', 'CD'] },
  {
    canonical: 'Evidence Ledger',
    synonyms: ['evidence', 'ledger', 'receipts', 'audit', 'audit trail', 'EL'],
  },
  {
    canonical: 'Constellation',
    synonyms: ['overview', 'dashboard', 'sky', 'constellation', 'global'],
  },
  { canonical: 'Status', synonyms: ['health', 'status', 'ops', 'operations', 'diagnostics'] },
  {
    canonical: 'Activity',
    synonyms: [
      'run',
      'runs',
      'job',
      'jobs',
      'execution',
      'executions',
      'conversation',
      'conversations',
      'session',
      'sessions',
      'work',
    ],
  },
  {
    canonical: 'Alert',
    synonyms: [
      'alert',
      'alerts',
      'warning',
      'warnings',
      'error',
      'errors',
      'problem',
      'problems',
      'issue',
      'issues',
    ],
  },
] as const

// ============================================================================
// CommandPalette Interface
// ============================================================================

export interface CommandPalette {
  /**
   * Execute a raw input string.
   *
   * Phase 1: parses structured commands ("go core", "home", "open chat").
   * Phase 3: if no structured match, routes to AIRouter for NL interpretation.
   *
   * @param input - Raw user input string.
   * @param source - How the input was provided.
   */
  execute(input: string, source?: 'keyboard' | 'ai'): Promise<CommandResult>

  /**
   * Get ranked suggestions for a partial input string.
   * Used by the cmdk UI for real-time filtering.
   *
   * @param partial - The current input text.
   * @param limit - Maximum suggestions to return. Default: 10.
   */
  getSuggestions(partial: string, limit?: number): PaletteSuggestion[]

  /** Register a new command. Overwrites if ID already exists. */
  registerCommand(command: PaletteCommand): void

  /** Remove a command by ID. Returns true if found and removed. */
  removeCommand(commandId: string): boolean

  /** Get all registered commands. */
  getCommands(): readonly PaletteCommand[]

  /** Get commands filtered by category. */
  getCommandsByCategory(category: CommandCategory): readonly PaletteCommand[]
}

// ============================================================================
// Phase 1 Implementation: StructuredCommandPalette
// ============================================================================

/**
 * Phase 1 CommandPalette. Pattern-matches structured commands only.
 *
 * Supported patterns:
 * - "go [target]" / "go to [target]" -> navigate to district/view
 * - "home" / "center" / "atrium" -> return to Launch Atrium
 * - "show [target]" -> navigate to station/view
 * - "open [app]" -> launch app in new tab
 * - "refresh" -> force telemetry refresh
 *
 * Uses the synonym ring for fuzzy matching of target names.
 *
 * Phase 3 adds: "Ask AI..." prefix routes to AIRouter for NL parsing.
 */
export class StructuredCommandPalette implements CommandPalette {
  private commands: Map<string, PaletteCommand> = new Map()

  async execute(input: string, source: 'keyboard' | 'ai' = 'keyboard'): Promise<CommandResult> {
    const normalized = input.trim().toLowerCase()

    // Try exact command match first.
    const suggestions = this.getSuggestions(normalized, 1)
    if (suggestions.length > 0 && suggestions[0].score > 0.5) {
      const cmd = suggestions[0].command
      return cmd.handler({
        raw: input,
        parsed: { verb: cmd.verb, object: cmd.object, context: cmd.context },
        source,
      })
    }

    return {
      success: false,
      error: `No command matched "${input}". Try "go [app name]", "home", or "open [app name]".`,
    }
  }

  getSuggestions(partial: string, limit = 10): PaletteSuggestion[] {
    const lower = partial.toLowerCase().trim()
    if (!lower) {
      // Return all commands sorted by category when input is empty.
      return Array.from(this.commands.values())
        .slice(0, limit)
        .map((cmd) => ({
          command: cmd,
          score: 0,
          highlightedLabel: cmd.displayLabel,
        }))
    }

    const scored: PaletteSuggestion[] = []

    for (const cmd of this.commands.values()) {
      let bestScore = 0

      // Check display label.
      if (cmd.displayLabel.toLowerCase().includes(lower)) {
        bestScore = Math.max(bestScore, lower.length / cmd.displayLabel.length)
      }

      // Check synonyms.
      for (const syn of cmd.synonyms) {
        if (syn.toLowerCase().includes(lower)) {
          bestScore = Math.max(bestScore, lower.length / syn.length)
        }
        if (lower.includes(syn.toLowerCase())) {
          bestScore = Math.max(bestScore, syn.length / lower.length)
        }
      }

      // Check verb + object combination.
      const combined = `${cmd.verb} ${cmd.object}`.toLowerCase()
      if (combined.includes(lower) || lower.includes(combined)) {
        bestScore = Math.max(bestScore, 0.8)
      }

      if (bestScore > 0) {
        scored.push({
          command: cmd,
          score: bestScore,
          highlightedLabel: cmd.displayLabel,
        })
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  registerCommand(command: PaletteCommand): void {
    this.commands.set(command.id, command)
  }

  removeCommand(commandId: string): boolean {
    return this.commands.delete(commandId)
  }

  getCommands(): readonly PaletteCommand[] {
    return Array.from(this.commands.values())
  }

  getCommandsByCategory(category: CommandCategory): readonly PaletteCommand[] {
    return Array.from(this.commands.values()).filter((cmd) => cmd.category === category)
  }
}

// ============================================================================
// Default Navigation Commands (IA Assessment Section 4)
// ============================================================================

/**
 * Factory function that creates the default navigation commands.
 * Call this and register each command with the StructuredCommandPalette.
 *
 * The handlers are stubs that return CameraDirectives. The actual navigation
 * is handled by the CameraController in the consuming component.
 */
export function createDefaultNavigationCommands(): PaletteCommand[] {
  const nav = (
    id: string,
    verb: string,
    object: string,
    label: string,
    synonyms: string[],
    directive: CameraDirective
  ): PaletteCommand => ({
    id,
    verb,
    object,
    displayLabel: label,
    synonyms,
    category: 'navigation',
    handler: async () => ({
      success: true,
      directive,
      message: label,
    }),
  })

  const districtIds: Record<string, AppIdentifier> = {
    'agent-builder': 'agent-builder',
    'tarva-chat': 'tarva-chat',
    'project-room': 'project-room',
    'tarva-core': 'tarva-core',
    'tarva-erp': 'tarva-erp',
    'tarva-code': 'tarva-code',
  }

  const commands: PaletteCommand[] = [
    nav('go-home', 'go', 'launch', 'Go to Launch', ['home', 'center', 'atrium'], {
      target: { type: 'home' },
      source: 'command-palette',
    }),
    nav(
      'go-constellation',
      'go',
      'constellation',
      'Go to Constellation',
      ['overview', 'sky', 'dashboard', 'global'],
      {
        target: { type: 'constellation' },
        source: 'command-palette',
      }
    ),
  ]

  // Generate district navigation commands from synonym ring.
  for (const [id, appId] of Object.entries(districtIds)) {
    const synonymEntry = SYNONYM_RING.find(
      (s) =>
        s.canonical ===
        {
          'agent-builder': 'Agent Builder',
          'tarva-chat': 'Tarva Chat',
          'project-room': 'Project Room',
          'tarva-core': 'TarvaCORE',
          'tarva-erp': 'TarvaERP',
          'tarva-code': 'tarvaCODE',
        }[id]
    )

    commands.push(
      nav(
        `go-${id}`,
        'go',
        id,
        `Go to ${synonymEntry?.canonical ?? id}`,
        synonymEntry?.synonyms.slice() ?? [],
        {
          target: { type: 'district', districtId: appId },
          source: 'command-palette',
        }
      )
    )
  }

  return commands
}
```

### 4.8 Barrel Export -- `src/lib/interfaces/index.ts`

```ts
/**
 * Core Interfaces for Tarva Launch.
 *
 * Six contracts that form the AI-integration seam:
 * 1. CameraController -- spatial navigation
 * 2. SystemStateProvider -- telemetry data
 * 3. ReceiptStore -- audit log
 * 4. StationTemplateRegistry -- station catalog
 * 5. AIRouter -- AI provider routing
 * 6. CommandPalette -- command input
 *
 * Phase 1 implementations are exported alongside interfaces.
 * Phase 3+ replaces implementations without changing consumer code.
 *
 * Reference: AD-7 (AI Integration Architecture)
 */

// Shared domain types
export type {
  Actor,
  ActivityStatus,
  ActivityType,
  AppIdentifier,
  CameraPosition,
  EventType,
  HealthState,
  ISOTimestamp,
  ReceiptSource,
  SemanticLevel,
  Severity,
  SpatialLocation,
  Unsubscribe,
} from './types'

export { ALL_APP_IDS, APP_DISPLAY_NAMES, APP_SHORT_CODES, HEALTH_COLORS } from './types'

// CameraController
export type {
  CameraController,
  CameraDirective,
  CameraSnapshot,
  CameraTarget,
  FlyToOptions,
} from './camera-controller'

export { ManualCameraController } from './camera-controller'

// SystemStateProvider
export type {
  AppState,
  DependencyStatus,
  GlobalMetrics,
  PollingConfig,
  SystemSnapshot,
  SystemStateProvider,
} from './system-state-provider'

export { DEFAULT_POLLING_CONFIG, PollingSystemStateProvider } from './system-state-provider'

// ReceiptStore
export type {
  AIReceiptMetadata,
  LaunchReceipt,
  ReceiptFilters,
  ReceiptInput,
  ReceiptStore,
} from './receipt-store'

export { InMemoryReceiptStore } from './receipt-store'

// StationTemplateRegistry
export type {
  StationAction,
  StationLayout,
  StationTemplate,
  StationTemplateRegistry,
  TriggerCondition,
} from './station-template-registry'

export { StaticStationTemplateRegistry } from './station-template-registry'

// AIRouter
export type {
  AIFeature,
  AIProvider,
  AIRequest,
  AIResponse,
  AIRouter,
  AISessionCost,
  ProviderStatus,
  RoutingRule,
} from './ai-router'

export { AI_ROUTING_TABLE, StubAIRouter } from './ai-router'

// CommandPalette
export type {
  CommandArgs,
  CommandCategory,
  CommandHandler,
  CommandResult,
  CommandPalette,
  PaletteCommand,
  PaletteSuggestion,
  SynonymEntry,
} from './command-palette'

export {
  createDefaultNavigationCommands,
  StructuredCommandPalette,
  SYNONYM_RING,
} from './command-palette'
```

## 5. Acceptance Criteria

All criteria must pass before WS-1.7 is marked complete.

| #     | Criterion                                                                                                                                                   | Verification                                                                                                                                                                                                                    |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `pnpm typecheck` passes with zero errors after all interface files are created                                                                              | Run `pnpm typecheck`                                                                                                                                                                                                            |
| AC-2  | All 8 files exist in `src/lib/interfaces/` (types, 6 interfaces, index)                                                                                     | `ls src/lib/interfaces/`                                                                                                                                                                                                        |
| AC-3  | Barrel export (`index.ts`) re-exports all types, interfaces, implementations, and constants                                                                 | Import `{ ManualCameraController, InMemoryReceiptStore, StubAIRouter, StaticStationTemplateRegistry, StructuredCommandPalette, PollingSystemStateProvider }` from `@/lib/interfaces` in a test file and verify typecheck passes |
| AC-4  | `ManualCameraController` instantiates and `flyTo({ type: 'home' })` resolves without error                                                                  | Instantiate in a scratch file and call `await new ManualCameraController().flyTo({ type: 'home' })`                                                                                                                             |
| AC-5  | `InMemoryReceiptStore.record()` returns a complete `LaunchReceipt` with generated `id` and `timestamp`                                                      | Call `record()` with a minimal `ReceiptInput` and verify all 12 fields are present                                                                                                                                              |
| AC-6  | `StaticStationTemplateRegistry` returns exactly 2 universal + N app-specific stations per district matching AD-8                                            | Call `getTemplatesForDistrict('agent-builder')` and verify it returns Launch, Status, Pipeline, Library (4 total)                                                                                                               |
| AC-7  | `StubAIRouter.route()` returns `{ success: false }` for every `AIFeature`                                                                                   | Call `route()` for each feature and verify all return `success: false`                                                                                                                                                          |
| AC-8  | `StubAIRouter.isAvailable()` returns `false` for every `AIFeature`                                                                                          | Call `isAvailable()` for each of the 7 features                                                                                                                                                                                 |
| AC-9  | `StructuredCommandPalette.getSuggestions('builder')` returns Agent Builder command with score > 0                                                           | Call `getSuggestions` after registering default navigation commands                                                                                                                                                             |
| AC-10 | `AI_ROUTING_TABLE` contains exactly 7 entries matching tech-decisions.md routing table                                                                      | Inspect the exported constant                                                                                                                                                                                                   |
| AC-11 | `SYNONYM_RING` contains entries for all 6 apps plus Evidence Ledger, Constellation, Status, Activity, Alert                                                 | Inspect the exported constant                                                                                                                                                                                                   |
| AC-12 | `ALL_APP_IDS` contains exactly 6 entries matching Gap #4 canonical names                                                                                    | Inspect the exported constant                                                                                                                                                                                                   |
| AC-13 | All interface methods use `readonly` on parameters and return types to enforce immutability                                                                 | Code review of all interface definitions                                                                                                                                                                                        |
| AC-14 | All types and interfaces have JSDoc comments referencing their source AD/Gap/IA section                                                                     | Code review                                                                                                                                                                                                                     |
| AC-15 | `HealthState` type contains exactly 5 states matching Gap #3                                                                                                | Inspect the exported type                                                                                                                                                                                                       |
| AC-16 | `LaunchReceipt` has exactly 12 fields (id, correlationId, source, eventType, severity, summary, detail, location, timestamp, durationMs, actor, aiMetadata) | Code review                                                                                                                                                                                                                     |

## 6. Decisions Made

| #    | Decision                                                                                        | Rationale                                                                                                                                                                                                                      | Source                                     |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| D-1  | Interfaces use `readonly` on all properties and return types                                    | Enforces immutability at the type level. Consumers cannot accidentally mutate shared state. Matches the append-only nature of receipts and the read-only nature of system snapshots.                                           | Tarva ecosystem convention (provenance.ts) |
| D-2  | Phase 1 `InMemoryReceiptStore` uses `crypto.randomUUID()` (v4) not UUID v7                      | UUID v7 requires a polyfill or custom implementation. Phase 1 receipts are in-memory and lost on refresh. WS-3.1 (Supabase) will use proper UUID v7 via `gen_random_uuid()` or a JS polyfill.                                  | Engineering simplicity                     |
| D-3  | `CameraDirective` is the universal navigation instruction format                                | Both manual interactions and AI Camera Director produce the same data structure. This ensures the CameraController does not need to know whether an instruction came from a human or AI.                                       | AD-7 (AI-integration seam)                 |
| D-4  | `SystemSnapshot` is a read-only aggregate, not a live subscription                              | Snapshots are point-in-time. Consumers get the latest via `getSnapshot()` or subscribe for push updates. This avoids race conditions between AI consumers reading state and the polling loop writing it.                       | AD-5 (Telemetry Polling)                   |
| D-5  | `StationTemplate` is configuration, not a React component                                       | Templates describe what a station shows and which actions it offers. The rendering layer (WS-2.x) maps `bodyType` to React components. This separation allows AI to propose templates without generating code.                 | AD-7 (disposable stations)                 |
| D-6  | `AIRouter` stub returns `success: false` rather than throwing                                   | Callers check `response.success` before acting. No try/catch needed. The stub is indistinguishable from "all providers down" -- which is the Phase 1 reality.                                                                  | Graceful degradation (AD-7)                |
| D-7  | `CommandPalette.execute()` returns a `CameraDirective` in the result, not executing it directly | Decouples command parsing from camera control. The consuming component decides whether to pass the directive to `CameraController.navigate()`. This allows previewing directives before execution.                             | Separation of concerns                     |
| D-8  | Static district positions in `ManualCameraController` use approximate coordinates               | Exact positions depend on the capsule ring layout (WS-1.2). Phase 1 uses placeholder coordinates. WS-1.2 will update these to match the actual ring geometry.                                                                  | Phase 1 approximation                      |
| D-9  | `StationAction.command` uses template syntax (`${districtId}`, `${runId}`)                      | Action commands reference context variables that are resolved at runtime by the station component. This avoids hardcoding district/run IDs in the template registry.                                                           | Extensibility                              |
| D-10 | Shared types go in `src/lib/interfaces/types.ts`, not `src/types/`                              | AD-9 does not include a `src/types/` directory. The `src/lib/` directory is the established location for utilities and constants per WS-0.1. Keeping types co-located with the interfaces they serve improves discoverability. | AD-9 (Project File Structure)              |

## 7. Open Questions

| #    | Question                                                                                                                                              | Impact                                                                                                                      | Owner             | Resolution Deadline           |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------- |
| OQ-1 | Should `camera.store.ts` (WS-0.1) re-export `SemanticLevel` from `src/lib/interfaces/types.ts` to avoid type duplication?                             | Low -- two identical type definitions will compile but create maintenance burden                                            | React Developer   | WS-1.1 (ZUI Engine)           |
| OQ-2 | Should `districts.store.ts` (WS-0.1) adopt the `AppState` and `HealthState` types from this workstream?                                               | Medium -- aligns the store with the interface contract, but requires updating WS-0.1 deliverables                           | React Developer   | WS-1.5 (Telemetry Aggregator) |
| OQ-3 | What are the exact world-coordinate positions for the 6 capsules in the ring layout? ManualCameraController uses approximate values.                  | Low -- Phase 1 coordinates are placeholders; WS-1.2 (Launch Atrium) will compute final positions                            | React Developer   | WS-1.2 (Launch Atrium)        |
| OQ-4 | Should `ReceiptInput` include an optional `id` field for consumer-specified IDs (e.g., for idempotent retries)?                                       | Low -- Phase 1 in-memory store auto-generates IDs; Supabase store (WS-3.1) may want consumer-provided IDs for deduplication | Backend Developer | WS-3.1 (Receipt System)       |
| OQ-5 | Should `CommandPalette.execute()` accept a `CameraController` reference to auto-execute navigation directives, or should the consumer always mediate? | Medium -- affects component wiring complexity; current design requires consumer mediation                                   | React Developer   | WS-3.3 (CommandPalette)       |

## 8. Risk Register

| #   | Risk                                                                                                        | Likelihood | Impact | Mitigation                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---- | ---------------------------------------------------------------------- |
| R-1 | Interface contracts change significantly during Phase 2-3 implementation, requiring consumer rewrites       | Medium     | High   | Interfaces are designed with extension points (optional fields, discriminated unions, generic `Record<string, unknown>` for opaque payloads). Breaking changes require ADR approval.                              |
| R-2 | `ManualCameraController` spring animation does not match the WS-1.1 ZUI engine's camera physics             | Medium     | Low    | Phase 1 uses ease-out cubic as a placeholder. WS-1.1 will replace the animation internals while preserving the `CameraController` interface contract.                                                             |
| R-3 | `StaticStationTemplateRegistry` station list diverges from WS-2.x district implementations                  | Low        | Medium | Station templates are defined from AD-8 (finalized). Any WS-2.x deviation from AD-8 must update both the template registry and the ADR.                                                                           |
| R-4 | `InMemoryReceiptStore` memory grows unbounded during long sessions                                          | Low        | Low    | Expected volume is 5-15 receipts per session. Even 1000 receipts occupy < 1MB. Phase 3 moves to Supabase persistence.                                                                                             |
| R-5 | Type duplication between `camera.store.ts` `SemanticLevel` and `interfaces/types.ts` `SemanticLevel`        | High       | Low    | Both define the same `'Z0'                                                                                                                                                                                        | 'Z1' | 'Z2' | 'Z3'` union. OQ-1 tracks the resolution. Compile-time safe regardless. |
| R-6 | `StationAction.command` template syntax (`${districtId}`) not parsed correctly at runtime                   | Low        | Medium | Phase 1 station actions use simple string commands. Template variable resolution is implemented in WS-2.6 (Station Panel Framework). Document the expected syntax in the StationAction JSDoc.                     |
| R-7 | Downstream workstreams import Phase 1 implementations directly instead of programming against the interface | Medium     | Medium | The barrel export separates type-only exports (interfaces) from value exports (implementations). Document the pattern: "Depend on `CameraController` (interface), not `ManualCameraController` (implementation)." |

---

## Appendix A: Interface Dependency Map

```
CommandPalette
  |-- produces --> CameraDirective --> CameraController
  |-- produces --> ReceiptInput --> ReceiptStore
  |-- (Phase 3) routes NL via --> AIRouter

CameraController
  |-- reads --> (district positions, static in Phase 1)
  |-- (Phase 3) receives CameraDirective from --> AIRouter

SystemStateProvider
  |-- read by --> AIRouter (context for AI decisions)
  |-- read by --> StationTemplateRegistry (trigger evaluation)
  |-- read by --> capsule components (Z1 telemetry display)

ReceiptStore
  |-- written by --> CameraController (navigation receipts)
  |-- written by --> station actions (user action receipts)
  |-- written by --> AIRouter (AI action receipts, Phase 3)
  |-- read by --> Evidence Ledger (timeline display)

StationTemplateRegistry
  |-- read by --> district components (Z2 station layout)
  |-- (Phase 3) scored by --> AIRouter + SystemStateProvider

AIRouter
  |-- (Phase 3) routes to --> Ollama, Claude, rule-engine, pattern-matcher
  |-- reads --> SystemSnapshot (context)
  |-- produces --> CameraDirective (camera-director features)
  |-- produces --> ReceiptInput (AI action audit trail)
```

## Appendix B: Execution Checklist

```
[ ] 1. Create directory: src/lib/interfaces/
[ ] 2. Create src/lib/interfaces/types.ts (Section 4.1)
[ ] 3. Create src/lib/interfaces/camera-controller.ts (Section 4.2)
[ ] 4. Create src/lib/interfaces/system-state-provider.ts (Section 4.3)
[ ] 5. Create src/lib/interfaces/receipt-store.ts (Section 4.4)
[ ] 6. Create src/lib/interfaces/station-template-registry.ts (Section 4.5)
[ ] 7. Create src/lib/interfaces/ai-router.ts (Section 4.6)
[ ] 8. Create src/lib/interfaces/command-palette.ts (Section 4.7)
[ ] 9. Create src/lib/interfaces/index.ts (Section 4.8)
[ ] 10. Run pnpm typecheck -- verify zero errors
[ ] 11. Run pnpm lint -- verify zero errors
[ ] 12. Verify AC-4: ManualCameraController.flyTo({ type: 'home' }) resolves
[ ] 13. Verify AC-5: InMemoryReceiptStore.record() returns complete receipt
[ ] 14. Verify AC-6: StaticStationTemplateRegistry returns correct stations per AD-8
[ ] 15. Verify AC-7: StubAIRouter.route() returns { success: false } for all features
[ ] 16. Verify AC-9: StructuredCommandPalette fuzzy matching works for synonyms
[ ] 17. Run pnpm format to normalize all files
[ ] 18. Commit with message: "feat: define core interface contracts with Phase 1 implementations (WS-1.7)"
```
