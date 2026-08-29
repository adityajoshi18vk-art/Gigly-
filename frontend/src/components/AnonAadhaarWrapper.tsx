"use client";

import { AnonAadhaarProvider } from "@anon-aadhaar/react";

interface AnonAadhaarWrapperProps {
  children: React.ReactNode;
}

export function AnonAadhaarWrapper({ children }: AnonAadhaarWrapperProps) {
  return (
    <AnonAadhaarProvider _useTestAadhaar={true}>
      {children}
    </AnonAadhaarProvider>
  );
}
