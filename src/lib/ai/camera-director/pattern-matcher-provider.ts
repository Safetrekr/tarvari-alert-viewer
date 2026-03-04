/**
 * Pattern Matcher Provider -- Layer 1 of the three-layer AI Camera Director.
 *
 * Deterministic NL command parser. Handles 60%+ of Camera Director queries
 * with sub-millisecond latency and zero network calls. Always available,
 * even when Ollama is offline.
 *
 * Handles:
 * - Structured commands: "go core", "home", "zoom out", "show alerts"
 * - Fuzzy app references: "show me builder" -> Agent Builder
 * - Simple intent patterns: "where are the errors?", "take me to chat"
 * - Heuristic target guessing for speculative drift
 *
 * References:
 * - AD-7 (three-layer intelligence model)
 * - tech-decisions.md (camera-director-structured: pattern-matcher)
 * - WS-1.7 SYNONYM_RING
 *
 * @module pattern-matcher-provider
 * @see WS-3.4 Section 4.3
 */

import { SYNONYM_RING } from '@/lib/interfaces/command-palette'
import type { CameraDirective, CameraTarget } from '@/lib/interfaces/camera-controller'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES, ALL_APP_IDS } from '@/lib/interfaces/types'

// ============================================================================
// Match Result
// ============================================================================

/** Result of a pattern match attempt. */
export interface PatternMatchResult {
  /** Whether a pattern was matched. */
  readonly matched: boolean
  /** The resolved camera directive, if matched. */
  readonly directive: CameraDirective | null
  /** Confidence in the match. 1.0 for exact structured commands. */
  readonly confidence: number
  /** Human-readable explanation of the match. */
  readonly reasoning: string
  /** Alternative interpretations considered. */
  readonly alternatives: readonly string[]
}

/** Heuristic guess for speculative drift (before Ollama responds). */
export interface DriftGuess {
  readonly districtId: AppIdentifier | null
  readonly confidence: number
  readonly reason: string
}

// ============================================================================
// App Resolution (Synonym-based)
// ============================================================================

interface AppResolution {
  readonly appId: AppIdentifier
  readonly displayName: string
  readonly confidence: number
  readonly matchType: 'exact-id' | 'synonym' | 'fuzzy'
}

// ============================================================================
// Telemetry Context (minimal, for alert routing)
// ============================================================================

/** Minimal telemetry context the pattern matcher needs for alert routing. */
export interface PatternMatchContext {
  /** Alert counts per district. */
  readonly alertCounts: Readonly<Record<string, number>>
  /** Health states per district. */
  readonly healthStates: Readonly<Record<string, string>>
}

// ============================================================================
// Intent Patterns
// ============================================================================

type Intent = 'navigate' | 'show' | 'home' | 'overview' | 'alerts' | 'zoom-in' | 'zoom-out'

interface IntentPattern {
  readonly regex: RegExp
  readonly intent: Intent
  readonly extractTarget: (match: RegExpMatchArray) => string | null
}

const INTENT_PATTERNS: readonly IntentPattern[] = [
  // Direct navigation
  { regex: /^go\s+(?:to\s+)?(.+)$/i, intent: 'navigate', extractTarget: (m) => m[1] ?? null },
  {
    regex: /^(?:take|bring)\s+me\s+(?:to\s+)?(.+)$/i,
    intent: 'navigate',
    extractTarget: (m) => m[1] ?? null,
  },
  {
    regex: /^(?:navigate|fly|jump)\s+(?:to\s+)?(.+)$/i,
    intent: 'navigate',
    extractTarget: (m) => m[1] ?? null,
  },

  // Show / inspect
  {
    regex: /^(?:show|display|view)\s+(?:me\s+)?(.+)$/i,
    intent: 'show',
    extractTarget: (m) => m[1] ?? null,
  },
  {
    regex: /^(?:what(?:'s| is))\s+(?:happening\s+(?:with|at|in)\s+)?(.+)$/i,
    intent: 'show',
    extractTarget: (m) => m[1] ?? null,
  },
  { regex: /^(?:what\s+about)\s+(.+)$/i, intent: 'show', extractTarget: (m) => m[1] ?? null },
  { regex: /^(?:check|inspect)\s+(.+)$/i, intent: 'show', extractTarget: (m) => m[1] ?? null },

  // Home / overview
  {
    regex: /^(?:home|center|atrium|hub|launch|reset)$/i,
    intent: 'home',
    extractTarget: () => null,
  },
  {
    regex: /^(?:go\s+)?(?:back|return)(?:\s+home)?$/i,
    intent: 'home',
    extractTarget: () => null,
  },

  // Constellation / overview
  {
    regex: /^(?:overview|constellation|sky|global|dashboard)$/i,
    intent: 'overview',
    extractTarget: () => null,
  },
  {
    regex: /^(?:show|see)\s+(?:the\s+)?(?:big\s+picture|everything|all(?:\s+apps)?)$/i,
    intent: 'overview',
    extractTarget: () => null,
  },
  {
    regex: /^zoom\s+out$/i,
    intent: 'zoom-out',
    extractTarget: () => null,
  },
  {
    regex: /^zoom\s+in$/i,
    intent: 'zoom-in',
    extractTarget: () => null,
  },
  {
    regex: /^zoom\s+(?:to\s+)?z([0-3])$/i,
    intent: 'navigate',
    extractTarget: (m) => `z${m[1]}`,
  },

  // Alert-focused (resolved to district with most alerts via context)
  {
    regex:
      /^(?:where\s+are\s+)?(?:the\s+)?(?:errors?|alerts?|problems?|issues?|warnings?|failures?)$/i,
    intent: 'alerts',
    extractTarget: () => null,
  },
  {
    regex: /^(?:what(?:'s| is))\s+(?:broken|failing|down|wrong)$/i,
    intent: 'alerts',
    extractTarget: () => null,
  },
  {
    regex: /^(?:show|find)\s+(?:me\s+)?(?:what(?:'s| is))\s+(?:broken|failing|wrong)$/i,
    intent: 'alerts',
    extractTarget: () => null,
  },
]

// ============================================================================
// Zoom Level Targets
// ============================================================================

const ZOOM_LEVELS: Record<string, CameraTarget> = {
  z0: { type: 'constellation' },
  z1: { type: 'home' },
  z2: { type: 'position', position: { offsetX: 0, offsetY: 0, zoom: 1.0 } },
  z3: { type: 'position', position: { offsetX: 0, offsetY: 0, zoom: 1.8 } },
}

// ============================================================================
// Pattern Matcher Provider
// ============================================================================

export class PatternMatcherProvider {
  /**
   * Attempt to match a user query against known patterns.
   *
   * @param query - The user's input string.
   * @param context - Optional telemetry context for alert-based routing.
   * @returns Pattern match result with directive and confidence.
   */
  match(query: string, context: PatternMatchContext | null = null): PatternMatchResult {
    const trimmed = query.trim()
    if (!trimmed) {
      return {
        matched: false,
        directive: null,
        confidence: 0,
        reasoning: 'Empty query.',
        alternatives: [],
      }
    }

    for (const pattern of INTENT_PATTERNS) {
      const regexMatch = trimmed.match(pattern.regex)
      if (!regexMatch) continue

      const target = pattern.extractTarget(regexMatch)

      switch (pattern.intent) {
        case 'navigate':
        case 'show': {
          if (!target) break

          // Check for zoom level targets (z0, z1, z2, z3)
          const zoomTarget = ZOOM_LEVELS[target.toLowerCase()]
          if (zoomTarget) {
            return {
              matched: true,
              directive: {
                target: zoomTarget,
                source: 'ai',
                narration: `Setting zoom to ${target.toUpperCase()} level.`,
              },
              confidence: 1.0,
              reasoning: `Matched zoom level command: ${target}.`,
              alternatives: [],
            }
          }

          // Try to resolve as an app target
          const resolved = this.resolveAppTarget(target)
          if (resolved) {
            return {
              matched: true,
              directive: {
                target: { type: 'district', districtId: resolved.appId },
                highlights: [resolved.appId],
                narration: `Navigating to ${resolved.displayName}.`,
                source: 'ai',
              },
              confidence: resolved.confidence,
              reasoning: `Matched "${trimmed}" to ${resolved.displayName} via ${resolved.matchType}.`,
              alternatives: [],
            }
          }
          break
        }

        case 'home':
          return {
            matched: true,
            directive: {
              target: { type: 'home' },
              source: 'ai',
              narration: 'Returning to Launch Atrium.',
            },
            confidence: 1.0,
            reasoning: 'Matched home/return command.',
            alternatives: [],
          }

        case 'overview':
          return {
            matched: true,
            directive: {
              target: { type: 'constellation' },
              source: 'ai',
              narration: 'Zooming out to Constellation view.',
            },
            confidence: 1.0,
            reasoning: 'Matched overview/constellation command.',
            alternatives: [],
          }

        case 'zoom-in':
          return {
            matched: true,
            directive: {
              target: { type: 'position', position: { offsetX: 0, offsetY: 0, zoom: 1.0 } },
              source: 'ai',
              narration: 'Zooming in.',
            },
            confidence: 0.9,
            reasoning: 'Matched zoom in command.',
            alternatives: [],
          }

        case 'zoom-out':
          return {
            matched: true,
            directive: {
              target: { type: 'constellation' },
              source: 'ai',
              narration: 'Zooming out.',
            },
            confidence: 0.9,
            reasoning: 'Matched zoom out command.',
            alternatives: [],
          }

        case 'alerts': {
          const alertTarget = this.resolveAlertTarget(context)
          if (alertTarget) {
            return {
              matched: true,
              directive: {
                target: { type: 'district', districtId: alertTarget.appId },
                highlights: alertTarget.allAlertDistricts,
                fades: alertTarget.healthyDistricts,
                narration: alertTarget.narration,
                source: 'ai',
              },
              confidence: 0.85,
              reasoning: alertTarget.reasoning,
              alternatives: alertTarget.alternatives,
            }
          }
          // No alerts anywhere -- navigate to constellation for overview.
          return {
            matched: true,
            directive: {
              target: { type: 'constellation' },
              source: 'ai',
              narration: 'No active alerts across any application. Showing the overview.',
            },
            confidence: 0.7,
            reasoning: 'Alert-focused query but no alerts found. Defaulting to constellation.',
            alternatives: [],
          }
        }
      }
    }

    return {
      matched: false,
      directive: null,
      confidence: 0,
      reasoning: `No pattern matched for "${trimmed}". Requires LLM interpretation.`,
      alternatives: [],
    }
  }

  /**
   * Generate a heuristic drift guess for a query.
   * Used during the Ollama inference window for speculative camera drift.
   * Fast keyword matching only -- no regex parsing needed.
   *
   * @param query - User query string.
   * @param context - Optional telemetry context.
   * @returns Best-guess target district and confidence.
   */
  guessDriftTarget(query: string, context: PatternMatchContext | null = null): DriftGuess {
    const lower = query.toLowerCase().trim()
    if (!lower) {
      return { districtId: null, confidence: 0, reason: 'Empty query.' }
    }

    // First try a full pattern match -- if it succeeds, use that
    const matchResult = this.match(query, context)
    if (matchResult.matched && matchResult.directive) {
      const target = matchResult.directive.target
      if (target.type === 'district') {
        return {
          districtId: target.districtId,
          confidence: matchResult.confidence * 0.8, // Discount for drift
          reason: matchResult.reasoning,
        }
      }
      // Home/constellation targets do not have a district
      return { districtId: null, confidence: 0, reason: 'Target is not a district.' }
    }

    // Keyword matching against district names and synonyms
    let bestMatch: DriftGuess = { districtId: null, confidence: 0, reason: 'No keyword match.' }

    for (const entry of SYNONYM_RING) {
      const allTerms = [entry.canonical.toLowerCase(), ...entry.synonyms.map((s) => s.toLowerCase())]
      for (const term of allTerms) {
        if (lower.includes(term) && term.length > 1) {
          const appId = this.canonicalToAppId(entry.canonical)
          if (appId) {
            const confidence = term.length / Math.max(lower.length, 1) * 0.6
            if (confidence > bestMatch.confidence) {
              bestMatch = {
                districtId: appId,
                confidence: Math.min(confidence, 0.6),
                reason: `Keyword "${term}" matches ${entry.canonical}.`,
              }
            }
          }
        }
      }
    }

    // Alert-related keywords -> district with most alerts
    const alertKeywords = ['error', 'alert', 'broken', 'failing', 'down', 'wrong', 'problem', 'issue']
    if (alertKeywords.some((kw) => lower.includes(kw)) && context) {
      const topAlert = this.findTopAlertDistrict(context)
      if (topAlert) {
        return {
          districtId: topAlert,
          confidence: 0.5,
          reason: 'Alert-related query; drifting toward district with most alerts.',
        }
      }
    }

    return bestMatch
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Resolve a target string to an AppIdentifier using the synonym ring.
   */
  private resolveAppTarget(target: string): AppResolution | null {
    const lower = target.toLowerCase().trim()

    // 1. Direct AppIdentifier match
    if ((ALL_APP_IDS as readonly string[]).includes(lower)) {
      const appId = lower as AppIdentifier
      return {
        appId,
        displayName: APP_DISPLAY_NAMES[appId],
        confidence: 1.0,
        matchType: 'exact-id',
      }
    }

    // 2. Synonym ring match
    for (const entry of SYNONYM_RING) {
      const allTerms = [entry.canonical.toLowerCase(), ...entry.synonyms.map((s) => s.toLowerCase())]
      for (const term of allTerms) {
        if (lower === term || lower === term.replace(/\s+/g, '-')) {
          const appId = this.canonicalToAppId(entry.canonical)
          if (appId) {
            return {
              appId,
              displayName: APP_DISPLAY_NAMES[appId],
              confidence: 0.95,
              matchType: 'synonym',
            }
          }
        }
      }
    }

    // 3. Fuzzy substring match (less confident)
    for (const entry of SYNONYM_RING) {
      const allTerms = [entry.canonical.toLowerCase(), ...entry.synonyms.map((s) => s.toLowerCase())]
      for (const term of allTerms) {
        if (term.includes(lower) || lower.includes(term)) {
          const appId = this.canonicalToAppId(entry.canonical)
          if (appId && term.length > 1) {
            return {
              appId,
              displayName: APP_DISPLAY_NAMES[appId],
              confidence: 0.75,
              matchType: 'fuzzy',
            }
          }
        }
      }
    }

    return null
  }

  /**
   * Convert a canonical synonym ring name to an AppIdentifier.
   */
  private canonicalToAppId(canonical: string): AppIdentifier | null {
    const map: Record<string, AppIdentifier> = {
      'Agent Builder': 'agent-builder',
      'Tarva Chat': 'tarva-chat',
      'Project Room': 'project-room',
      'TarvaCORE': 'tarva-core',
      'TarvaERP': 'tarva-erp',
      'tarvaCODE': 'tarva-code',
    }
    return map[canonical] ?? null
  }

  /**
   * Resolve an alert-focused query to the district with the most alerts.
   */
  private resolveAlertTarget(context: PatternMatchContext | null): {
    appId: AppIdentifier
    allAlertDistricts: AppIdentifier[]
    healthyDistricts: AppIdentifier[]
    narration: string
    reasoning: string
    alternatives: string[]
  } | null {
    if (!context) return null

    // Find districts with alerts, sorted by count descending
    const districtsWithAlerts = ALL_APP_IDS
      .filter((id) => (context.alertCounts[id] ?? 0) > 0)
      .sort((a, b) => (context.alertCounts[b] ?? 0) - (context.alertCounts[a] ?? 0))

    if (districtsWithAlerts.length === 0) return null

    const topDistrict = districtsWithAlerts[0]
    const topAlertCount = context.alertCounts[topDistrict] ?? 0
    const topDisplayName = APP_DISPLAY_NAMES[topDistrict]

    const healthyDistricts = ALL_APP_IDS.filter(
      (id) => (context.alertCounts[id] ?? 0) === 0,
    )

    const alternatives = districtsWithAlerts.slice(1).map((id) => {
      const count = context.alertCounts[id] ?? 0
      return `${APP_DISPLAY_NAMES[id]} (${count} alert${count !== 1 ? 's' : ''})`
    })

    return {
      appId: topDistrict,
      allAlertDistricts: districtsWithAlerts,
      healthyDistricts,
      narration: `${topDisplayName} has ${topAlertCount} active alert${topAlertCount !== 1 ? 's' : ''}. ${
        districtsWithAlerts.length > 1
          ? `${districtsWithAlerts.length - 1} other district${districtsWithAlerts.length - 1 !== 1 ? 's' : ''} also ha${districtsWithAlerts.length - 1 !== 1 ? 've' : 's'} alerts.`
          : 'No other districts have alerts.'
      }`,
      reasoning: `Alert-focused query resolved to ${topDisplayName} with ${topAlertCount} alert${topAlertCount !== 1 ? 's' : ''} (highest count).`,
      alternatives,
    }
  }

  /**
   * Find the district with the most alerts.
   */
  private findTopAlertDistrict(context: PatternMatchContext): AppIdentifier | null {
    let topId: AppIdentifier | null = null
    let topCount = 0

    for (const id of ALL_APP_IDS) {
      const count = context.alertCounts[id] ?? 0
      if (count > topCount) {
        topId = id
        topCount = count
      }
    }

    return topId
  }
}
