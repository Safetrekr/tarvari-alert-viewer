/**
 * HubCenterGlyph -- Tarva star at the center of the capsule ring.
 *
 * Displays the Tarva star SVG in ember orange with a breathing
 * glow animation. The CSS breathing animation is defined in atrium.css.
 *
 * @module hub-center-glyph
 * @see WS-1.2 Section 4.8
 */

import { cn } from '@/lib/utils'

export interface HubCenterGlyphProps {
  /** Whether any capsule is selected (affects glow intensity). */
  hasSelection?: boolean
}

/**
 * Tarva star SVG path (from tarva-star.svg), rendered inline
 * so we can control the fill color via CSS variables.
 */
function TarvaStarIcon({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16.71 0.389459L11.62 7.64946C11.45 7.92946 11.45 8.27946 11.62 8.55946L14.76 13.8795C14.9 14.1095 14.64 14.3695 14.41 14.2295L9.08999 11.0795C8.80999 10.9095 8.45999 10.9095 8.17999 11.0795L0.749992 16.3395C0.519992 16.4795 0.259994 16.2195 0.399994 15.9895L5.66 8.55946C5.83 8.27946 5.83 7.92946 5.66 7.64946L2.50999 2.32946C2.36999 2.09946 2.62999 1.83946 2.85999 1.97946L8.17999 5.12946C8.45999 5.29946 8.80999 5.29946 9.08999 5.12946L16.36 0.0394587C16.59 -0.100541 16.85 0.159459 16.71 0.389459Z"
        fill="currentColor"
      />
    </svg>
  )
}

export { TarvaStarIcon }

export function HubCenterGlyph({
  hasSelection = false,
}: HubCenterGlyphProps) {
  return (
    <div
      className={cn(
        'hub-center-glyph absolute flex items-center justify-center',
        hasSelection && 'opacity-60',
      )}
      style={{
        left: 420 - 32,
        top: 420 - 32,
        width: 64,
        height: 64,
      }}
    >
      <TarvaStarIcon
        size={28}
        className="text-[var(--color-ember)]"
      />
    </div>
  )
}
