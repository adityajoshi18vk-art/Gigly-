"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export function StarryBackground() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Spring to smooth out mouse movement
  const mouseX = useSpring(0, { damping: 40, stiffness: 60, mass: 1 });
  const mouseY = useSpring(0, { damping: 40, stiffness: 60, mass: 1 });

  // Map mouse position to an angle for the light beams to tilt
  // The beams will lean away from the mouse, creating a 3D perspective
  const beamRotation = useTransform(mouseX, 
    [0, typeof window !== 'undefined' ? window.innerWidth : 1000], 
    [-15, 15] // degrees
  );

  // Map mouse position to shift the beams slightly left/right (parallax)
  const beamX = useTransform(mouseX, 
    [0, typeof window !== 'undefined' ? window.innerWidth : 1000], 
    [-50, 50] // pixels
  );

  useEffect(() => {
    setIsMounted(true);
    
    // Set initial position to center safely
    mouseX.set(window.innerWidth / 2);
    mouseY.set(window.innerHeight / 2);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (!isMounted) return <div className="fixed inset-0 z-0 bg-black" />;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      
      {/* 
        1. Ambient Glow 
        A very faint base glow at the bottom to give the scene atmosphere
      */}
      <div className="absolute bottom-0 w-full h-[50vh] bg-gradient-to-t from-sky-900/10 to-transparent pointer-events-none" />

      {/* 
        2. The Monolith Horizon Line
        Extremely sharp and minimal
      */}
      <div className="absolute bottom-[10%] w-full flex items-center justify-center">
        {/* Deep, wide blur */}
        <div className="absolute w-full h-[4px] bg-sky-500/50 blur-[8px]" />
        {/* Core razor line */}
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80" />
      </div>

      {/* 
        3. Interactive Point Light on the Horizon
        This tracks the mouse X coordinate along the horizon line
      */}
      <motion.div 
        className="absolute bottom-[10%] w-[200px] h-[4px] bg-cyan-400 blur-[4px] rounded-full"
        style={{
          x: mouseX,
          translateX: '-50%', // center it directly under the mouse
        }}
      />
      
      <motion.div 
        className="absolute bottom-[10%] w-[100px] h-[100px] bg-cyan-400/20 blur-[30px] rounded-full"
        style={{
          x: mouseX,
          translateX: '-50%', 
          translateY: '50%',
        }}
      />

      {/* 
        4. Interactive Vertical Light Beams
        These beams shift and tilt dynamically based on the user's cursor
      */}
      <motion.div 
        className="absolute bottom-[10%] left-0 w-full h-[90vh] origin-bottom will-change-transform"
        style={{ 
          rotate: beamRotation,
          x: beamX
        }}
      >
        {/* Beam 1 - Left */}
        <div className="absolute left-[20%] bottom-0 w-[1px] h-full bg-gradient-to-t from-cyan-400/40 to-transparent" />
        <div className="absolute left-[20%] bottom-0 w-[40px] ml-[-20px] h-[60%] bg-gradient-to-t from-cyan-500/10 to-transparent blur-[10px]" />

        {/* Beam 2 - Center-Left */}
        <div className="absolute left-[40%] bottom-0 w-[1px] h-full bg-gradient-to-t from-cyan-300/60 to-transparent" />
        <div className="absolute left-[40%] bottom-0 w-[60px] ml-[-30px] h-[80%] bg-gradient-to-t from-cyan-400/15 to-transparent blur-[15px]" />

        {/* Beam 3 - Center-Right */}
        <div className="absolute left-[65%] bottom-0 w-[1px] h-[70%] bg-gradient-to-t from-cyan-400/30 to-transparent" />
        
        {/* Beam 4 - Right */}
        <div className="absolute left-[85%] bottom-0 w-[1px] h-[90%] bg-gradient-to-t from-cyan-500/50 to-transparent" />
        <div className="absolute left-[85%] bottom-0 w-[50px] ml-[-25px] h-[70%] bg-gradient-to-t from-cyan-500/10 to-transparent blur-[12px]" />
      </motion.div>

      {/* 
        5. Faint Grid (Perspective)
        Adds to the 3D space effect
      */}
      <div 
        className="absolute bottom-0 w-full h-[50vh] opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to top, #ffffff 1px, transparent 1px)',
          backgroundSize: '10vw 10vh',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />
      
    </div>
  );
}
