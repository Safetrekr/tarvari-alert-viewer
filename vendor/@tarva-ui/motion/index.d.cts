import { RefObject } from 'react';

/**
 * Motion System Tokens
 *
 * Ported from frontend-v2 motion system.
 * These constants are used for programmatic animations.
 */
/**
 * Duration constants in milliseconds
 */
declare const DURATION: {
    /** Instant - no perceptible animation (0ms) */
    readonly instant: 0;
    /** Fast - micro-interactions, hover states (150ms) */
    readonly fast: 150;
    /** Normal - standard transitions (250ms) */
    readonly normal: 250;
    /** Slow - emphasis, attention (350ms) */
    readonly slow: 350;
    /** Slower - large movements, page transitions (500ms) */
    readonly slower: 500;
};
/**
 * Easing functions for natural motion
 */
declare const EASING: {
    /** Accelerate - start slow, end fast */
    readonly in: "cubic-bezier(0.4, 0, 1, 1)";
    /** Decelerate - start fast, end slow (most common) */
    readonly out: "cubic-bezier(0, 0, 0.2, 1)";
    /** Accelerate then decelerate */
    readonly inOut: "cubic-bezier(0.4, 0, 0.2, 1)";
    /** Overshoot for playful interactions */
    readonly bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)";
    /** Springy motion */
    readonly spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
};
/**
 * Translation distances in pixels
 */
declare const DISTANCE: {
    /** Extra small - subtle shifts (4px) */
    readonly xs: 4;
    /** Small - minor movements (8px) */
    readonly sm: 8;
    /** Medium - standard slide distance (16px) */
    readonly md: 16;
    /** Large - prominent movements (24px) */
    readonly lg: 24;
    /** Extra large - dramatic movements (32px) */
    readonly xl: 32;
};
/**
 * Scale factors for zoom effects
 */
declare const SCALE: {
    /** Small - subtle scale (0.95) */
    readonly sm: 0.95;
    /** Medium - noticeable scale (0.9) */
    readonly md: 0.9;
    /** Large - dramatic scale (0.85) */
    readonly lg: 0.85;
};
/**
 * Opacity values
 */
declare const OPACITY: {
    readonly hidden: 0;
    readonly dimmed: 0.5;
    readonly visible: 1;
};
/**
 * Pre-configured animation presets
 */
declare const ANIMATION_PRESETS: {
    readonly fadeIn: {
        readonly opacity: readonly [0, 1];
        readonly duration: 250;
        readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
    };
    readonly fadeOut: {
        readonly opacity: readonly [1, 0];
        readonly duration: 250;
        readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
    };
    readonly slideUp: {
        readonly opacity: readonly [0, 1];
        readonly translateY: readonly [16, 0];
        readonly duration: 250;
        readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
    };
    readonly slideDown: {
        readonly opacity: readonly [0, 1];
        readonly translateY: readonly [number, 0];
        readonly duration: 250;
        readonly easing: "cubic-bezier(0, 0, 0.2, 1)";
    };
    readonly scaleIn: {
        readonly opacity: readonly [0, 1];
        readonly scale: readonly [0.95, 1];
        readonly duration: 250;
        readonly easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    };
    readonly scaleOut: {
        readonly opacity: readonly [1, 0];
        readonly scale: readonly [1, 0.95];
        readonly duration: 150;
        readonly easing: "cubic-bezier(0.4, 0, 1, 1)";
    };
};
/**
 * Combined motion object for convenient imports
 */
declare const MOTION: {
    readonly duration: {
        /** Instant - no perceptible animation (0ms) */
        readonly instant: 0;
        /** Fast - micro-interactions, hover states (150ms) */
        readonly fast: 150;
        /** Normal - standard transitions (250ms) */
        readonly normal: 250;
        /** Slow - emphasis, attention (350ms) */
        readonly slow: 350;
        /** Slower - large movements, page transitions (500ms) */
        readonly slower: 500;
    };
    readonly easing: {
        /** Accelerate - start slow, end fast */
        readonly in: "cubic-bezier(0.4, 0, 1, 1)";
        /** Decelerate - start fast, end slow (most common) */
        readonly out: "cubic-bezier(0, 0, 0.2, 1)";
        /** Accelerate then decelerate */
        readonly inOut: "cubic-bezier(0.4, 0, 0.2, 1)";
        /** Overshoot for playful interactions */
        readonly bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)";
        /** Springy motion */
        readonly spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    };
    readonly distance: {
        /** Extra small - subtle shifts (4px) */
        readonly xs: 4;
        /** Small - minor movements (8px) */
        readonly sm: 8;
        /** Medium - standard slide distance (16px) */
        readonly md: 16;
        /** Large - prominent movements (24px) */
        readonly lg: 24;
        /** Extra large - dramatic movements (32px) */
        readonly xl: 32;
    };
    readonly scale: {
        /** Small - subtle scale (0.95) */
        readonly sm: 0.95;
        /** Medium - noticeable scale (0.9) */
        readonly md: 0.9;
        /** Large - dramatic scale (0.85) */
        readonly lg: 0.85;
    };
    readonly opacity: {
        readonly hidden: 0;
        readonly dimmed: 0.5;
        readonly visible: 1;
    };
};
type Duration = keyof typeof DURATION;
type Easing = keyof typeof EASING;
type Distance = keyof typeof DISTANCE;
type Scale = keyof typeof SCALE;
type AnimationPreset$1 = keyof typeof ANIMATION_PRESETS;

/**
 * Hook to detect user's reduced motion preference.
 *
 * Respects the `prefers-reduced-motion` media query.
 * Returns `true` if the user prefers reduced motion.
 *
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const prefersReducedMotion = useReducedMotion();
 *
 *   return (
 *     <div
 *       style={{
 *         transition: prefersReducedMotion ? 'none' : 'transform 0.3s ease',
 *       }}
 *     >
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
declare function useReducedMotion(): boolean;
/**
 * Get reduced motion preference synchronously.
 * Useful for SSR where the hook can't be used.
 *
 * Returns `false` on the server (optimistic for animations).
 */
declare function getReducedMotionSSR(): boolean;

type AnimationPreset = 'fadeIn' | 'slideUp' | 'slideDown' | 'scaleIn';
interface EntranceAnimationOptions {
    /**
     * Animation preset to use
     * @default 'fadeIn'
     */
    preset?: AnimationPreset;
    /**
     * Delay before animation starts (ms)
     * @default 0
     */
    delay?: number;
    /**
     * Duration override (ms)
     * @default DURATION.normal (250ms)
     */
    duration?: number;
    /**
     * Whether to trigger animation on mount
     * @default true
     */
    animateOnMount?: boolean;
}
interface EntranceAnimationReturn<T extends HTMLElement> {
    /** Ref to attach to the animated element */
    ref: RefObject<T | null>;
    /** CSS styles to apply to the element */
    style: React.CSSProperties;
    /** Whether currently animating */
    isAnimating: boolean;
    /** Whether animation has completed */
    hasAnimated: boolean;
    /** Manually trigger the animation */
    triggerAnimation: () => void;
}
/**
 * Hook for entrance animations with reduced motion support.
 *
 * Provides CSS-based animations that respect user preferences.
 *
 * @example
 * ```tsx
 * function Card() {
 *   const { ref, style, hasAnimated } = useEntranceAnimation<HTMLDivElement>({
 *     preset: 'slideUp',
 *     delay: 100,
 *   });
 *
 *   return (
 *     <div ref={ref} style={style}>
 *       {hasAnimated ? 'Visible!' : 'Animating...'}
 *     </div>
 *   );
 * }
 * ```
 */
declare function useEntranceAnimation<T extends HTMLElement = HTMLDivElement>(options?: EntranceAnimationOptions): EntranceAnimationReturn<T>;

export { ANIMATION_PRESETS, type AnimationPreset$1 as AnimationPreset, DISTANCE, DURATION, type Distance, type Duration, EASING, type Easing, MOTION, OPACITY, SCALE, type Scale, getReducedMotionSSR, useEntranceAnimation, useReducedMotion };
