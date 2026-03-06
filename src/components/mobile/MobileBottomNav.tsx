'use client'

import { LayoutGrid, Map, Radio, Menu } from 'lucide-react'
import type { MobileTab } from '@/lib/interfaces/mobile'

export interface MobileBottomNavProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  onMenuPress?: () => void
}

const TABS: { id: MobileTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'situation', label: 'Situation', icon: LayoutGrid },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'intel', label: 'Intel', icon: Radio },
]

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onMenuPress,
}: MobileBottomNavProps) {
  return (
    <nav
      className="mobile-bottom-nav"
      role="tablist"
      aria-label="Main navigation"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tab-${id}`}
            data-active={isActive}
            className="mobile-tab-button"
            onClick={() => onTabChange(id)}
          >
            <Icon size={20} />
            <span className="mobile-tab-label">{label}</span>
            <span className="mobile-tab-underline" aria-hidden="true" />
          </button>
        )
      })}
      <button
        className="mobile-tab-button"
        aria-label="Menu"
        data-active="false"
        onClick={onMenuPress}
      >
        <Menu size={20} />
      </button>
    </nav>
  )
}
