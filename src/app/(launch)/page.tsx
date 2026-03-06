/**
 * Launch page orchestrator — detects viewport and renders the appropriate
 * view (desktop ZUI or mobile layout) via code-split dynamic imports.
 *
 * Architecture decision AD-1: separate component trees for mobile and desktop,
 * sharing only the data layer (TanStack Query hooks, Zustand stores).
 *
 * @module (launch)/page
 * @see docs/plans/mobile-view/phase-a-foundation/ws-a.1-detection-code-splitting.md
 */

'use client'

import dynamic from 'next/dynamic'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { HydrationShell } from '@/components/mobile/HydrationShell'

const DesktopView = dynamic(() => import('@/views/DesktopView'), { ssr: false })
const MobileView = dynamic(() => import('@/views/MobileView'), { ssr: false })

export default function LaunchPage() {
  const isMobile = useIsMobile()

  if (isMobile === null) return <HydrationShell />
  if (isMobile) return <MobileView />
  return <DesktopView />
}
