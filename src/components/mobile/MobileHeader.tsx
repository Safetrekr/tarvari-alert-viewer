'use client'

import { Search } from 'lucide-react'
import { SessionTimecode } from '@/components/ambient/session-timecode'
import { ConnectivityDot } from './ConnectivityDot'

export interface MobileHeaderProps {
  scanLine?: React.ReactNode
  threatIndicator?: React.ReactNode
  onSearchPress?: () => void
}

export function MobileHeader({
  scanLine,
  threatIndicator,
  onSearchPress,
}: MobileHeaderProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  return (
    <header className="mobile-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${basePath}/images/logo/tarva-white-logo.svg`}
        alt="Tarva"
        style={{ height: 12, opacity: 0.4, pointerEvents: 'none' }}
      />

      {scanLine}

      <div className="mobile-header-right">
        <SessionTimecode inline />
        {threatIndicator}
        <button
          className="mobile-header-icon-button"
          aria-label="Search"
          onClick={onSearchPress}
        >
          <Search size={18} />
        </button>
        <ConnectivityDot />
      </div>
    </header>
  )
}
