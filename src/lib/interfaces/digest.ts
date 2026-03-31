/**
 * TypeScript types for the TarvaRI digest/briefing system.
 *
 * Maps to the Pydantic models in TarvaRI `app/models/digest.py`.
 * All dates are ISO 8601 strings (YYYY-MM-DD for dates, full ISO for datetimes).
 *
 * @module digest
 */

// ---------------------------------------------------------------------------
// Enums / Literals
// ---------------------------------------------------------------------------

export type ThreatLevel = 'Critical' | 'Substantial' | 'Moderate' | 'Low' | 'Negligible'
export type DigestPeriod = 'AM' | 'PM'
export type DigestStatus = 'draft' | 'reviewed' | 'published' | 'archived'
export type RiskTrend = 'increasing' | 'stable' | 'decreasing'
export type ActionPriority = 'required' | 'recommended' | 'optional'

// ---------------------------------------------------------------------------
// Sub-models
// ---------------------------------------------------------------------------

export interface ThreatVectorScore {
  vector: string
  level: ThreatLevel
  summary: string
  alert_count: number
  highest_priority: string | null
}

export interface KeyEvent {
  title: string
  brief: string
  severity: string
  category: string
  source_type: string | null
  source_id: string | null
}

export interface ActionItem {
  action: string
  responsible: string
  priority: ActionPriority
  category: string
}

export interface UpcomingCityPreview {
  city: string
  country: string | null
  visit_date: string
  threat_level: ThreatLevel | null
  summary: string
}

// ---------------------------------------------------------------------------
// Core content payload (JSONB in DB)
// ---------------------------------------------------------------------------

export interface DigestContent {
  executive_summary: string
  city_situation: string
  country_context: string
  regional_context: string
  upcoming_cities_preview: UpcomingCityPreview[]
  threat_vectors: ThreatVectorScore[] | null
  recommended_actions: ActionItem[]
  weather_outlook: string | null
  key_events: KeyEvent[] | null
  watch_items: string[] | null
  risk_trend: RiskTrend | null
}

// ---------------------------------------------------------------------------
// API responses
// ---------------------------------------------------------------------------

export interface DigestResponse {
  id: string
  trip_id: string
  city: string
  country: string | null
  trip_date: string
  period: DigestPeriod
  digest_content: DigestContent
  threat_level: ThreatLevel
  status: DigestStatus
  generated_by: string
  model_used: string
  generation_metadata: Record<string, unknown>
  created_at: string
  updated_at: string | null
}

export interface DigestListResponse {
  digests: DigestResponse[]
  total_count: number
}

export interface DigestEvidenceItem {
  id: string
  source_type: 'alert' | 'intel' | 'discovery' | 'summary'
  source_id: string
  relevance: string | null
  created_at: string
}

export interface DigestEvidenceResponse {
  digest_id: string
  evidence: DigestEvidenceItem[]
  count: number
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  Critical: '#ef4444',
  Substantial: '#f97316',
  Moderate: '#eab308',
  Low: '#3b82f6',
  Negligible: '#6b7280',
}

export const THREAT_LEVEL_ORDER: ThreatLevel[] = [
  'Critical',
  'Substantial',
  'Moderate',
  'Low',
  'Negligible',
]

export const RISK_TREND_CONFIG: Record<RiskTrend, { label: string; color: string; icon: 'up' | 'down' | 'flat' }> = {
  increasing: { label: 'INCREASING', color: '#ef4444', icon: 'up' },
  stable: { label: 'STABLE', color: '#6b7280', icon: 'flat' },
  decreasing: { label: 'DECREASING', color: '#22c55e', icon: 'down' },
}

export const ACTION_PRIORITY_CONFIG: Record<ActionPriority, { label: string; color: string }> = {
  required: { label: 'REQUIRED', color: '#ef4444' },
  recommended: { label: 'RECOMMENDED', color: '#eab308' },
  optional: { label: 'OPTIONAL', color: '#6b7280' },
}
