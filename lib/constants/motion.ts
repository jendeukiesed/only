import type { Transition, Variants } from "framer-motion";

/**
 * Shared Framer Motion primitives — every animated surface in the app
 * (landing sections, marketplace cards, dashboard widgets, the mystery-box
 * reveal) pulls from this file rather than inlining bespoke easing curves,
 * so motion feels like one coherent system instead of a dozen slightly
 * different "smooth" animations.
 */

export const EASE_OUT: Transition["ease"] = [0.16, 1, 0.3, 1]; // "expo-out" — Stripe/Linear signature ease
export const EASE_IN_OUT: Transition["ease"] = [0.65, 0, 0.35, 1];

export const springSnappy: Transition = { type: "spring", stiffness: 400, damping: 30 };
export const springGentle: Transition = { type: "spring", stiffness: 220, damping: 26 };

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } },
};

/** Wrap a list container with this and each child with `fadeInUp` (or
 *  similar) for a staggered reveal — used for marketplace grids, feature
 *  lists, dashboard stat rows. */
export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

/** Card hover lift — subtle, not cartoonish. Spread onto `whileHover`. */
export const hoverLift = {
  y: -4,
  transition: springSnappy,
};

/** The mystery-box unlock reveal: anticipation (brief scale-down + glow
 *  pulse) followed by a satisfying pop-open. Used by
 *  features/mystery-box/components/reveal-animation.tsx in a later stage. */
export const mysteryRevealVariants: Variants = {
  sealed: { scale: 1, rotate: 0 },
  anticipation: {
    scale: [1, 0.96, 1.02, 0.98],
    transition: { duration: 0.6, ease: EASE_IN_OUT },
  },
  revealed: {
    scale: [0.9, 1.05, 1],
    opacity: [0, 1],
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE_IN_OUT } },
};
