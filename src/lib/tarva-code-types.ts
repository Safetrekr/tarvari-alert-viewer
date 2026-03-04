/**
 * tarvaCODE district types.
 *
 * tarvaCODE is a planning-stage application with no runtime.
 * Its district renders permanently in OFFLINE/UNKNOWN state
 * with placeholder content explaining the app's purpose.
 *
 * References:
 * - TARVA-SYSTEM-OVERVIEW.md (planning-stage, Vite + React skeleton)
 * - WS-2.5 Section 4.10
 */

// ============================================================================
// Stub Info
// ============================================================================

/** tarvaCODE stub metadata -- static until the app exists. */
export interface CodeStubInfo {
  /** Display name. */
  readonly displayName: 'tarvaCODE'
  /** Brief description for the placeholder station. */
  readonly description: string
  /** Planned capabilities for the "Coming Soon" display. */
  readonly plannedCapabilities: readonly string[]
  /** Whether the app exists yet. */
  readonly isStub: true
}

// ============================================================================
// Static Data
// ============================================================================

/** Static tarvaCODE metadata used by the placeholder station. */
export const TARVA_CODE_STUB: CodeStubInfo = {
  displayName: 'tarvaCODE',
  description:
    'Project-scoped AI conversation management with MCP integration for development teams. Transforms ephemeral AI interactions into durable, searchable team knowledge.',
  plannedCapabilities: [
    'Project isolation with separate context boundaries',
    'Conversation persistence and full-text search',
    'MCP endpoints for Claude Code integration',
    'Team collaboration through shared knowledge',
  ],
  isStub: true,
} as const
