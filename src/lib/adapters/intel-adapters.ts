/**
 * Adapter functions bridging various data shapes to CategoryIntelItem
 * for consistent rendering via MobileAlertCard.
 */

import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { IntelFeedItem } from '@/hooks/use-intel-feed'

/** Adapt IntelFeedItem -> CategoryIntelItem for mobile alert card rendering. */
export function adaptFeedItem(item: IntelFeedItem): CategoryIntelItem {
  return {
    id: item.id,
    title: item.title,
    severity: item.severity,
    category: item.category,
    eventType: null,
    sourceKey: item.sourceId,
    confidence: null,
    geoScope: null,
    shortSummary: null,
    ingestedAt: item.ingestedAt,
    sentAt: null,
    operationalPriority: item.operationalPriority,
  }
}

/** Adapt a key event from geo summary -> CategoryIntelItem stub. */
export function adaptKeyEvent(event: {
  title: string
  severity: string
  category: string
  timestamp: string
}): CategoryIntelItem {
  return {
    id: `key-event-${event.title.slice(0, 20).replace(/\s+/g, '-')}-${event.timestamp}`,
    title: event.title,
    severity: event.severity,
    category: event.category,
    eventType: null,
    sourceKey: null,
    confidence: null,
    geoScope: null,
    shortSummary: null,
    ingestedAt: event.timestamp,
    sentAt: null,
    operationalPriority: null,
  }
}
