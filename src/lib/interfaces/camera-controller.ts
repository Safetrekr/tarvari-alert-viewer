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
