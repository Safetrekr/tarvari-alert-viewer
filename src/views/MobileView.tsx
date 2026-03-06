'use client'

import { MobileShell } from '@/components/mobile/MobileShell'
import { MobileSituationTab } from '@/components/mobile/MobileSituationTab'
import { MobileThreatIndicator } from '@/components/mobile/MobileThreatIndicator'

export default function MobileView() {
  return (
    <MobileShell
      situationContent={<MobileSituationTab />}
      threatIndicator={<MobileThreatIndicator />}
    />
  )
}
