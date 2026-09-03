"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode } from "react";

export function SpatialWrapper({ children }: { children: ReactNode }) {
  const { scrollYProgress } = useScroll();
  
  // As the user scrolls down the page, we slightly push the layout backward in Z-space
  // and tilt it slightly, creating a global "deep scroll" feeling.
  const z = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 2]);

  return (
    // The outermost wrapper applies the 3D perspective camera to the page
    <div style={{ perspective: "1500px", perspectiveOrigin: "top center" }} className="w-full h-full">
      <motion.div
        style={{
          z,
          rotateX,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full will-change-transform origin-top"
      >
        {children}
      </motion.div>
    </div>
  );
}
