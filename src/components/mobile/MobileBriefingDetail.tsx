'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Shield, Eye, CloudRain, MapPin } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useDigestEvidence } from '@/hooks/use-digests'
import {
  THREAT_LEVEL_COLORS,
  RISK_TREND_CONFIG,
  ACTION_PRIORITY_CONFIG,
  type DigestResponse,
  type ThreatVectorScore,
  type KeyEvent,
  type ActionItem,
} from '@/lib/interfaces/digest'
import { relativeTimeAgo } from '@/lib/time-utils'

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

function SectionHeader({ label }: { label: string }) {
  return (
    <h4
      style={{
        margin: '0 0 8px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.10em',
        color: 'rgba(255,255,255,0.35)',
      }}
    >
      {label}
    </h4>
  )
}

// ---------------------------------------------------------------------------
// Threat vector row
// ---------------------------------------------------------------------------

function ThreatVectorRow({ v }: { v: ThreatVectorScore }) {
  const color = THREAT_LEVEL_COLORS[v.level]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 48 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {v.level}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.75)',
            textTransform: 'capitalize',
            marginBottom: 2,
          }}
        >
          {v.vector}
          {v.alert_count > 0 && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>
              {v.alert_count} alert{v.alert_count > 1 ? 's' : ''}
            </span>
          )}
          {v.highest_priority && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9,
                fontWeight: 700,
                color: v.highest_priority === 'P1' ? '#ef4444' : '#f97316',
              }}
            >
              {v.highest_priority}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.5,
          }}
        >
          {v.summary}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Key event row
// ---------------------------------------------------------------------------

function KeyEventRow({ e }: { e: KeyEvent }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.75)',
            flex: 1,
          }}
        >
          {e.title}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '1px 4px',
            borderRadius: 3,
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          {e.category}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.5,
        }}
      >
        {e.brief}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Action item row
// ---------------------------------------------------------------------------

function ActionItemRow({ a }: { a: ActionItem }) {
  const pConfig = ACTION_PRIORITY_CONFIG[a.priority]
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 8,
          fontWeight: 700,
          color: pConfig.color,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '2px 5px',
          borderRadius: 3,
          background: `${pConfig.color}15`,
          border: `1px solid ${pConfig.color}30`,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {pConfig.label}
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.5,
          }}
        >
          {a.action}
        </p>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          {a.responsible}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main detail component
// ---------------------------------------------------------------------------

export interface MobileBriefingDetailProps {
  readonly digest: DigestResponse
}

export function MobileBriefingDetail({ digest }: MobileBriefingDetailProps) {
  const [showEvidence, setShowEvidence] = useState(false)
  const { data: evidenceData } = useDigestEvidence(showEvidence ? digest.id : null)

  const c = digest.digest_content
  const threatColor = THREAT_LEVEL_COLORS[digest.threat_level]
  const trend = c.risk_trend
  const trendConfig = trend ? RISK_TREND_CONFIG[trend] : null
  const TrendIcon = trend === 'increasing' ? TrendingUp : trend === 'decreasing' ? TrendingDown : Minus

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 4,
              background: `${threatColor}18`,
              border: `1px solid ${threatColor}35`,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: threatColor,
            }}
          >
            <Shield size={11} />
            {digest.threat_level}
          </span>

          <span
            style={{
              padding: '3px 6px',
              borderRadius: 4,
              background: 'rgba(100,180,220,0.08)',
              border: '1px solid rgba(100,180,220,0.20)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(100,180,220,0.7)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {digest.period}
          </span>

          {trendConfig && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendIcon size={11} style={{ color: trendConfig.color }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 9,
                  fontWeight: 600,
                  color: trendConfig.color,
                  letterSpacing: '0.06em',
                }}
              >
                {trendConfig.label}
              </span>
            </div>
          )}

          <span style={{ flex: 1 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            {relativeTimeAgo(digest.created_at)}
          </span>
        </div>

        {/* City / Country / Date */}
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 16,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.3,
          }}
        >
          <MapPin size={14} style={{ marginRight: 6, verticalAlign: -2, color: 'rgba(255,255,255,0.4)' }} />
          {digest.city}
          {digest.country && (
            <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}> · {digest.country}</span>
          )}
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            marginTop: 4,
            display: 'block',
          }}
        >
          {digest.trip_date}
        </span>
      </div>

      {/* Executive Summary */}
      <section>
        <SectionHeader label="Executive Summary" />
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.65,
          }}
        >
          {c.executive_summary}
        </p>
      </section>

      {/* Threat Vectors */}
      {c.threat_vectors && c.threat_vectors.length > 0 && (
        <section>
          <SectionHeader label="Threat Vectors" />
          {c.threat_vectors.map((v, i) => (
            <ThreatVectorRow key={`${v.vector}-${i}`} v={v} />
          ))}
        </section>
      )}

      {/* Key Events */}
      {c.key_events && c.key_events.length > 0 && (
        <section>
          <SectionHeader label="Key Events" />
          {c.key_events.map((e, i) => (
            <KeyEventRow key={`${e.title}-${i}`} e={e} />
          ))}
        </section>
      )}

      {/* City Situation */}
      {c.city_situation && (
        <section>
          <SectionHeader label="City Situation" />
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}
          >
            {c.city_situation}
          </p>
        </section>
      )}

      {/* Country Context */}
      {c.country_context && (
        <section>
          <SectionHeader label="Country Context" />
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
            }}
          >
            {c.country_context}
          </p>
        </section>
      )}

      {/* Weather Outlook */}
      {c.weather_outlook && (
        <section>
          <SectionHeader label="Weather Outlook" />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <CloudRain size={14} style={{ color: 'rgba(100,180,220,0.5)', flexShrink: 0, marginTop: 2 }} />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
              }}
            >
              {c.weather_outlook}
            </p>
          </div>
        </section>
      )}

      {/* Recommended Actions */}
      {c.recommended_actions.length > 0 && (
        <section>
          <SectionHeader label="Recommended Actions" />
          {c.recommended_actions.map((a, i) => (
            <ActionItemRow key={`${a.action.slice(0, 20)}-${i}`} a={a} />
          ))}
        </section>
      )}

      {/* Watch Items */}
      {c.watch_items && c.watch_items.length > 0 && (
        <section>
          <SectionHeader label="Watch Items" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.watch_items.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '6px 0',
                }}
              >
                <Eye size={11} style={{ color: 'rgba(255,255,255,0.25)', marginTop: 2, flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Cities */}
      {c.upcoming_cities_preview.length > 0 && (
        <section>
          <SectionHeader label="Upcoming Cities" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {c.upcoming_cities_preview.map((city, i) => {
              const cityColor = city.threat_level ? THREAT_LEVEL_COLORS[city.threat_level] : '#6b7280'
              return (
                <div
                  key={`${city.city}-${i}`}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: cityColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {city.city}
                    </span>
                    {city.country && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}> · {city.country}</span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    {city.visit_date}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

      {/* Evidence toggle */}
      <section>
        <button
          type="button"
          onClick={() => setShowEvidence((v) => !v)}
          style={{
            width: '100%',
            height: 40,
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.06)',
            background: showEvidence ? 'rgba(100,180,220,0.06)' : 'rgba(255,255,255,0.03)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: showEvidence ? 'rgba(100,180,220,0.7)' : 'rgba(255,255,255,0.35)',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Evidence Chain ({showEvidence ? 'Hide' : 'Show'})
        </button>

        <AnimatePresence>
          {showEvidence && evidenceData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.25)',
                    marginBottom: 4,
                  }}
                >
                  {evidenceData.count} source{evidenceData.count !== 1 ? 's' : ''} referenced
                </span>
                {evidenceData.evidence.map((e) => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 8,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'rgba(100,180,220,0.5)',
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: 'rgba(100,180,220,0.08)',
                      }}
                    >
                      {e.source_type}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.35)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                      }}
                    >
                      {e.source_id.slice(0, 8)}…
                    </span>
                    {e.relevance && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.25)',
                        }}
                      >
                        {e.relevance}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Metadata */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          paddingTop: 4,
        }}
      >
        <MetaPill label="Generated by" value={digest.generated_by} />
        <MetaPill label="Model" value={digest.model_used} />
        <MetaPill label="Status" value={digest.status} />
      </div>
    </div>
  )
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 8,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.25)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
