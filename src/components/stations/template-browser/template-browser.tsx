'use client'

/**
 * TemplateBrowser -- Manual override panel for station template selection.
 *
 * Renders as a dialog overlay (not a station panel) at Z2/Z3.
 * Shows all templates for the current district with:
 * - Current activation scores and trigger match details
 * - Selection status: "Selected", "Available", "Pinned"
 * - Pin/unpin actions for manual override
 * - Search/filter controls
 *
 * Styled with the Oblivion glass material from WS-2.6.
 *
 * References: VISUAL-DESIGN-SPEC.md Section 1.7 (glass),
 * combined-recommendations.md "template browser for manual override"
 */

import { AnimatePresence, motion } from 'motion/react'
import { Search, SlidersHorizontal } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Badge,
  ScrollArea,
} from '@tarva/ui'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { UseTemplateBrowserReturn } from '@/hooks/use-template-browser'
import { TemplateBrowserItem } from './template-browser-item'
import './template-browser.css'

// ============================================================================
// Props
// ============================================================================

export interface TemplateBrowserProps {
  /** The template browser hook state and methods. */
  readonly browser: UseTemplateBrowserReturn
  /** The template registry (to list all templates). */
  readonly registry: StationTemplateRegistry
}

// ============================================================================
// Component
// ============================================================================

export function TemplateBrowser({ browser, registry }: TemplateBrowserProps) {
  const { state } = browser

  if (!state.districtId) return null

  const districtId = state.districtId
  const allTemplates = registry
    .getTemplatesForDistrict(districtId)
    .filter((t) => {
      // Apply search filter.
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase()
        return t.displayName.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      }
      return true
    })
    .filter((t) => {
      // Apply category filter.
      if (state.categoryFilter) {
        return t.category === state.categoryFilter
      }
      return true
    })

  const selectedIds = new Set(state.lastSelectionResult?.selected.map((s) => s.template.id) ?? [])

  const scoredMap = new Map(
    [
      ...(state.lastSelectionResult?.selected ?? []),
      ...(state.lastSelectionResult?.alternatives ?? []),
    ].map((s) => [s.template.id, s])
  )

  return (
    <Dialog open={state.isOpen} onOpenChange={(open: boolean) => !open && browser.close()}>
      <DialogContent className="template-browser-dialog max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
          </DialogTitle>
        </DialogHeader>

        {/* Search and filter controls */}
        <div className="flex items-center gap-2 px-1 pb-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 opacity-40" />
            <Input
              placeholder="Search templates..."
              value={state.searchQuery}
              onChange={(e) => browser.setSearchQuery(e.target.value)}
              className="h-8 border-white/[0.06] bg-transparent pl-8 text-[13px]"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={state.categoryFilter === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => browser.setCategoryFilter(null)}
              className="h-8 text-[11px]"
            >
              All
            </Button>
            <Button
              variant={state.categoryFilter === 'universal' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => browser.setCategoryFilter('universal')}
              className="h-8 text-[11px]"
            >
              Universal
            </Button>
            <Button
              variant={state.categoryFilter === 'app-specific' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => browser.setCategoryFilter('app-specific')}
              className="h-8 text-[11px]"
            >
              App-Specific
            </Button>
          </div>
        </div>

        {/* Template list */}
        <ScrollArea className="max-h-[400px]">
          <AnimatePresence mode="popLayout">
            {allTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <TemplateBrowserItem
                  template={template}
                  scored={scoredMap.get(template.id) ?? null}
                  isSelected={selectedIds.has(template.id)}
                  isPinned={browser.isPinned(template.id)}
                  onPin={() => browser.pinTemplate(districtId, template.id, template.displayName)}
                  onUnpin={() =>
                    browser.unpinTemplate(districtId, template.id, template.displayName)
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {allTemplates.length === 0 && (
            <div className="py-8 text-center text-[13px] opacity-40">
              No templates match your search.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
