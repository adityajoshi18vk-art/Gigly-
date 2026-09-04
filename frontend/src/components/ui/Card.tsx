"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => {
    // Subtle 3D tilt — gentler than before (max ±4° vs old ±10°)
    const x = useMotionValue(0.5);
    const y = useMotionValue(0.5);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

    const rotateX = useTransform(mouseYSpring, [0, 1], [4, -4]);
    const rotateY = useTransform(mouseXSpring, [0, 1], [-4, 4]);

    // Dynamic glare — violet-tinted instead of white
    const mouseXPercent = useTransform(mouseXSpring, v => v * 100);
    const mouseYPercent = useTransform(mouseYSpring, v => v * 100);
    const background = useMotionTemplate`radial-gradient(circle at ${mouseXPercent}% ${mouseYPercent}%, rgba(139, 92, 246, 0.06) 0%, transparent 60%)`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    };

    const handleMouseLeave = () => {
      x.set(0.5);
      y.set(0.5);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative rounded-2xl border border-glass-border bg-glass-bg-solid backdrop-blur-xl text-on-surface transition-all duration-300 hover:border-glass-border-light hover:shadow-level-2 group will-change-transform",
          className
        )}
        style-bg="var(--glass-bg-solid)"
        {...props}
      >
        {/* Subtle glare overlay — violet tinted */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background }}
        />

        {/* Inner highlight at top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          {children as React.ReactNode}
        </div>
      </motion.div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      style={{ transform: "translateZ(8px)" }}
      className={cn("flex flex-col space-y-1.5 p-6 transition-transform duration-300", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      style={{ transform: "translateZ(20px)" }}
      className={cn("text-lg font-semibold leading-none tracking-tight text-on-surface transition-transform duration-300", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      style={{ transform: "translateZ(10px)" }}
      className={cn("p-6 pt-0 text-on-surface-variant transition-transform duration-300", className)} 
      {...props} 
    />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      style={{ transform: "translateZ(14px)" }}
      className={cn("flex items-center p-6 pt-0 transition-transform duration-300", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
