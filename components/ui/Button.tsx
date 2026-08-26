import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary disabled:opacity-50 disabled:pointer-events-none active:scale-98 select-none";
    
    const variants = {
      primary: "bg-brand-primary text-white hover:bg-brand-primaryDark shadow-xs",
      secondary: "bg-slate-100 text-brand-textPrimary hover:bg-slate-200 border border-brand-border",
      outline: "border border-brand-border bg-white hover:bg-slate-50 text-brand-textPrimary shadow-2xs",
      ghost: "hover:bg-slate-100 text-brand-textSecondary hover:text-brand-textPrimary",
    };

    const sizes = {
      sm: "h-7 px-2.5 text-[11px]",
      md: "h-8.5 px-3.5 text-xs",
      lg: "h-9.5 px-4 text-xs font-bold",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
