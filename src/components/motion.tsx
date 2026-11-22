"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({ delay = 0, y = 24, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...props}
    />
  );
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
};

export function Stagger({ inView = true, ...props }: HTMLMotionProps<"div"> & { inView?: boolean }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      {...(inView ? { whileInView: "show", viewport: { once: true, margin: "-40px" } } : { animate: "show" })}
      {...props}
    />
  );
}

export function StaggerItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={item} {...props} />;
}

export function FadeIn({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      {...props}
    />
  );
}
