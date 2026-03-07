'use client'

import { useCallback } from 'react'
import { Search } from 'lucide-react'
import { SessionTimecode } from '@/components/ambient/session-timecode'
import { ConnectivityDot } from './ConnectivityDot'

export interface MobileHeaderProps {
  scanLine?: React.ReactNode
  threatIndicator?: React.ReactNode
  onSearchPress?: () => void
  onLogoPress?: () => void
}

export function MobileHeader({
  scanLine,
  threatIndicator,
  onSearchPress,
  onLogoPress,
}: MobileHeaderProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

  const handleLogoTap = useCallback(() => {
    if (onLogoPress) {
      onLogoPress()
    } else {
      window.location.href = basePath || '/'
    }
  }, [onLogoPress, basePath])

  return (
    <header className="mobile-header">
      <button
        type="button"
        onClick={handleLogoTap}
        aria-label="Go to home"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${basePath}/images/logo/tarva-white-logo.svg`}
          alt="Tarva"
          style={{ height: 12, opacity: 0.4 }}
        />
      </button>

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
