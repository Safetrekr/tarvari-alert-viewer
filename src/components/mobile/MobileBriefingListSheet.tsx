'use client'

import { Shield, FileText } from 'lucide-react'
import { useDigests } from '@/hooks/use-digests'
import { THREAT_LEVEL_COLORS, type DigestResponse } from '@/lib/interfaces/digest'
import { relativeTimeAgo } from '@/lib/time-utils'

export interface MobileBriefingListSheetProps {
  readonly onDigestTap: (digest: DigestResponse) => void
}

/**
 * Scrollable list of past briefings.
 * Opens from "All Briefings" tap in MobileBriefingCard.
 */
export function MobileBriefingListSheet({ onDigestTap }: MobileBriefingListSheetProps) {
  const { data, isLoading } = useDigests({ limit: 30 })

  return (
    <div
      style={{
        padding: '0 var(--space-content-padding, 12px) 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 12,
        }}
      >
        <FileText size={14} style={{ color: 'rgba(100,180,220,0.5)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: 'rgba(255,255,255,0.50)',
          }}
        >
          BRIEFINGS
        </span>
        {data && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 500,
              color: 'rgba(100,180,220,0.5)',
            }}
          >
            {data.total_count} total
          </span>
        )}
      </div>

      {isLoading && (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          Loading briefings…
        </div>
      )}

      {data?.digests.map((d) => (
        <DigestRow key={d.id} digest={d} onTap={onDigestTap} />
      ))}

      {data && data.digests.length === 0 && (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          No briefings available
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Individual digest row
// ---------------------------------------------------------------------------

function DigestRow({
  digest,
  onTap,
}: {
  digest: DigestResponse
  onTap: (d: DigestResponse) => void
}) {
  const threatColor = THREAT_LEVEL_COLORS[digest.threat_level]

  return (
    <button
      type="button"
      onClick={() => onTap(digest)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '12px 10px',
        borderRadius: 6,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Threat dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: threatColor,
          flexShrink: 0,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            {digest.city}
          </span>
          {digest.country && (
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              {digest.country}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(100,180,220,0.5)',
              letterSpacing: '0.06em',
            }}
          >
            {digest.period}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {digest.digest_content.executive_summary}
        </p>
      </div>

      {/* Meta column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: threatColor,
          }}
        >
          {digest.threat_level}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          {relativeTimeAgo(digest.created_at)}
        </span>
      </div>
    </button>
  )
}
