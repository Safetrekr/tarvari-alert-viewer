import { useState, useEffect, useRef } from 'react';

// src/motion/tokens.ts
var DURATION = {
  /** Instant - no perceptible animation (0ms) */
  instant: 0,
  /** Fast - micro-interactions, hover states (150ms) */
  fast: 150,
  /** Normal - standard transitions (250ms) */
  normal: 250,
  /** Slow - emphasis, attention (350ms) */
  slow: 350,
  /** Slower - large movements, page transitions (500ms) */
  slower: 500
};
var EASING = {
  /** Accelerate - start slow, end fast */
  in: "cubic-bezier(0.4, 0, 1, 1)",
  /** Decelerate - start fast, end slow (most common) */
  out: "cubic-bezier(0, 0, 0.2, 1)",
  /** Accelerate then decelerate */
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Overshoot for playful interactions */
  bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Springy motion */
  spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
};
var DISTANCE = {
  /** Extra small - subtle shifts (4px) */
  xs: 4,
  /** Small - minor movements (8px) */
  sm: 8,
  /** Medium - standard slide distance (16px) */
  md: 16,
  /** Large - prominent movements (24px) */
  lg: 24,
  /** Extra large - dramatic movements (32px) */
  xl: 32
};
var SCALE = {
  /** Small - subtle scale (0.95) */
  sm: 0.95,
  /** Medium - noticeable scale (0.9) */
  md: 0.9,
  /** Large - dramatic scale (0.85) */
  lg: 0.85
};
var OPACITY = {
  hidden: 0,
  dimmed: 0.5,
  visible: 1
};
var ANIMATION_PRESETS = {
  fadeIn: {
    opacity: [0, 1],
    duration: DURATION.normal,
    easing: EASING.out
  },
  fadeOut: {
    opacity: [1, 0],
    duration: DURATION.normal,
    easing: EASING.out
  },
  slideUp: {
    opacity: [0, 1],
    translateY: [DISTANCE.md, 0],
    duration: DURATION.normal,
    easing: EASING.out
  },
  slideDown: {
    opacity: [0, 1],
    translateY: [-DISTANCE.md, 0],
    duration: DURATION.normal,
    easing: EASING.out
  },
  scaleIn: {
    opacity: [0, 1],
    scale: [SCALE.sm, 1],
    duration: DURATION.normal,
    easing: EASING.spring
  },
  scaleOut: {
    opacity: [1, 0],
    scale: [1, SCALE.sm],
    duration: DURATION.fast,
    easing: EASING.in
  }
};
var MOTION = {
  duration: DURATION,
  easing: EASING,
  distance: DISTANCE,
  scale: SCALE,
  opacity: OPACITY
};
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);
  return prefersReducedMotion;
}
function getReducedMotionSSR() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function useEntranceAnimation(options = {}) {
  const {
    preset = "fadeIn",
    delay = 0,
    duration = DURATION.normal,
    animateOnMount = true
  } = options;
  const ref = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const getInitialStyle = () => {
    if (prefersReducedMotion || hasAnimated) {
      return {
        opacity: 1,
        transform: "none"
      };
    }
    switch (preset) {
      case "fadeIn":
        return { opacity: 0 };
      case "slideUp":
        return { opacity: 0, transform: `translateY(${DISTANCE.md}px)` };
      case "slideDown":
        return { opacity: 0, transform: `translateY(-${DISTANCE.md}px)` };
      case "scaleIn":
        return { opacity: 0, transform: "scale(0.95)" };
      default:
        return { opacity: 0 };
    }
  };
  const getAnimatingStyle = () => {
    return {
      opacity: 1,
      transform: "translateY(0) scale(1)",
      transition: `opacity ${duration}ms ${EASING.out}, transform ${duration}ms ${EASING.out}`,
      transitionDelay: `${delay}ms`
    };
  };
  const triggerAnimation = () => {
    if (prefersReducedMotion) {
      setHasAnimated(true);
      return;
    }
    setIsAnimating(true);
    const totalDuration = duration + delay;
    setTimeout(() => {
      setIsAnimating(false);
      setHasAnimated(true);
    }, totalDuration);
  };
  useEffect(() => {
    if (animateOnMount && !hasAnimated) {
      const timer = setTimeout(triggerAnimation, 10);
      return () => clearTimeout(timer);
    }
  }, [animateOnMount, hasAnimated, prefersReducedMotion, duration, delay]);
  return {
    ref,
    style: isAnimating ? getAnimatingStyle() : getInitialStyle(),
    isAnimating,
    hasAnimated,
    triggerAnimation
  };
}

export { ANIMATION_PRESETS, DISTANCE, DURATION, EASING, MOTION, OPACITY, SCALE, getReducedMotionSSR, useEntranceAnimation, useReducedMotion };
//# sourceMappingURL=chunk-37DUMHLB.js.map
//# sourceMappingURL=chunk-37DUMHLB.js.map