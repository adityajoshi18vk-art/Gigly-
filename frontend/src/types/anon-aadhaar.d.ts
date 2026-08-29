// Type declarations for @anon-aadhaar packages.
// The upstream @anon-aadhaar/core ships "types": "./src/index.ts" (raw TS source)
// which causes type errors with newer TypeScript versions. These ambient module
// declarations prevent tsc from resolving into the raw source files.

declare module "@anon-aadhaar/react" {
  import { FC, ReactNode } from "react";

  interface AnonAadhaarProviderProps {
    children: ReactNode;
    _useTestAadhaar?: boolean;
    _artifactslinks?: {
      zkey_url: string;
      wasm_url: string;
      vkey_url: string;
    };
  }

  export const AnonAadhaarProvider: FC<AnonAadhaarProviderProps>;

  interface LogInWithAnonAadhaarProps {
    nullifierSeed: number;
    fieldsToReveal?: string[];
    signal?: string;
  }

  export const LogInWithAnonAadhaar: FC<LogInWithAnonAadhaarProps>;

  interface AnonAadhaarState {
    status: "logged-out" | "logging-in" | "logged-in";
    apiVersion?: string;
    pcd?: unknown;
  }

  export function useAnonAadhaar(): [AnonAadhaarState];
}

declare module "@anon-aadhaar/core" {
  // Re-export core types as needed; this prevents tsc from following
  // the package's raw .ts source files.
  export interface AnonAadhaarProof {
    type: string;
    id: string;
    claim: unknown;
    proof: unknown;
  }
}
