"use client";

import { useState, useEffect } from "react";
import { Key, ExternalLink, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ApiKeyBanner() {
  const [isConfigured, setIsConfigured] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [inputKey, setInputKey] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "fe0bc6654c8336f5d5d7d0ed871a7eea";
    const localKey = typeof window !== "undefined" ? localStorage.getItem("gigly_thirdweb_client_id") : null;
    
    const validEnv = envKey && envKey !== "your_thirdweb_client_id_here" && envKey !== "PLACEHOLDER_CLIENT_ID" && envKey.trim().length > 5;
    const validLocal = localKey && localKey.trim().length > 5;

    if (!validEnv && !validLocal) {
      setIsConfigured(false);
    } else {
      setIsConfigured(true);
    }
  }, []);

  const handleSave = () => {
    if (!inputKey.trim()) return;
    localStorage.setItem("gigly_thirdweb_client_id", inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  if (isConfigured) return null;

  return (
    <>
      {/* Sticky Banner */}
      <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm font-semibold z-50 relative">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0 text-white" />
          <span>
            Thirdweb Client ID is missing. Gasless wallet login & contract calls require a free Client ID.
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-surface-container-lowest text-on-surface hover:bg-surface-container px-3.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ml-3 shadow-xs"
        >
          Set Key Now
        </button>
      </div>

      {/* Input Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative z-50 w-full max-w-md rounded-xl bg-surface-container border border-outline-variant p-6 shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container border border-outline-variant text-on-surface flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">Enter Thirdweb Client ID</h3>
                <p className="text-xs text-on-surface-variant">Get a free key from Thirdweb Dashboard</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Client ID Key</label>
              <input
                type="text"
                placeholder="e.g. 8f92a01b..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
              />
              <a
                href="https://thirdweb.com/create-api-key"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <span>Create free API key on Thirdweb</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-outline-variant">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={!inputKey.trim() || savedSuccess}>
                {savedSuccess ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" /> Saved! Reloading…
                  </span>
                ) : (
                  "Save & Activate"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
