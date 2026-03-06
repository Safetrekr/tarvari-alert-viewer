/**
 * Derived types for intel bundle display.
 *
 * Composites that join bundle rows with their triage decisions and
 * resolved member intel items. Used by hooks and UI components.
 *
 * @module intel-bundles
 */

import type { IntelBundleRow, TriageDecisionRow, IntelNormalizedRow } from '@/lib/supabase/types'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// View mode
// ============================================================================

/**
 * The three data view modes for the spatial dashboard.
 *
 * - 'triaged': Only approved bundles (post-triage). The analyst's curated view.
 * - 'all-bundles': All bundles regardless of status. Full pipeline visibility.
 * - 'raw': Individual intel_normalized items. Unprocessed feed view.
 */
export type ViewMode = 'triaged' | 'all-bundles' | 'raw'

/** Human-readable labels for each view mode. */
export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  'triaged': 'Triaged',
  'all-bundles': 'All Bundles',
  'raw': 'Raw Alerts',
} as const

/** Default view mode on initial load. */
export const DEFAULT_VIEW_MODE: ViewMode = 'raw'

// ============================================================================
// Composite types
// ============================================================================

/**
 * A bundle with its latest triage decision attached.
 *
 * This is the primary display type for both "Triaged" and "All Bundles"
 * modes. The `decision` field is null only if the bundle has never been
 * triaged (status='pending'), which is a valid state in "All Bundles" mode.
 */
export interface BundleWithDecision {
  bundle: IntelBundleRow
  decision: TriageDecisionRow | null
  operationalPriority: OperationalPriority | null
}

/**
 * A bundle with its triage decision AND all member intel items resolved.
 *
 * Used for the bundle detail / drill-down view. The `members` array
 * contains the full intel_normalized rows referenced by
 * `bundle.member_intel_ids`. Members that no longer exist in the database
 * (stale references) are silently excluded.
 */
export interface BundleWithMembers extends BundleWithDecision {
  members: IntelNormalizedRow[]
  primaryIntel: IntelNormalizedRow | null
}

// ============================================================================
// Bundle status helpers
// ============================================================================

export type BundleStatus = 'pending' | 'approved' | 'rejected'
export type TriageDecision = 'approve' | 'reject'

/** Auto-triage reviewer UUID (all-zeros). */
export const AUTO_TRIAGE_REVIEWER_ID = '00000000-0000-0000-0000-000000000000'

export function isAutoTriaged(decision: TriageDecisionRow): boolean {
  return decision.reviewer_id === AUTO_TRIAGE_REVIEWER_ID
}

/**
 * Get the effective display title for a bundle.
 * Prefers analyst-edited title > bundle title > generated fallback.
 */
export function getBundleDisplayTitle(
  bundle: IntelBundleRow,
  decision: TriageDecisionRow | null,
): string {
  if (decision?.edited_title) return decision.edited_title
  if (bundle.title) return bundle.title
  const categories = bundle.categories?.join(', ') ?? 'Unknown'
  return `${bundle.final_severity} ${categories} Bundle`
}

/**
 * Get the effective display summary for a bundle.
 * Prefers analyst-edited summary > bundle summary.
 */
export function getBundleDisplaySummary(
  bundle: IntelBundleRow,
  decision: TriageDecisionRow | null,
): string | null {
  if (decision?.edited_summary) return decision.edited_summary
  return bundle.summary
}

/**
 * Get the effective severity for display.
 * Prefers analyst-edited severity > bundle final_severity.
 */
export function getBundleDisplaySeverity(
  bundle: IntelBundleRow,
  decision: TriageDecisionRow | null,
): string {
  if (decision?.edited_severity) return decision.edited_severity
  return bundle.final_severity
}

// ============================================================================
// Confidence tier
// ============================================================================

export type ConfidenceTier = 'LOW' | 'MODERATE' | 'HIGH'

export interface ConfidenceTierInfo {
  tier: ConfidenceTier
  label: string
  color: string
}

const CONFIDENCE_TIERS: { max: number; info: ConfidenceTierInfo }[] = [
  { max: 59, info: { tier: 'LOW', label: 'LOW', color: 'rgba(239, 68, 68, 0.7)' } },
  { max: 79, info: { tier: 'MODERATE', label: 'MODERATE', color: 'rgba(234, 179, 8, 0.6)' } },
  { max: 100, info: { tier: 'HIGH', label: 'HIGH', color: 'rgba(34, 197, 94, 0.7)' } },
]

/**
 * Resolve a numeric confidence value (0-100) into a display tier.
 * Returns LOW for null/invalid values.
 */
export function getConfidenceTier(value: string | null): ConfidenceTierInfo {
  if (value == null) return CONFIDENCE_TIERS[0].info
  const num = parseFloat(value)
  if (isNaN(num)) return CONFIDENCE_TIERS[0].info
  for (const { max, info } of CONFIDENCE_TIERS) {
    if (num <= max) return info
  }
  return CONFIDENCE_TIERS[2].info
}
