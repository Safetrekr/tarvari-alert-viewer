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
