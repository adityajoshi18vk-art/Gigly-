"use client";

import { ReactNode } from "react";

/**
 * SpatialWrapper
 *
 * Previously applied a 3D perspective transform (rotateX, z-shift) on scroll
 * that caused layout jitter and rendering artifacts.
 *
 * Now a clean passthrough wrapper. Kept as a named export so existing imports
 * in layout.tsx don't break. Can be removed entirely in a future cleanup pass.
 */
export function SpatialWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
