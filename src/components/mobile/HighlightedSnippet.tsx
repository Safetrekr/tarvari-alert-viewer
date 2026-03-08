'use client'

/**
 * Parses HTML snippet from PostgreSQL ts_headline (contains <b> tags)
 * and renders highlighted React elements. No dangerouslySetInnerHTML.
 */
export function HighlightedSnippet({
  html,
  style,
}: {
  html: string
  style?: React.CSSProperties
}) {
  // Split on <b>...</b> tags, preserving the content
  const parts = html.split(/(<b>.*?<\/b>)/g)

  return (
    <span style={style}>
      {parts.map((part, i) => {
        const match = part.match(/^<b>(.*?)<\/b>$/)
        if (match) {
          return (
            <mark
              key={i}
              style={{
                color: 'rgba(255, 255, 255, 0.95)',
                background: 'rgba(100, 180, 220, 0.15)',
                borderRadius: 2,
                padding: '0 2px',
              }}
            >
              {match[1]}
            </mark>
          )
        }
        // Strip any remaining HTML tags for safety
        return part.replace(/<[^>]*>/g, '')
      })}
    </span>
  )
}
