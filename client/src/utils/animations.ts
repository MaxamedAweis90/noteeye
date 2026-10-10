import type { Variants, Transition } from 'motion/react';

/**
 * Shared Motion Drop Animations for Noteeye
 * Choreographed two-stage animation:
 * Stage 1: Card drops downward with physics acceleration and fades away.
 * Stage 2: Sibling cards gently and smoothly glide into the vacated slot once the drop completes.
 */

export const cardDropVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    y: 55,
    scale: 0.85,
    rotate: -3,
    transition: {
      duration: 0.28,
      ease: [0.32, 0, 0.67, 0], // accelerating gravity fall
    },
  },
};

export const listRowDropVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: {
    opacity: 0,
    y: 35,
    scale: 0.95,
    transition: {
      duration: 0.25,
      ease: [0.32, 0, 0.67, 0],
    },
  },
};

export const cardLayoutTransition: Transition = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1], // smooth cushioned glide
};
