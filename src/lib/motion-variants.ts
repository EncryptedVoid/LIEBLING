import type { Variants, Transition } from "motion/react";

// ═══════════════════════════════════════════════════
// SHARED TRANSITIONS
// ═══════════════════════════════════════════════════

export const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
  mass: 0.8,
};

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
  mass: 0.6,
};

export const easeOut: Transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

// ═══════════════════════════════════════════════════
// PAGE TRANSITIONS
// ═══════════════════════════════════════════════════

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransitionConfig: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

// ═══════════════════════════════════════════════════
// FADE VARIANTS
// ═══════════════════════════════════════════════════

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export const fadeDown: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
};

// ═══════════════════════════════════════════════════
// STAGGER CONTAINER + CHILDREN
// ═══════════════════════════════════════════════════

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const staggerItemScale: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ═══════════════════════════════════════════════════
// LIST ITEM (for AnimatePresence)
// ═══════════════════════════════════════════════════

export const listItem: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: { duration: 0.2 },
  },
};

// ═══════════════════════════════════════════════════
// MODAL / DIALOG
// ═══════════════════════════════════════════════════

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 5,
    transition: { duration: 0.15 },
  },
};

// ═══════════════════════════════════════════════════
// SLIDE VARIANTS (for carousels, panels)
// ═══════════════════════════════════════════════════

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
};

// ═══════════════════════════════════════════════════
// SCROLL REVEAL (for marketing pages)
// ═══════════════════════════════════════════════════

export const scrollReveal: Variants = {
  initial: { opacity: 0, y: 40 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const scrollRevealStagger: Variants = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ═══════════════════════════════════════════════════
// HOVER / TAP (for interactive elements)
// ═══════════════════════════════════════════════════

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};

export const hoverScale = {
  whileHover: { scale: 1.03, transition: { duration: 0.2 } },
  whileTap: { scale: 0.97 },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: "0 0 30px var(--glow-strong)",
    transition: { duration: 0.3 },
  },
};