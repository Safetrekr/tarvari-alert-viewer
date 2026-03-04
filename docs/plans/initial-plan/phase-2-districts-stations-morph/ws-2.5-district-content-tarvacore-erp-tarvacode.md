# WS-2.5: District Content -- TarvaCORE + TarvaERP + tarvaCODE

> **Workstream ID:** WS-2.5
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (telemetry), WS-2.1 (morph), WS-2.6 (station framework)
> **Blocks:** None
> **Resolves:** Gap #6 (TarvaERP as full capsule), Gap #7 (TarvaCORE TCP health)

---

## 1. Objective

Build district-level content for the three simpler Tarva applications: TarvaCORE, TarvaERP, and tarvaCODE. Each district unfurls from its capsule via the WS-2.1 morph choreography and renders 2-3 stations using the WS-2.6 station panel framework. These districts are intentionally leaner than Agent Builder, Tarva Chat, and Project Room -- they have fewer stations, simpler data requirements, and narrower interaction surfaces.

TarvaCORE is an Electron desktop app with no HTTP API. Its Status station consumes TCP port check data from the WS-1.5 telemetry aggregator (port 11435) and presents connection state, uptime, and a Sessions station stub for future reasoning session tracking. TarvaERP has a working frontend (5 modules, 52 pages) and receives real telemetry where available, with a Manufacturing Dashboard station that surfaces module health. tarvaCODE is a planning-stage application with no runtime -- its district renders permanently in OFFLINE/UNKNOWN state with a placeholder station explaining the app's purpose and planned capabilities.

**Success looks like:** A user zooms into the TarvaCORE capsule and sees a Status station reporting either OPERATIONAL (green, with uptime and connection timestamp) or OFFLINE (muted, with "Launch TarvaCORE to connect" guidance). The Sessions station shows a stub placeholder. Zooming into TarvaERP shows real health data pulled from `localhost:3010` alongside a Manufacturing Dashboard with module status indicators. Zooming into tarvaCODE shows a gracefully dimmed district with a "Coming Soon" placeholder that explains what tarvaCODE will be. All three districts use the standard station panel framework (glass material, luminous borders, 3-zone header/body/actions layout) and feel visually consistent with the Agent Builder, Chat, and Project Room districts.

---

## 2. Scope

### In Scope

- **TarvaCORE district container** (`src/components/stations/tarva-core/core-district.tsx`): District shell that positions 3 stations (Launch, Status, Sessions) within the morph-unfurled container, receives telemetry from the districts store
- **TarvaCORE Status station** (`src/components/stations/tarva-core/core-status-station.tsx`): Renders TCP health check results -- connection state, last successful contact timestamp, uptime (if derivable from contact history), and alert indicators; visual treatment differs between OPERATIONAL/DOWN/OFFLINE per Gap #7
- **TarvaCORE Sessions station** (`src/components/stations/tarva-core/core-sessions-station.tsx`): Stub station with placeholder content indicating future reasoning session tracking; renders in a "dormant" visual state with explanatory text
- **TarvaCORE Launch station**: Uses the universal Launch station from WS-2.6 configured with `{ target: 'electron', appId: 'tarva-core', label: 'Open TarvaCORE' }`
- **TarvaERP district container** (`src/components/stations/tarva-erp/erp-district.tsx`): District shell positioning 3 stations (Launch, Status, Manufacturing Dashboard)
- **TarvaERP Status station** (`src/components/stations/tarva-erp/erp-status-station.tsx`): Renders real HTTP health check data from `localhost:3010/api/health`, including uptime, version, and sub-check status for individual modules; falls back gracefully to OFFLINE when the app is not running
- **TarvaERP Manufacturing Dashboard station** (`src/components/stations/tarva-erp/erp-manufacturing-station.tsx`): App-specific station showing ERP module health indicators (Inventory, Production, Procurement, Quality, Warehouse) as a compact status grid with per-module health dots
- **TarvaERP Launch station**: Uses the universal Launch station from WS-2.6 configured with `{ target: 'web', url: 'http://localhost:3010', label: 'Open TarvaERP' }`
- **tarvaCODE district container** (`src/components/stations/tarva-code/code-district.tsx`): District shell positioning 2 stations (Launch, Status) with permanent OFFLINE/UNKNOWN visual treatment
- **tarvaCODE Status station** (`src/components/stations/tarva-code/code-status-station.tsx`): Permanently renders UNKNOWN state with explanatory placeholder text ("tarvaCODE is in planning stage -- project-scoped AI conversation management for development teams")
- **tarvaCODE Launch station**: Uses the universal Launch station from WS-2.6 configured with `{ target: 'stub', label: 'Not Yet Available' }`, rendered in disabled/dimmed state
- **Barrel exports** for each district directory
- **TypeScript types** for district-specific props and station data shapes
- **Unit tests** for each station component covering all health states (OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN)

### Out of Scope

- Morph choreography and transition animations (WS-2.1)
- Station panel framework (glass material, luminous borders, 3-zone layout) (WS-2.6)
- Universal Launch and Status station shell components (WS-2.6)
- Telemetry aggregator and TCP port check logic (WS-1.5)
- TarvaCORE application changes -- the Launch reads TarvaCORE as-is
- TarvaERP backend API development -- this workstream consumes whatever health data is available
- tarvaCODE application development -- the stub district is intentionally inert
- Receipt stamp generation on station actions (WS-3.1)
- AI-driven narrated telemetry for these districts (WS-3.6 / Phase 3)
- Constellation view (Z0) beacon rendering for these districts (WS-2.7)

---

## 3. Input Dependencies

| Dependency                | Source                   | What It Provides                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telemetry aggregator      | WS-1.5                   | `useTelemetry()` hook, `AppTelemetry` per-app data including `status`, `uptime`, `lastContact`, `checks`, `alerts`, `sparklineData`; TCP check results for TarvaCORE (port 11435); HTTP check results for TarvaERP; hardcoded OFFLINE for tarvaCODE |
| Districts store           | WS-1.5                   | `useDistrictsStore()` with per-app telemetry state, contact history for OFFLINE vs DOWN distinction                                                                                                                                                 |
| Morph choreography        | WS-2.1                   | `MorphContainer` component that wraps each district, provides unfurl entrance animation, station stagger timing, and settled callback                                                                                                               |
| Station panel framework   | WS-2.6                   | `StationPanel` component (glass material, luminous border, 3-zone layout), `UniversalLaunchStation`, `UniversalStatusStation` shells, `StationAction` type for action buttons                                                                       |
| Design tokens             | WS-0.2                   | All `--color-*`, `--glow-*`, `--duration-*`, `--ease-*` custom properties; glass effect classes; status color mappings                                                                                                                              |
| District type definitions | WS-1.2                   | `DistrictId`, `HealthState`, `CapsuleTelemetry`, `DistrictMeta` types                                                                                                                                                                               |
| @tarva/ui components      | npm package              | `Badge`, `StatusBadge`, `Sparkline`, `KpiCard`, `Tooltip`, `Button`                                                                                                                                                                                 |
| VISUAL-DESIGN-SPEC.md     | Design spec              | Z2 typography (station header 13px/600, body 13px/400), Z3 typography (panel heading 16px/600, table data 13px/400), glass recipes, glow levels                                                                                                     |
| TarvaERP module structure | TARVA-SYSTEM-OVERVIEW.md | 5 modules (Inventory, Production, Procurement, Quality, Warehouse), 52 pages, AG Grid tables                                                                                                                                                        |
| TarvaCORE architecture    | TARVA-SYSTEM-OVERVIEW.md | Electron app, port 11435, llama.cpp runtime, MCP bridge, no HTTP API                                                                                                                                                                                |
| tarvaCODE description     | TARVA-SYSTEM-OVERVIEW.md | Planning-stage, project-scoped AI conversation management, Vite + React skeleton                                                                                                                                                                    |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  components/
    stations/
      tarva-core/
        core-district.tsx           # District container with station layout
        core-status-station.tsx     # TCP health status display
        core-sessions-station.tsx   # Stub placeholder for reasoning sessions
        index.ts                    # Barrel export
        __tests__/
          core-district.test.tsx
          core-status-station.test.tsx
          core-sessions-station.test.tsx
      tarva-erp/
        erp-district.tsx            # District container with station layout
        erp-status-station.tsx      # HTTP health status with module checks
        erp-manufacturing-station.tsx  # Module health grid
        index.ts                    # Barrel export
        __tests__/
          erp-district.test.tsx
          erp-status-station.test.tsx
          erp-manufacturing-station.test.tsx
      tarva-code/
        code-district.tsx           # District container, permanently dimmed
        code-status-station.tsx     # UNKNOWN placeholder with description
        index.ts                    # Barrel export
        __tests__/
          code-district.test.tsx
          code-status-station.test.tsx
  types/
    station-core.ts                 # TarvaCORE-specific type extensions
    station-erp.ts                  # TarvaERP-specific type extensions
    station-code.ts                 # tarvaCODE-specific type extensions
```

### 4.2 Type Definitions

**File:** `src/types/districts/tarva-core.ts`

```ts
import type { HealthState } from '@/types/district'

/** TarvaCORE connection metadata derived from TCP health checks */
export interface CoreConnectionInfo {
  /** Current health state from TCP port check */
  status: HealthState
  /** Timestamp of the last successful TCP connection (ISO 8601) */
  lastSuccessfulContact: string | null
  /** Derived uptime: seconds since first successful contact in this session */
  uptimeSeconds: number | null
  /** Number of consecutive failed TCP checks */
  consecutiveFailures: number
  /** TCP port being checked */
  port: number
  /** Whether TarvaCORE has ever responded during this Launch session */
  hasEverConnected: boolean
}

/** Stub shape for future reasoning session data */
export interface CoreSessionSummary {
  /** Placeholder -- no data until TarvaCORE exposes session API */
  available: false
  message: string
}
```

**File:** `src/types/districts/tarva-erp.ts`

```ts
import type { HealthState } from '@/types/district'

/** ERP module identifiers matching TarvaERP's 5-module structure */
export type ErpModuleId = 'inventory' | 'production' | 'procurement' | 'quality' | 'warehouse'

/** Per-module health status within TarvaERP */
export interface ErpModuleStatus {
  id: ErpModuleId
  displayName: string
  /** Health derived from /api/health checks sub-field, or UNKNOWN if not reported */
  status: HealthState
  /** Number of pages in this module (static metadata) */
  pageCount: number
}

/** Static metadata for ERP modules */
export const ERP_MODULES: Omit<ErpModuleStatus, 'status'>[] = [
  { id: 'inventory', displayName: 'Inventory', pageCount: 12 },
  { id: 'production', displayName: 'Production', pageCount: 10 },
  { id: 'procurement', displayName: 'Procurement', pageCount: 11 },
  { id: 'quality', displayName: 'Quality', pageCount: 9 },
  { id: 'warehouse', displayName: 'Warehouse', pageCount: 10 },
]

/** Extended health data specific to TarvaERP */
export interface ErpHealthDetail {
  /** Overall app status */
  status: HealthState
  /** App version string from /api/health response */
  version: string | null
  /** Uptime in seconds from /api/health response */
  uptimeSeconds: number | null
  /** Per-module check results from /api/health checks field */
  modules: ErpModuleStatus[]
}
```

**File:** `src/types/districts/tarva-code.ts`

```ts
/** tarvaCODE stub metadata -- static until the app exists */
export interface CodeStubInfo {
  /** Display name */
  displayName: 'tarvaCODE'
  /** Brief description for the placeholder station */
  description: string
  /** Planned capabilities for the "Coming Soon" display */
  plannedCapabilities: string[]
  /** Whether the app exists yet */
  isStub: true
}

/** Static tarvaCODE metadata */
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
}
```

### 4.3 Component: TarvaCORE District

**File:** `src/components/stations/tarva-core/core-district.tsx`

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { CoreStatusStation } from './core-status-station'
import { CoreSessionsStation } from './core-sessions-station'
import type { AppTelemetry } from '@/lib/telemetry-types'

export interface CoreDistrictProps {
  /** Telemetry data for TarvaCORE from the districts store */
  telemetry: AppTelemetry
  /** Universal Launch station component (injected by parent, configured for Electron) */
  launchStation: ReactNode
  /** Whether the district has settled after morph (enables interactions) */
  isSettled: boolean
}
```

**Layout:** 3 stations arranged in a horizontal row with `--space-station-gap` (24px) spacing. At Z2, stations are approximately 280px wide each. At Z3, the focused station expands to fill the available width.

```tsx
<motion.div
  className="flex gap-[var(--space-station-gap)] p-[var(--space-district-padding)]"
  data-district="tarva-core"
>
  {/* Station 1: Launch (universal) */}
  <div className="max-w-[320px] min-w-[240px] flex-1">{launchStation}</div>

  {/* Station 2: Status (TCP health) */}
  <div className="max-w-[320px] min-w-[240px] flex-1">
    <CoreStatusStation telemetry={telemetry} isSettled={isSettled} />
  </div>

  {/* Station 3: Sessions (stub) */}
  <div className="max-w-[320px] min-w-[240px] flex-1">
    <CoreSessionsStation />
  </div>
</motion.div>
```

### 4.4 Component: TarvaCORE Status Station

**File:** `src/components/stations/tarva-core/core-status-station.tsx`

```tsx
'use client'

import { useMemo } from 'react'
import type { AppTelemetry } from '@/lib/telemetry-types'
import type { CoreConnectionInfo } from '@/types/station-core'

export interface CoreStatusStationProps {
  /** Telemetry data from the TCP port check */
  telemetry: AppTelemetry
  /** Whether the parent district has settled */
  isSettled: boolean
}
```

**Deriving connection info from telemetry:**

The WS-1.5 telemetry aggregator provides generic `AppTelemetry`. This station derives TarvaCORE-specific `CoreConnectionInfo` from it:

```ts
function deriveConnectionInfo(telemetry: AppTelemetry): CoreConnectionInfo {
  return {
    status: telemetry.status,
    lastSuccessfulContact: telemetry.lastContact,
    uptimeSeconds: telemetry.uptime ?? null,
    consecutiveFailures: telemetry.consecutiveFailures ?? 0,
    port: 11435,
    hasEverConnected: telemetry.hasEverConnected ?? false,
  }
}
```

**Visual states:**

| Health State | Primary Display                      | Secondary Info                                      | Action                                                                       |
| ------------ | ------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| OPERATIONAL  | Green dot + "Connected"              | Uptime counter, last check timestamp                | --                                                                           |
| DEGRADED     | Amber dot + "Degraded"               | Uptime counter, warning message                     | --                                                                           |
| DOWN         | Red flashing dot + "Connection Lost" | "Last seen: [timestamp]", consecutive failure count | "TarvaCORE was previously running but is no longer responding on port 11435" |
| OFFLINE      | Gray dot + "Offline"                 | "Launch TarvaCORE to connect"                       | --                                                                           |
| UNKNOWN      | Gray dashed dot + "No Contact"       | "Waiting for first connection on port 11435"        | --                                                                           |

**Station body layout:**

```tsx
<StationPanel districtId="tarva-core" stationName="Status" stationIcon="activity">
  {/* Connection indicator */}
  <div className="mb-6 flex items-center gap-3">
    <HealthBadge status={connection.status} size="lg" />
    <div className="flex flex-col">
      <span className="font-sans text-[13px] font-semibold tracking-[0.03em] text-[var(--color-text-primary)] uppercase opacity-85">
        {statusLabel}
      </span>
      <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
        TCP :{connection.port}
      </span>
    </div>
  </div>

  {/* Metrics grid (only when OPERATIONAL or DEGRADED) */}
  {isConnected && (
    <div className="grid grid-cols-2 gap-4">
      <MetricCell label="UPTIME" value={formatUptime(connection.uptimeSeconds)} />
      <MetricCell label="LAST CHECK" value={formatRelativeTime(telemetry.lastCheck)} />
    </div>
  )}

  {/* Offline guidance (when OFFLINE or UNKNOWN) */}
  {isOfflineState && (
    <div className="mt-4 rounded-lg border border-white/[0.03] bg-white/[0.02] p-4">
      <p className="font-sans text-[13px] leading-relaxed text-[var(--color-text-secondary)] opacity-75">
        {offlineMessage}
      </p>
    </div>
  )}

  {/* Down alert (when DOWN) */}
  {connection.status === 'DOWN' && (
    <div className="mt-4 rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error-dim)] p-4">
      <p className="font-sans text-[13px] leading-relaxed text-[var(--color-error)] opacity-85">
        Connection lost. Last seen {formatRelativeTime(connection.lastSuccessfulContact)}.
        {connection.consecutiveFailures > 1 &&
          ` ${connection.consecutiveFailures} consecutive checks failed.`}
      </p>
    </div>
  )}
</StationPanel>
```

**MetricCell sub-component** (local to this file):

```tsx
function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-[11px] font-normal tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase opacity-50">
        {label}
      </span>
      <span className="font-mono text-[14px] font-medium text-[var(--color-text-primary)] tabular-nums opacity-85">
        {value}
      </span>
    </div>
  )
}
```

### 4.5 Component: TarvaCORE Sessions Station (Stub)

**File:** `src/components/stations/tarva-core/core-sessions-station.tsx`

```tsx
'use client'

export interface CoreSessionsStationProps {
  /** No props required -- this is a static stub */
}
```

Renders a dormant station indicating future functionality:

```tsx
<StationPanel districtId="tarva-core" stationName="Sessions" stationIcon="brain" variant="dormant">
  <div className="flex h-full flex-col items-center justify-center py-8 opacity-40">
    {/* Dormant icon */}
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.03] bg-white/[0.02]">
      <Brain className="h-5 w-5 text-[var(--color-text-ghost)]" />
    </div>

    <span className="mb-2 font-sans text-[13px] font-medium text-[var(--color-text-secondary)]">
      Reasoning Sessions
    </span>
    <p className="max-w-[200px] text-center font-sans text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">
      Session tracking will appear here when TarvaCORE exposes its reasoning session API.
    </p>
  </div>
</StationPanel>
```

The `variant="dormant"` prop on `StationPanel` (provided by WS-2.6) applies reduced opacity, no luminous border glow, and `saturate(0.15)` filter -- matching the capsule offline treatment.

### 4.6 Component: TarvaERP District

**File:** `src/components/stations/tarva-erp/erp-district.tsx`

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { ErpStatusStation } from './erp-status-station'
import { ErpManufacturingStation } from './erp-manufacturing-station'
import type { AppTelemetry } from '@/lib/telemetry-types'

export interface ErpDistrictProps {
  /** Telemetry data for TarvaERP from the districts store */
  telemetry: AppTelemetry
  /** Universal Launch station (configured for web UI at localhost:3010) */
  launchStation: ReactNode
  /** Whether the district has settled after morph */
  isSettled: boolean
}
```

**Layout:** Same 3-station horizontal row as TarvaCORE:

```tsx
<motion.div
  className="flex gap-[var(--space-station-gap)] p-[var(--space-district-padding)]"
  data-district="tarva-erp"
>
  {/* Station 1: Launch (universal, opens localhost:3010) */}
  <div className="max-w-[320px] min-w-[240px] flex-1">{launchStation}</div>

  {/* Station 2: Status (HTTP health with module checks) */}
  <div className="max-w-[320px] min-w-[240px] flex-1">
    <ErpStatusStation telemetry={telemetry} isSettled={isSettled} />
  </div>

  {/* Station 3: Manufacturing Dashboard */}
  <div className="max-w-[320px] min-w-[240px] flex-1">
    <ErpManufacturingStation telemetry={telemetry} isSettled={isSettled} />
  </div>
</motion.div>
```

### 4.7 Component: TarvaERP Status Station

**File:** `src/components/stations/tarva-erp/erp-status-station.tsx`

```tsx
'use client'

import { useMemo } from 'react'
import type { AppTelemetry } from '@/lib/telemetry-types'
import type { ErpHealthDetail } from '@/types/station-erp'
import { ERP_MODULES, type ErpModuleStatus } from '@/types/station-erp'

export interface ErpStatusStationProps {
  /** Telemetry data from HTTP health check */
  telemetry: AppTelemetry
  /** Whether the parent district has settled */
  isSettled: boolean
}
```

**Deriving ERP health detail from telemetry:**

```ts
function deriveErpHealth(telemetry: AppTelemetry): ErpHealthDetail {
  const moduleStatuses: ErpModuleStatus[] = ERP_MODULES.map((mod) => ({
    ...mod,
    status: telemetry.checks?.[mod.id]
      ? telemetry.checks[mod.id] === 'ok'
        ? 'OPERATIONAL'
        : 'DEGRADED'
      : 'UNKNOWN',
  }))

  return {
    status: telemetry.status,
    version: telemetry.version ?? null,
    uptimeSeconds: telemetry.uptime ?? null,
    modules: moduleStatuses,
  }
}
```

**Station body layout:**

```tsx
<StationPanel districtId="tarva-erp" stationName="Status" stationIcon="activity">
  {/* Health indicator */}
  <div className="mb-6 flex items-center gap-3">
    <HealthBadge status={health.status} size="lg" />
    <div className="flex flex-col">
      <span className="font-sans text-[13px] font-semibold tracking-[0.03em] text-[var(--color-text-primary)] uppercase opacity-85">
        {health.status === 'OPERATIONAL' ? 'Running' : health.status}
      </span>
      {health.version && (
        <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
          v{health.version}
        </span>
      )}
    </div>
  </div>

  {/* Metrics (when online) */}
  {health.status === 'OPERATIONAL' || health.status === 'DEGRADED' ? (
    <div className="mb-6 grid grid-cols-2 gap-4">
      <MetricCell label="UPTIME" value={formatUptime(health.uptimeSeconds)} />
      <MetricCell
        label="MODULES"
        value={`${health.modules.filter((m) => m.status === 'OPERATIONAL').length}/5`}
      />
      <MetricCell label="PAGES" value="52" />
      <MetricCell label="LAST CHECK" value={formatRelativeTime(telemetry.lastCheck)} />
    </div>
  ) : (
    <div className="mt-4 rounded-lg border border-white/[0.03] bg-white/[0.02] p-4">
      <p className="font-sans text-[13px] leading-relaxed text-[var(--color-text-secondary)] opacity-75">
        TarvaERP is not currently running. Start the dev server at localhost:3010 to see live
        telemetry.
      </p>
    </div>
  )}

  {/* Telemetry sparkline */}
  {telemetry.sparklineData.length > 0 && (
    <div className="mt-auto pt-4">
      <Sparkline
        data={telemetry.sparklineData}
        width={240}
        height={32}
        strokeWidth={1}
        variant="neutral"
        showFill={false}
        aria-hidden="true"
        className="opacity-40"
        style={{ '--trend-neutral': 'var(--color-teal)' } as React.CSSProperties}
      />
    </div>
  )}
</StationPanel>
```

### 4.8 Component: TarvaERP Manufacturing Dashboard Station

**File:** `src/components/stations/tarva-erp/erp-manufacturing-station.tsx`

```tsx
'use client'

import { useMemo } from 'react'
import type { AppTelemetry } from '@/lib/telemetry-types'
import { ERP_MODULES, type ErpModuleStatus } from '@/types/station-erp'

export interface ErpManufacturingStationProps {
  /** Telemetry data for TarvaERP */
  telemetry: AppTelemetry
  /** Whether the parent district has settled */
  isSettled: boolean
}
```

**Station body -- module health grid:**

The Manufacturing Dashboard shows ERP's 5 modules as a compact status grid. Each module row displays a health dot, module name, and page count. When TarvaERP is offline, the entire grid renders in the dimmed offline treatment.

```tsx
<StationPanel
  districtId="tarva-erp"
  stationName="Manufacturing"
  stationIcon="factory"
  variant={isOffline ? 'dormant' : 'default'}
>
  {isOffline ? (
    <div className="flex h-full flex-col items-center justify-center py-8 opacity-40">
      <Factory className="mb-4 h-5 w-5 text-[var(--color-text-ghost)]" />
      <p className="max-w-[200px] text-center font-sans text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">
        Module status will appear when TarvaERP is running.
      </p>
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      {modules.map((mod) => (
        <ModuleRow key={mod.id} module={mod} />
      ))}
    </div>
  )}
</StationPanel>
```

**ModuleRow sub-component:**

```tsx
function ModuleRow({ module }: { module: ErpModuleStatus }) {
  const dotColor = {
    OPERATIONAL: 'bg-[var(--color-healthy)]',
    DEGRADED: 'bg-[var(--color-warning)]',
    DOWN: 'bg-[var(--color-error)]',
    OFFLINE: 'bg-[var(--color-offline)]',
    UNKNOWN: 'bg-[var(--color-offline)]',
  }[module.status]

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 hover:bg-white/[0.02]">
      {/* Health dot */}
      <span
        className={cn('h-2 w-2 rounded-full', dotColor)}
        aria-label={`${module.displayName}: ${module.status.toLowerCase()}`}
      />

      {/* Module name */}
      <span className="flex-1 font-sans text-[13px] font-medium text-[var(--color-text-primary)] opacity-85">
        {module.displayName}
      </span>

      {/* Page count */}
      <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
        {module.pageCount} pg
      </span>
    </div>
  )
}
```

### 4.9 Component: tarvaCODE District

**File:** `src/components/stations/tarva-code/code-district.tsx`

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { CodeStatusStation } from './code-status-station'
import type { AppTelemetry } from '@/lib/telemetry-types'

export interface CodeDistrictProps {
  /** Telemetry data -- always OFFLINE or UNKNOWN */
  telemetry: AppTelemetry
  /** Universal Launch station (configured as stub/disabled) */
  launchStation: ReactNode
  /** Whether the district has settled after morph */
  isSettled: boolean
}
```

**Layout:** 2 stations only (Launch + Status). The district container has the permanent offline visual treatment: `opacity-[var(--opacity-dim-offline)]` and `saturate(0.15)` filter.

```tsx
<motion.div
  className="flex gap-[var(--space-station-gap)] p-[var(--space-district-padding)]"
  data-district="tarva-code"
  style={{
    opacity: 'var(--opacity-dim-offline)',
    filter: 'saturate(0.15)',
  }}
>
  {/* Station 1: Launch (disabled stub) */}
  <div className="max-w-[320px] min-w-[240px] flex-1">{launchStation}</div>

  {/* Station 2: Status (permanent placeholder) */}
  <div className="max-w-[400px] min-w-[280px] flex-1">
    <CodeStatusStation />
  </div>
</motion.div>
```

### 4.10 Component: tarvaCODE Status Station

**File:** `src/components/stations/tarva-code/code-status-station.tsx`

```tsx
'use client'

import { TARVA_CODE_STUB } from '@/types/station-code'

export interface CodeStatusStationProps {
  /** No dynamic props -- this is a static placeholder */
}
```

**Station body -- "Coming Soon" placeholder:**

```tsx
<StationPanel districtId="tarva-code" stationName="Status" stationIcon="code" variant="dormant">
  <div className="flex flex-col py-4">
    {/* UNKNOWN badge */}
    <div className="mb-4 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full border border-dashed border-[var(--color-offline)] bg-[var(--color-offline)]" />
      <span className="font-sans text-[11px] font-medium tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
        Coming Soon
      </span>
    </div>

    {/* Description */}
    <p className="mb-4 font-sans text-[13px] leading-relaxed text-[var(--color-text-secondary)] opacity-60">
      {TARVA_CODE_STUB.description}
    </p>

    {/* Planned capabilities */}
    <div className="flex flex-col gap-2">
      <span className="font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase opacity-40">
        Planned
      </span>
      <ul className="flex flex-col gap-1.5">
        {TARVA_CODE_STUB.plannedCapabilities.map((cap, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[12px] text-[var(--color-text-tertiary)] opacity-50"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-ghost)]" />
            <span className="font-sans leading-relaxed">{cap}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
</StationPanel>
```

### 4.11 District Registration

Each district must be registered with the parent district renderer (from WS-2.1) so the morph choreography knows which component to unfurl. This is a configuration entry, not a new file:

```ts
// In the district registry (likely src/components/districts/district-registry.ts)
import { CoreDistrict } from '@/components/stations/tarva-core'
import { ErpDistrict } from '@/components/stations/tarva-erp'
import { CodeDistrict } from '@/components/stations/tarva-code'

export const DISTRICT_COMPONENTS: Record<DistrictId, ComponentType<DistrictProps>> = {
  // ... Agent Builder, Tarva Chat, Project Room from WS-2.2, WS-2.3, WS-2.4
  'tarva-core': CoreDistrict,
  'tarva-erp': ErpDistrict,
  'tarva-code': CodeDistrict,
}
```

---

## 5. Acceptance Criteria

### Functional

| #   | Criterion                                                                                                                                                          | Verification                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| F1  | TarvaCORE district renders 3 stations (Launch, Status, Sessions) when morph settles at Z2                                                                          | Visual inspection + integration test                                                |
| F2  | TarvaCORE Status station shows OPERATIONAL with green dot and uptime counter when TCP check to port 11435 succeeds                                                 | Unit test with mocked `AppTelemetry` where `status: 'OPERATIONAL'`                  |
| F3  | TarvaCORE Status station shows DOWN with red flashing dot, "Connection Lost" message, and consecutive failure count when previously connected but now unresponsive | Unit test with `status: 'DOWN'`, `hasEverConnected: true`, `consecutiveFailures: 3` |
| F4  | TarvaCORE Status station shows OFFLINE with guidance text when app has never been contacted                                                                        | Unit test with `status: 'OFFLINE'`, `hasEverConnected: false`                       |
| F5  | TarvaCORE Sessions station renders as a dormant stub with explanatory text                                                                                         | Unit test asserting placeholder content and `variant="dormant"`                     |
| F6  | TarvaERP district renders 3 stations (Launch, Status, Manufacturing Dashboard) when morph settles                                                                  | Visual inspection + integration test                                                |
| F7  | TarvaERP Status station displays version number, uptime, and module count when OPERATIONAL                                                                         | Unit test with `status: 'OPERATIONAL'`, `version: '2.0.0'`, `uptime: 3600`          |
| F8  | TarvaERP Manufacturing Dashboard shows 5 module rows with health dots, names, and page counts                                                                      | Unit test asserting all 5 modules render with correct labels                        |
| F9  | TarvaERP Manufacturing Dashboard renders in dormant state when the app is OFFLINE                                                                                  | Unit test with `status: 'OFFLINE'`                                                  |
| F10 | tarvaCODE district renders 2 stations (Launch disabled, Status placeholder)                                                                                        | Visual inspection + unit test                                                       |
| F11 | tarvaCODE Status station shows "Coming Soon" badge with description and planned capabilities list                                                                  | Unit test asserting `TARVA_CODE_STUB` content renders                               |
| F12 | tarvaCODE district container applies permanent offline visual treatment (opacity 0.40, saturate 0.15)                                                              | CSS inspection + unit test checking inline styles                                   |
| F13 | All three districts register correctly in the district registry and are selectable from the capsule ring                                                           | Integration test navigating to each district via capsule click                      |
| F14 | All stations use the `StationPanel` component from WS-2.6 for consistent glass/glow/layout                                                                         | Code review                                                                         |

### Design Fidelity

| #   | Criterion                                                                                                                         | Verification                |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| D1  | Station headers use Z2 typography: 13px Geist Sans, weight 600, tracking 0.03em, uppercase, opacity 0.85                          | Computed style verification |
| D2  | Data values use Z2 typography: 14px Geist Mono, weight 500, tabular-nums, opacity 0.85                                            | Computed style verification |
| D3  | Data labels use Z2 typography: 11px Geist Sans, weight 400, tracking 0.04em, uppercase, opacity 0.50                              | Computed style verification |
| D4  | Offline guidance panels use `bg-white/[0.02]` with `border border-white/[0.03]`                                                   | CSS inspection              |
| D5  | DOWN alert panels use `bg-[var(--color-error-dim)]` with `border-[var(--color-error)]/20`                                         | CSS inspection              |
| D6  | ERP module health dots use correct status color tokens (`--color-healthy`, `--color-warning`, `--color-error`, `--color-offline`) | Unit test per module state  |
| D7  | tarvaCODE UNKNOWN badge uses dashed border on the health dot (matching capsule UNKNOWN treatment from WS-1.2)                     | DOM inspection              |
| D8  | Dormant stations apply `saturate(0.15)` filter and reduced glow, consistent with capsule OFFLINE state                            | CSS inspection              |
| D9  | All spacing uses design token variables (`--space-station-gap`, `--space-district-padding`)                                       | Code review                 |

### Performance

| #   | Criterion                                                                                                   | Verification                     |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------- |
| P1  | Each district component is code-split via the district registry -- not bundled with the initial atrium load | Build analysis with `next build` |
| P2  | ERP module row hover transitions use CSS `transition-colors` only, no JS-driven animation                   | Code review                      |
| P3  | tarvaCODE static content requires zero API calls and no telemetry polling                                   | Code review + network inspection |
| P4  | All three district containers use `data-district` attribute for CSS containment targeting                   | DOM inspection                   |

### Accessibility

| #   | Criterion                                                                               | Verification             |
| --- | --------------------------------------------------------------------------------------- | ------------------------ |
| A1  | ERP module health dots have `aria-label` announcing module name and status              | DOM inspection           |
| A2  | TarvaCORE DOWN alert text is announced to screen readers (not `aria-hidden`)            | DOM inspection           |
| A3  | tarvaCODE planned capabilities list uses semantic `<ul>/<li>` elements                  | DOM inspection           |
| A4  | Dormant/stub stations have descriptive text explaining their purpose (not just an icon) | DOM inspection           |
| A5  | All stations inherit keyboard focus management from `StationPanel` (WS-2.6)             | Keyboard navigation test |

---

## 6. Decisions Made

| #   | Decision                                                                                                                 | Rationale                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **3 stations for TarvaCORE** (Launch, Status, Sessions) with Sessions as a stub                                          | AD-8 specifies "Sessions" as the app-specific station. Building the stub now establishes the station slot for when TarvaCORE exposes session data. The station costs nearly nothing as static content.                                                                              |
| D2  | **3 stations for TarvaERP** (Launch, Status, Manufacturing Dashboard)                                                    | AD-8 specifies "Manufacturing dashboard" as the app-specific station. The 5-module health grid provides glanceable value without requiring deep ERP API integration.                                                                                                                |
| D3  | **2 stations for tarvaCODE** (Launch disabled, Status placeholder)                                                       | AD-8 shows "(stub -- placeholder until app exists)". No app-specific station is warranted for an app that does not exist yet. The Status station doubles as the informational placeholder.                                                                                          |
| D4  | **Derive CoreConnectionInfo from generic AppTelemetry** rather than a separate TarvaCORE-specific telemetry hook         | The WS-1.5 telemetry aggregator already handles the TCP check and reports results in the standard `AppTelemetry` shape. Adding a separate hook would duplicate polling logic. The derivation function is a pure transform with no side effects.                                     |
| D5  | **Static ERP_MODULES metadata** rather than fetching module list from TarvaERP API                                       | TarvaERP's 5-module structure (Inventory, Production, Procurement, Quality, Warehouse) is stable and documented. Fetching it dynamically adds network dependency for data that changes only with major ERP releases. Module health status is still dynamic (from telemetry checks). |
| D6  | **Permanent offline visual treatment on tarvaCODE district container** rather than per-station treatment                 | The entire district is inert. Applying the filter at the container level (opacity 0.40, saturate 0.15) is more efficient than duplicating it on each child element and ensures visual consistency.                                                                                  |
| D7  | **District containers accept `launchStation` as a ReactNode prop** rather than importing UniversalLaunchStation directly | The parent (morph orchestrator or district renderer) is responsible for configuring the universal stations with app-specific props (target URL, label, etc.). This keeps district components decoupled from the universal station configuration logic in WS-2.6.                    |
| D8  | **Import `motion` from `motion/react`**, not `framer-motion`                                                             | Per project constraints. The `motion/react` package is the current import path for Framer Motion in the Tarva ecosystem.                                                                                                                                                            |

---

## 7. Open Questions

| #   | Question                                                                                                           | Impact                                                                                                | Proposed Resolution                                                                                                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Does TarvaCORE expose any session data via IPC, file system, or other mechanism?                                   | Medium -- determines whether Sessions station can show real data vs stub.                             | Proceed with stub. If a session API surfaces, convert the stub to a live station. The type `CoreSessionSummary` is already designed with `available: false` as the default.                                                      |
| Q2  | Does TarvaERP's `/api/health` endpoint report per-module status in the `checks` field?                             | Medium -- determines whether Manufacturing Dashboard shows real per-module health or UNKNOWN for all. | Assume the health endpoint exists but may not report per-module checks. Default each module to UNKNOWN if not present in the response. When TarvaERP adds module-level reporting, this station will light up automatically.      |
| Q3  | What icon should represent each station? ("brain" for Sessions, "factory" for Manufacturing, "code" for tarvaCODE) | Low -- icons are from Lucide React and easily changed.                                                | Use the proposed icons. Replace if better options surface during implementation.                                                                                                                                                 |
| Q4  | Should the tarvaCODE district be clickable/zoomable at all, or remain inert at Z1?                                 | Low -- the morph choreography (WS-2.1) handles selection gating.                                      | Allow selection and morph. The district content is minimal but provides useful context about what tarvaCODE will be. Preventing zoom would require special-casing in the capsule ring, which adds complexity for little benefit. |

---

## 8. Risk Register

| #   | Risk                                                                                                              | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | **TarvaERP health endpoint does not exist yet** -- the /api/health path is assumed but not validated              | Medium     | Low    | The telemetry aggregator (WS-1.5) already handles missing health endpoints by falling back to OFFLINE status. The ERP Status station gracefully degrades to show offline guidance text. No blocking dependency.                                              |
| R2  | **TarvaCORE TCP port 11435 is used by another process** causing false OPERATIONAL readings                        | Low        | Medium | The telemetry aggregator validates TCP connection success but cannot verify the responding process is TarvaCORE. Document port 11435 as reserved for TarvaCORE in the system overview. In practice, this port is unlikely to collide with common services.   |
| R3  | **ERP module structure changes** -- modules added, removed, or renamed                                            | Low        | Low    | `ERP_MODULES` is a static array in `station-erp.ts`. Updating it is a single-file change. If dynamic module discovery becomes important, the Manufacturing Dashboard can fetch the module list from TarvaERP's API in a future iteration.                    |
| R4  | **StationPanel `variant="dormant"` not implemented in WS-2.6** at the time this workstream begins                 | Medium     | Medium | If the dormant variant is not ready, apply the offline visual treatment (opacity, saturation, no glow) directly on the station wrapper div. Refactor to use the panel variant when WS-2.6 delivers it.                                                       |
| R5  | **tarvaCODE description and capabilities change as the app's vision evolves**                                     | High       | Low    | `TARVA_CODE_STUB` is a centralized constant in `station-code.ts`. Updating the text is trivial and has no structural impact on the component tree.                                                                                                           |
| R6  | **Visual inconsistency between these simpler districts and the richer Agent Builder/Chat/Project Room districts** | Medium     | Medium | All districts use the same `StationPanel` framework from WS-2.6 for glass material, luminous borders, and zone layout. The visual treatment is consistent by construction. Simpler content within the panels is intentional -- these apps have less to show. |
