"use client";
import { motion, useReducedMotion } from "motion/react";

// Animate a decorative rule only: headings and content remain SSR-visible.
export function RevealRule() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="reveal-rule"
      initial={false}
      whileInView={{ scaleX: 1 }}
      style={{ scaleX: reduced ? 1 : 0, transformOrigin: "left" }}
      viewport={{ once: true }}
      transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut" }}
    />
  );
}
