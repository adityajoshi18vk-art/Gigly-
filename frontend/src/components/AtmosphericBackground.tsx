"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * AtmosphericBackground — High-Performance Interactive Blue Dot Matrix
 *
 * Fixed & Optimized:
 * 1. Mathematically aligns with the 40px body blueprint grid (20px gap = 2 dots per grid cell).
 * 2. High-DPI / Retina crispness with window.devicePixelRatio.
 * 3. Butter-smooth 60 FPS easing (eliminates any jitter / flickering).
 * 4. High-performance rendering (zero expensive shadowBlur lag).
 * 5. Deep, vibrant Hackshastra blue palette (#0052FF, #0DA5F0, #0066EE, #0284C7, #38BDF8).
 * 6. Automatically disabled in portal routes (/client, /freelancer, /admin, /jury) to avoid distraction.
 */

interface Dot {
  x: number;
  y: number;
  activeColor: string;
  baseSize: number;
  maxSize: number;
  intensity: number;       // Current animated intensity 0 -> 1
  targetIntensity: number; // Target based on mouse proximity
  shimmerOffset: number;
  shimmerSpeed: number;
}

const PALETTE = [
  "#0DA5F0", // Hackshastra signature cyan-blue
  "#0052FF", // Deep electric blue
  "#0066EE", // Royal azure
  "#0284C7", // Ocean blue
  "#38BDF8", // Sky highlight
];

export function AtmosphericBackground() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Disable atmospheric dot matrix in client, freelancer, admin, and jury portals
  const isPortal = Boolean(
    pathname?.startsWith("/client") ||
    pathname?.startsWith("/freelancer") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/jury")
  );

  useEffect(() => {
    if (isPortal) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Perfectly aligns with the 40px CSS blueprint grid (exactly 2 dots per cell)
    const GRID_GAP = 20;
    const ACTIVATION_RADIUS = 200;
    const ACTIVATION_RADIUS_SQ = ACTIVATION_RADIUS * ACTIVATION_RADIUS;

    let dots: Dot[] = [];

    const mouse = {
      x: -1000,
      y: -1000,
      active: false,
    };

    const setupCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const newDots: Dot[] = [];
      for (let x = 0; x <= width + GRID_GAP; x += GRID_GAP) {
        for (let y = 0; y <= height + GRID_GAP; y += GRID_GAP) {
          const randomColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
          newDots.push({
            x,
            y,
            activeColor: randomColor,
            baseSize: 1.5,
            maxSize: 3.5 + Math.random() * 1.5,
            intensity: 0,
            targetIntensity: 0,
            shimmerOffset: Math.random() * Math.PI * 2,
            shimmerSpeed: 0.04 + Math.random() * 0.05,
          });
        }
      }
      dots = newDots;
    };

    setupCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mx = mouse.x;
      const my = mouse.y;
      const isMouseActive = mouse.active;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];

        // 1. Calculate target intensity from mouse distance
        if (isMouseActive) {
          const dx = dot.x - mx;
          const dy = dot.y - my;
          const distSq = dx * dx + dy * dy;

          if (distSq < ACTIVATION_RADIUS_SQ) {
            const dist = Math.sqrt(distSq);
            // Smooth non-linear falloff
            dot.targetIntensity = Math.pow(1 - dist / ACTIVATION_RADIUS, 1.2);
          } else {
            dot.targetIntensity = 0;
          }
        } else {
          dot.targetIntensity = 0;
        }

        // 2. Butter-smooth easing: smoothly rise when mouse enters, gracefully decay when mouse leaves
        if (dot.targetIntensity > dot.intensity) {
          dot.intensity += (dot.targetIntensity - dot.intensity) * 0.25; // Snappy smooth rise
        } else {
          dot.intensity *= 0.94; // Graceful decay without flickering
        }

        if (dot.intensity < 0.005) {
          dot.intensity = 0;
        }

        // 3. Draw dot based on current intensity
        if (dot.intensity > 0.01) {
          dot.shimmerOffset += dot.shimmerSpeed;
          const shimmer = Math.sin(dot.shimmerOffset) * 0.15 + 0.9;
          const size = dot.baseSize + (dot.maxSize - dot.baseSize) * dot.intensity * shimmer;
          const halfSize = size * 0.5;

          // Subtle soft aura layer (fast, zero lag)
          if (dot.intensity > 0.3) {
            ctx.fillStyle = dot.activeColor;
            ctx.globalAlpha = dot.intensity * 0.25;
            const auraSize = size * 1.8;
            ctx.fillRect(dot.x - auraSize * 0.5, dot.y - auraSize * 0.5, auraSize, auraSize);
          }

          // Sharp deep blue core pixel
          ctx.fillStyle = dot.activeColor;
          ctx.globalAlpha = Math.min(1, dot.intensity * 1.3);
          ctx.fillRect(dot.x - halfSize, dot.y - halfSize, size, size);
        } else {
          // Ambient faint blueprint dot aligned with grid
          ctx.fillStyle = "rgba(186, 210, 235, 0.4)";
          ctx.globalAlpha = 0.6;
          ctx.fillRect(dot.x - 0.75, dot.y - 0.75, 1.5, 1.5);
        }
      }

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPortal]);

  if (isPortal) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
