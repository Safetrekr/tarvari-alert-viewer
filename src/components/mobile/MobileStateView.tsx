'use client'

import type { UseQueryResult } from '@tanstack/react-query'

export interface MobileStateViewProps {
  query: UseQueryResult<unknown, Error>
  skeletonComponent?: React.ReactNode
  emptyTitle?: string
  emptyMessage?: string
  retryLabel?: string
}

/**
 * Shared loading/error/empty state component for mobile views.
 * Returns null when data is successfully loaded (parent renders its own content).
 */
export function MobileStateView({
  query,
  skeletonComponent,
  emptyTitle = 'No data',
  emptyMessage = 'Nothing to display yet.',
  retryLabel = 'Retry',
}: MobileStateViewProps) {
  if (query.isLoading) {
    if (skeletonComponent) return <>{skeletonComponent}</>
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 12,
        }}
      >
        <div
          style={{
            background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.03))',
            borderRadius: 8,
            padding: '16px 20px',
            textAlign: 'center',
            maxWidth: 280,
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'var(--color-error, #ef4444)',
              marginBottom: 8,
            }}
          >
            {query.error?.message ?? 'Something went wrong'}
          </p>
          <button
            onClick={() => query.refetch()}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 4,
              padding: '8px 16px',
              minWidth: 48,
              minHeight: 48,
              cursor: 'pointer',
            }}
          >
            {retryLabel}
          </button>
        </div>
      </div>
    )
  }

  const isEmpty =
    query.isSuccess &&
    (query.data == null ||
      (Array.isArray(query.data) && query.data.length === 0))

  if (isEmpty) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          gap: 8,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.4)',
            letterSpacing: '0.04em',
          }}
        >
          {emptyTitle}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          {emptyMessage}
        </p>
      </div>
    )
  }

  return null
}
