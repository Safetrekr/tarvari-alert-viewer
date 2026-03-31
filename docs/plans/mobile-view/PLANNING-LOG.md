# Planning Log

> **Project:** Mobile View -- TarvaRI Alert Viewer
> **Started:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Current Phase:** F
> **Current Step:** COMPLETE

## Status Summary

| Phase | SOWs Written | SOWs Total | Overview | Review | Gate |
|-------|-------------|------------|----------|--------|------|
| A     | 4/4         | 4          | Done     | PASS WITH ISSUES | PASSED (all fixes applied) |
| B     | 3/3         | 3          | Done     | PASS WITH ISSUES | PASSED (all fixes applied) |
| C     | 5/5         | 5          | Done     | PASS WITH ISSUES | PASSED (all fixes applied) |
| D     | 3/3         | 3          | Done     | PASS WITH ISSUES | PASSED (all fixes applied) |
| E     | 3/3         | 3          | Done     | PASS WITH ISSUES | PASSED (all fixes applied) |
| F     | 5/5         | 5          | Done     | PASS WITH ISSUES | PASSED (all fixes applied) |

## SOW Checklist

| WS ID | Title | Agent | Phase | Status |
|-------|-------|-------|-------|--------|
| WS-A.1 | Detection + Code Splitting | react-developer | A | Written (fixes applied) |
| WS-A.2 | Mobile Layout Shell | world-class-ui-designer | A | Written (fixes applied) |
| WS-A.3 | Design Tokens + Ambient | world-class-ui-designer | A | Written (fixes applied) |
| WS-A.4 | Viewport Meta + Safe Areas | react-developer | A | Written (fixes applied) |
| WS-B.1 | Threat Banner + Priority | world-class-ui-designer | B | Written (fixes applied) |
| WS-B.2 | Category Grid | world-class-ux-designer | B | Written |
| WS-B.3 | Ambient + Protective Ops | world-class-ui-designer | B | Written (fixes applied) |
| WS-C.1 | Bottom Sheet Core | world-class-ux-designer | C | Written (fixes applied) |
| WS-C.2 | Bottom Sheet Advanced | world-class-ui-designer | C | Written |
| WS-C.3 | Map View | world-class-ux-designer | C | Written |
| WS-C.4 | Map Interactions | react-developer | C | Written (fixes applied) |
| WS-C.5 | Settings Sheet | react-developer | C | Written |
| WS-D.1 | Category Detail | information-architect | D | Written (fixes applied) |
| WS-D.2 | Alert Detail + Card | information-architect | D | Written (fixes applied) |
| WS-D.3 | Morph + Navigation | react-developer | D | Written (fixes applied) |
| WS-E.1 | Intel Tab | information-architect | E | Written (fixes applied) |
| WS-E.2 | Region Detail + Search | information-architect | E | Written (fixes applied) |
| WS-E.3 | Cross-Tab Links | react-developer | E | Written (fixes applied) |
| WS-F.1 | Landscape Layouts | world-class-ui-designer | F | Written |
| WS-F.2 | Accessibility Audit | react-developer | F | Written (fixes applied) |
| WS-F.3 | Performance + PWA | react-developer | F | Written (fixes applied) |
| WS-F.4 | Protective Ops Hooks | world-class-ux-designer | F | Written (fixes applied) |
| WS-F.5 | Pull-to-Refresh + Edge Polish | world-class-ux-designer | F | Written (fixes applied) |

## Issues Log

| # | Phase | SOW | Issue | Severity | Resolution | Status |
|---|-------|-----|-------|----------|------------|--------|
| 1 | A | A.2 | Glass values hardcoded instead of using A.3 tokens | HIGH | Updated A.2 CSS to use var() token references | Fixed |
| 2 | A | A.2/A.3 | Dependency direction contradiction | HIGH | Updated A.2 Depends On to include A.3, A.4 | Fixed |
| 3 | A | All | MobileStateView (AD-7) not assigned to any SOW | HIGH | Added D-8 to A.2 | Fixed |
| 4 | A | A.1/A.2 | No automated tests specified | HIGH | Added test deliverables to A.1 and A.2 | Fixed |
| 5 | A | A.3 | blur-active vs glass-sheet-blur inconsistency | MEDIUM | Documented as intentional exception | Fixed |
| 6 | A | A.3/A.4 | Safe area token duplication | MEDIUM | Dropped --space-safe-area-* from A.3 | Fixed |
| 7 | A | A.3/A.4 | globals.css insertion coordinates missing | MEDIUM | Added exact insertion points | Fixed |
| 8 | A | A.2 | mobile-shell.css import not specified | MEDIUM | Added import spec to A.2 D-2 | Fixed |
| 9 | B | B.1/B.3 | Staleness hook and banner duplicated | HIGH | B.3 owns staleness (useDataFreshness + DataStaleBanner at shell level). Removed from B.1. | Fixed |
| 10 | B | B.1/B.3 | Posture derivation duplicated | HIGH | B.1 owns derivePosture in threat-utils.ts. Removed derivePostureLevel from B.3. | Fixed |
| 11 | B | B.1 | PostureLevel type incompatible with codebase ThreatLevel | HIGH | Replaced PostureLevel with ThreatLevel, GUARDED with MODERATE | Fixed |
| 12 | B | B.1 | Resolves header incorrectly claims C1 | HIGH | Updated to C2 only | Fixed |
| 13 | B | B.3 | Resolves header says None but delivers C1, C7 | HIGH | Updated to C1, C7 | Fixed |
| 14 | B | B.1/B.3 | Posture threshold values diverge | MEDIUM | Use B.1 thresholds (match desktop ThreatPictureCard.tsx) | Fixed |
| 15 | C | C.1/C.4 | Bottom sheet API mismatch (config vs individual props) | HIGH | C.1 is authoritative. C.4 updated to use SHEET_CONFIGS. Added ariaLabel to C.1 base props. | Fixed |
| 16 | C | C.1/C.4 | Snap point format mismatch (integers vs fractions) | HIGH | Integer percentages are authoritative. Runtime guard added. | Fixed |
| 17 | C | C.1/C.2 | C.1 lacks extension points for C.2 | HIGH | Added headerActions slot, forwardRef, exported hook types | Fixed |
| 18 | C | C.4 | Fly-to offset for bottom sheet not resolved | MEDIUM | Add padding.bottom to flyTo call | Fixed |
| 19 | D | D.1/D.2 | MobileAlertCard prop name mismatch (alert vs item) | HIGH | D.1 changed to item={item} | Fixed |
| 20 | D | D.1/D.2 | onAlertTap callback signature mismatch (string vs CategoryIntelItem) | HIGH | D.1 wraps: onTap={(item) => onAlertTap(item.id)} | Fixed |
| 21 | D | D.2/D.3 | onShowOnMap signature mismatch (simple vs enriched) | HIGH | D.2 expanded to pass coords, category, basic | Fixed |
| 22 | D | D.3/D.1 | MobileCategoryDetail integration code uses wrong props | HIGH | D.3 updated to use onAlertTap, onBack, currentSnap, selectedAlertId | Fixed |
| 23 | D | D.1 | Dependency table contradicts D.2's actual interface | HIGH | Updated D.1 Section 3 WS-D.2 row | Fixed |
| 24 | D | D.1/D.2 | MOBILE_ICON_MAP file location ambiguity | MEDIUM | Extracted to src/components/mobile/icon-map.ts | Fixed |
| 25 | D | D.2 | Missing useCoverageMapData dependency | MEDIUM | Added to D.2 input dependencies | Fixed |
| 26 | D | D.3 | Dependency table D.1 row uses wrong prop name | MEDIUM | Changed onViewAlert to onAlertTap | Fixed |
| 27 | D | D.3 | Dependency table D.2 row missing basic param | MEDIUM | Added basic parameter to onShowOnMap signature | Fixed |
| 28 | E | E.1/E.2 | THREAT_LEVEL_COLORS duplicate with divergent values | HIGH | Single definition in coverage.ts with --posture-* tokens | Fixed |
| 29 | E | E.3 | REGION_CENTROIDS uses wrong keys (14 fabricated vs 11 actual) | HIGH | Rewrote with correct 11 GEO_REGION_KEYS | Fixed |
| 30 | E | E.3 | MobileIntelTab integration missing required props | MEDIUM | Added onSearchPress, onRegionTap, scrollRef | Fixed |
| 31 | E | E.1/E.2 | Adapter file directory inconsistency | MEDIUM | Standardized on src/lib/adapters/ | Fixed |
| 32 | E | E.1/E.3 | MobileIntelTab prop interface gap (4 vs 9 props) | MEDIUM | Added optional cross-tab props to E.1 interface | Fixed |
| 33 | E | E.1 | Blocks header missing WS-E.2 | MEDIUM | Added WS-E.2 to Blocks | Fixed |
| 34 | F | F.4 | Fabricated line 103 reference for idleLockTimeoutMinutes in settings.store.ts | HIGH | Removed line number, marked as pending WS-C.5 | Fixed |
| 35 | F | F.4 | useP1AudioAlert duplicates useNotificationDispatch audio without clear dedup | HIGH | Added DM-8 documenting architectural separation via code-split | Fixed |
| 36 | F | F.5 | useConnectionToast dependency header claims useDataFreshness but uses navigator.onLine | MEDIUM | Corrected Depends On header and OVERVIEW Conflict 1 | Fixed |
| 37 | F | F.3 | Service worker + static export basePath interaction not addressed | MEDIUM | Added basePath + static export note to F.3 addendum | Fixed |
| 38 | F | F.2 | Test examples use jest.fn() but project uses Vitest | LOW | Updated to vi.fn() and vitest-axe | Fixed |
| 39 | F | F.4/F.5 | Connection toast and idle lock overlay both at z-index 50 | LOW | Toast lowered to z-45 (noted in F.5 addendum) | Fixed |

## Deviations from Discovery Input

| # | What Changed | Why | Impact |
|---|-------------|-----|--------|
