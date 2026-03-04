'use client'

/**
 * TemplateBrowserHeader -- Search and filter controls for the template browser.
 *
 * Extracted for composition flexibility. Can be used standalone
 * or as part of the full TemplateBrowser dialog.
 *
 * References: VISUAL-DESIGN-SPEC.md Section 1.7 (glass panel typography)
 */

import { Search, SlidersHorizontal } from 'lucide-react'
import { Input, Button, Badge } from '@tarva/ui'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'

// ============================================================================
// Props
// ============================================================================

export interface TemplateBrowserHeaderProps {
  /** Which district the browser is showing. */
  readonly districtId: AppIdentifier
  /** Current search query value. */
  readonly searchQuery: string
  /** Callback when search query changes. */
  readonly onSearchChange: (query: string) => void
  /** Current category filter. */
  readonly categoryFilter: 'universal' | 'app-specific' | null
  /** Callback when category filter changes. */
  readonly onCategoryFilterChange: (filter: 'universal' | 'app-specific' | null) => void
}

// ============================================================================
// Component
// ============================================================================

export function TemplateBrowserHeader({
  districtId,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
}: TemplateBrowserHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal
          className="h-4 w-4 opacity-70"
          style={{ color: 'var(--color-ember-bright)' }}
        />
        <span className="font-sans text-[16px] font-semibold tracking-[0.02em]">
          Station Templates
        </span>
        <Badge variant="outline" className="ml-2 text-[10px]">
          {APP_DISPLAY_NAMES[districtId]}
        </Badge>
      </div>

      {/* Search and filter row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 opacity-40" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 border-white/[0.06] bg-transparent pl-8 text-[13px]"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={categoryFilter === null ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onCategoryFilterChange(null)}
            className="h-8 text-[11px]"
          >
            All
          </Button>
          <Button
            variant={categoryFilter === 'universal' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onCategoryFilterChange('universal')}
            className="h-8 text-[11px]"
          >
            Universal
          </Button>
          <Button
            variant={categoryFilter === 'app-specific' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onCategoryFilterChange('app-specific')}
            className="h-8 text-[11px]"
          >
            App-Specific
          </Button>
        </div>
      </div>
    </div>
  )
}
