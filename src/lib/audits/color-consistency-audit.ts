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
        target: ':root',
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
