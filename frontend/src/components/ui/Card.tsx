"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";

const Card = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, children, ...props }, ref) => {
    // 3D Tilt Logic
    const x = useMotionValue(0.5); // center is 0.5 (50%)
    const y = useMotionValue(0.5);

    // Spring for smooth return and movement, preventing lag spikes
    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

    // Map mouse position to rotation (tilt angle)
    const rotateX = useTransform(mouseYSpring, [0, 1], [10, -10]); // tilt up/down
    const rotateY = useTransform(mouseXSpring, [0, 1], [-10, 10]); // tilt left/right

    // Dynamic glare effect that follows the cursor
    const mouseXPercent = useTransform(mouseXSpring, v => v * 100);
    const mouseYPercent = useTransform(mouseYSpring, v => v * 100);
    const background = useMotionTemplate`radial-gradient(circle at ${mouseXPercent}% ${mouseYPercent}%, rgba(255,255,255,0.06) 0%, transparent 60%)`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      x.set(mouseX / rect.width);
      y.set(mouseY / rect.height);
    };

    const handleMouseLeave = () => {
      // Return to flat center on leave
      x.set(0.5);
      y.set(0.5);
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, z: -100 }}
        whileInView={{ opacity: 1, z: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative bg-surface-container-lowest border border-outline-variant rounded-xl shadow-level-1 text-on-surface transition-shadow hover:shadow-level-2 group will-change-transform",
          className
        )}
        {...props}
      >
        {/* Subtle dynamic glare overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background }}
        />
        
        {/* 
          Wrapper for children allowing them to pop out in 3D Z-space
        */}
        <div className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
          {children as React.ReactNode}
        </div>
      </motion.div>
    );
  }
);
Card.displayName = "Card";

// The sub-components have varying translateZ values. 
// This creates a physical 3D "stack" effect when the card tilts.

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      style={{ transform: "translateZ(10px)" }}
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
      style={{ transform: "translateZ(30px)" }} // Pops out the most
      className={cn("text-xl font-semibold leading-none tracking-tight text-on-surface transition-transform duration-300", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div 
      ref={ref} 
      style={{ transform: "translateZ(15px)" }}
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
      style={{ transform: "translateZ(20px)" }}
      className={cn("flex items-center p-6 pt-0 transition-transform duration-300", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
