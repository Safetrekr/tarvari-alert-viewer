'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useIntelSearch, type SearchResult } from '@/hooks/use-intel-search'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { MobileAlertCard } from './MobileAlertCard'
import { HighlightedSnippet } from './HighlightedSnippet'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'

export interface MobileSearchOverlayProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onResultTap?: (item: CategoryIntelItem) => void
}

interface AdaptedSearchResult extends CategoryIntelItem {
  snippetHtml: string | null
}

function adaptSearchResult(result: SearchResult): AdaptedSearchResult {
  return {
    id: result.id,
    title: result.title,
    severity: result.severity,
    category: result.category,
    eventType: null,
    sourceKey: null,
    confidence: null,
    geoScope: null,
    shortSummary: result.snippet.replace(/<[^>]*>/g, ''),
    snippetHtml: result.snippet,
    ingestedAt: new Date().toISOString(),
    sentAt: null,
    operationalPriority: result.operationalPriority,
  }
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  onResultTap,
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const searchResult = useIntelSearch({ query, limit: 30 })
  const results = searchResult.queryResult.data ?? []
  const isSearching = searchResult.queryResult.isLoading && query.length >= 3

  const adaptedResults = useMemo(
    () => results.map(adaptSearchResult),
    [results],
  )

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleResultTap = useCallback(
    (item: CategoryIntelItem) => {
      onResultTap?.(item)
    },
    [onResultTap],
  )

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        background: 'var(--glass-sheet-bg, rgba(5, 9, 17, 0.96))',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search intel"
    >
      {/* Search header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px var(--space-content-padding, 12px)',
          paddingTop: 'max(8px, env(safe-area-inset-top, 8px))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search intel..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          style={{
            flex: 1,
            height: 40,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          &#10005;
        </button>
      </div>

      {/* Results */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {query.length < 3 && (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            Type at least 3 characters to search
          </div>
        )}

        {isSearching && (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            Searching...
          </div>
        )}

        {query.length >= 3 && !isSearching && results.length === 0 && (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {adaptedResults.map((item) => (
          <div key={item.id}>
            <MobileAlertCard
              item={item}
              onTap={handleResultTap}
            />
            {item.snippetHtml && (
              <div style={{ padding: '0 var(--space-content-padding, 12px) 8px' }}>
                <HighlightedSnippet
                  html={item.snippetHtml}
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10,
                    color: 'rgba(255, 255, 255, 0.35)',
                    lineHeight: 1.5,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
