'use client'

import '@/styles/mobile-shell.css'
import '@/styles/mobile-reduced-motion.css'

import { useState, useCallback, useSyncExternalStore } from 'react'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileScanLine } from './MobileScanLine'
import { ThreatPulseBackground } from './ThreatPulseBackground'
import { DataStaleBanner } from './DataStaleBanner'
import { DEFAULT_MOBILE_TAB, MOBILE_TABS } from '@/lib/interfaces/mobile'
import type { MobileTab } from '@/lib/interfaces/mobile'
import { useUIStore } from '@/stores/ui.store'

// ---------------------------------------------------------------------------
// Landscape detection via useSyncExternalStore
// ---------------------------------------------------------------------------
const LANDSCAPE_QUERY = '(orientation: landscape)'

function subscribeLandscape(callback: () => void) {
  const mql = window.matchMedia(LANDSCAPE_QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getLandscapeSnapshot(): boolean {
  return window.matchMedia(LANDSCAPE_QUERY).matches
}

function getLandscapeServerSnapshot(): boolean {
  return false
}

// ---------------------------------------------------------------------------
// URL tab parsing (read once on mount)
// ---------------------------------------------------------------------------
function getInitialTab(): MobileTab {
  if (typeof window === 'undefined') return DEFAULT_MOBILE_TAB

  const params = new URLSearchParams(window.location.search)

  // If ?district= is present, stay on situation tab
  const district = params.get('district')
  if (district) return 'situation'

  const tab = params.get('tab')
  if (tab && MOBILE_TABS.includes(tab as MobileTab)) {
    return tab as MobileTab
  }

  return DEFAULT_MOBILE_TAB
}

// ---------------------------------------------------------------------------
// MobileShell
// ---------------------------------------------------------------------------
export interface MobileShellProps {
  situationContent?: React.ReactNode
  mapContent?: React.ReactNode
  intelContent?: React.ReactNode
  threatIndicator?: React.ReactNode
  onMenuPress?: () => void
  onSearchPress?: () => void
}

export function MobileShell({
  situationContent,
  mapContent,
  intelContent,
  threatIndicator,
  onMenuPress,
  onSearchPress,
}: MobileShellProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>(getInitialTab)

  const isLandscape = useSyncExternalStore(
    subscribeLandscape,
    getLandscapeSnapshot,
    getLandscapeServerSnapshot,
  )

  // Morph guard: cancel any in-progress morph when switching tabs (Gap 6)
  const handleTabChange = useCallback((tab: MobileTab) => {
    const { morph, resetMorph } = useUIStore.getState()
    if (morph.phase !== 'idle') {
      resetMorph()
    }
    setActiveTab(tab)
  }, [])

  return (
    <div
      className="mobile-shell"
      data-orientation={isLandscape ? 'landscape' : 'portrait'}
    >
      {/* Skip-to-content link (a11y) */}
      <a
        href="#mobile-main-content"
        className="mobile-skip-link"
      >
        Skip to content
      </a>

      <ThreatPulseBackground />
      <MobileHeader
        scanLine={<MobileScanLine />}
        threatIndicator={threatIndicator}
        onSearchPress={onSearchPress}
        onLogoPress={() => handleTabChange('situation')}
      />

      <main className="mobile-content" id="mobile-main-content">
        <DataStaleBanner />
        {activeTab === 'situation' && (
          <div id="tab-situation" role="tabpanel">
            {situationContent}
          </div>
        )}
        {activeTab === 'map' && (
          <div id="tab-map" role="tabpanel">
            {mapContent}
          </div>
        )}
        {activeTab === 'intel' && (
          <div id="tab-intel" role="tabpanel">
            {intelContent}
          </div>
        )}
      </main>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMenuPress={onMenuPress}
      />
    </div>
  )
}
