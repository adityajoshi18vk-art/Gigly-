"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  saveClientProfile,
  getClientProfile,
  getClientInitials,
  type ClientProfile,
} from "@/lib/clientRegistry";
import { CheckCircle2, Building2, Briefcase } from "lucide-react";

export interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  isOnboarding?: boolean;
}

const INDUSTRY_OPTIONS = [
  "Technology & Software",
  "Web3 & Blockchain",
  "DeFi & FinTech",
  "E-Commerce & Retail",
  "AI & Data Science",
  "Creative & Media",
  "Healthcare",
  "Other",
];

export function ClientProfileModal({
  isOpen,
  onClose,
  onSaved,
  isOnboarding = false,
}: ClientProfileModalProps) {
  const account = useActiveAccount();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Technology & Software");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!isOpen || !account?.address) return;
    (async () => {
      const existing = await getClientProfile(account.address);
      if (existing) {
        setName(existing.name);
        setCompanyName(existing.companyName || "");
        setIndustry(existing.industry || "Technology & Software");
        setWebsite(existing.website || "");
        setBio(existing.bio || "");
      }
    })();
  }, [isOpen, account?.address]);

  const isValid = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!account?.address || !isValid) return;
    setIsSaving(true);
    setSaveError("");

    const profile: ClientProfile = {
      address: account.address.toLowerCase(),
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      industry,
      website: website.trim() || undefined,
      bio: bio.trim(),
      avatarFallback: getClientInitials(name),
      createdAt: Date.now(),
    };

    try {
      await saveClientProfile(profile);

      setToastMessage("Client profile saved successfully!");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setIsSaving(false);
        onSaved?.();
        onClose();
      }, 1200);
    } catch (err) {
      setIsSaving(false);
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
    }
  };

  if (!isOpen) return null;

  if (!account?.address) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Client Profile">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-on-surface-variant text-sm mb-4">
            Please connect your wallet first to set up your client profile.
          </p>
          <Button onClick={onClose} variant="primary">Close</Button>
        </div>
      </Modal>
    );
  }

  const modalTitle = isOnboarding
    ? "Welcome to Gigly! Set Up Your Hiring Profile"
    : "Client Profile Settings";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      isDismissible={!isOnboarding}
    >
      {/* Onboarding Welcome Banner */}
      {isOnboarding && (
        <div className="bg-accent/10 border border-accent/25 rounded-xl p-3.5 mb-4 text-xs text-on-surface leading-relaxed">
          <p className="font-semibold text-accent-light mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Client Onboarding
          </p>
          <p className="text-on-surface-variant">
            Please provide your name or organization details. Freelancers will see this on escrow contracts and job postings.
          </p>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="flex items-center gap-2 bg-success/15 text-success-light p-3 rounded-xl border border-success/30 mb-4 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p>{toastMessage}</p>
        </div>
      )}

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Client / Rep Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alice Walker"
            className="glass-input text-sm"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Company / Project Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Web3 Labs (Optional)"
            className="glass-input text-sm"
          />
        </div>

        {/* Industry */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Industry / Domain
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="glass-input text-sm"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="bg-slate-900 text-white">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Website / Project Link
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://acme.xyz"
            className="glass-input text-sm"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            About / Organization Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="Describe what you or your team builds and what gigs you usually sponsor..."
            rows={3}
            className="glass-input text-sm resize-none"
          />
          <p className="text-[11px] text-slate-700 text-right mt-1 font-mono font-bold">
            {bio.length}/280
          </p>
        </div>
      </div>

      {saveError && (
        <div className="bg-error/10 text-error p-3 rounded-xl border border-error/20 text-xs mt-3">
          {saveError}
        </div>
      )}

      <div className="pt-4 flex justify-end gap-2.5 border-t border-glass-border mt-4">
        {!isOnboarding && (
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSaving}
          variant="primary"
          className="px-6 shadow-glow-accent"
        >
          {isSaving ? "Publishing Profile..." : isOnboarding ? "Complete Setup & Enter Hub" : "Save Profile"}
        </Button>
      </div>
    </Modal>
  );
}
