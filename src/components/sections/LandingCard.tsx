import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<"div"> {
  delay?: number;
  glass?: boolean;
}

export function Card({ className, children, delay = 0, glass = false, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-xl p-8 transition-all duration-500",
        glass ? "glass-card" : "bg-white border border-slate-100 shadow-premium hover:border-sky-200/50 hover:shadow-2xl hover:shadow-sky-500/5",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
