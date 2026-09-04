import { Suspense } from "react";
import { AuthAndRouting } from "@/components/AuthAndRouting";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-on-surface-variant font-mono text-xs">Loading...</div>}>
        <AuthAndRouting />
      </Suspense>
    </main>
  );
}
