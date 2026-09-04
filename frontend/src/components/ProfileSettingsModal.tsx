"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  saveFreelancerProfile,
  getFreelancerProfile,
  getInitials,
  type FreelancerDomain,
  type FreelancerProfile,
} from "@/lib/freelancerRegistry";
import { CheckCircle2, X, Loader2, ShieldCheck, Code2 } from "lucide-react";

const DOMAIN_OPTIONS: FreelancerDomain[] = [
  "Smart Contracts",
  "Frontend",
  "Backend",
  "Auditing",
  "UI/UX",
  "Other",
];

export interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  onSaved,
}: ProfileSettingsModalProps) {
  const account = useActiveAccount();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState<FreelancerDomain>("Frontend");
  const [hourlyRate, setHourlyRate] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Verified skills state
  const [verifiedSkills, setVerifiedSkills] = useState<string[]>([]);
  const [skillVerificationHash, setSkillVerificationHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    if (!isOpen || !account?.address) return;
    (async () => {
      const existing = await getFreelancerProfile(account.address);
      if (existing) {
        setName(existing.name);
        setTitle(existing.title);
        setDomain(existing.domain);
        setHourlyRate(String(existing.hourlyRate));
        setSkills(existing.skills);
        setSkillsInput("");
        setBio(existing.bio);
        setPortfolioUrl(existing.portfolioUrl || "");
        setGithubUrl(existing.githubUrl || "");
        setVerifiedSkills(existing.verifiedSkills || []);
        setSkillVerificationHash(existing.skillVerificationHash || "");
      }
    })();
  }, [isOpen, account?.address]);

  const handleAddSkills = () => {
    if (!skillsInput.trim()) return;
    const newSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !skills.includes(s));
    setSkills((prev) => [...prev, ...newSkills].slice(0, 6));
    setSkillsInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkills();
    }
  };

  const handleVerifySkills = async () => {
    if (!githubUrl.trim() || !account?.address) return;

    const handle = githubUrl
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "")
      .trim();

    if (!handle) {
      setVerifyError("Enter a valid GitHub URL first");
      return;
    }

    setIsVerifying(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/verify-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubHandle: handle,
          walletAddress: account.address,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }

      const data = await res.json();
      setVerifiedSkills(data.verifiedSkills || []);
      setSkillVerificationHash(data.oracleSignature || "");

      const skillList = (data.verifiedSkills || []).join(", ");
      setToastMessage(
        skillList
          ? `GitHub oracle verified: ${skillList}`
          : "GitHub analyzed! No recognized languages found."
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const isValid = name.trim() && title.trim() && Number(hourlyRate) > 0;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleSubmit = async () => {
    if (!account?.address || !isValid) return;
    setIsSaving(true);
    setSaveError("");

    const profile: FreelancerProfile = {
      address: account.address,
      name: name.trim(),
      title: title.trim(),
      domain,
      hourlyRate: Number(hourlyRate),
      skills,
      verifiedSkills: verifiedSkills.length > 0 ? verifiedSkills : undefined,
      skillVerificationHash: skillVerificationHash || undefined,
      bio: bio.trim(),
      portfolioUrl: portfolioUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      avatarFallback: getInitials(name),
      createdAt: Date.now(),
    };

    try {
      await saveFreelancerProfile(profile);

      setToastMessage("Profile published to decentralized registry!");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setIsSaving(false);
        onSaved?.();
        onClose();
      }, 1500);
    } catch (err) {
      setIsSaving(false);
      setSaveError(
        err instanceof Error ? err.message : "Failed to save profile"
      );
    }
  };

  if (!isOpen) return null;

  if (!account?.address) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Freelancer Profile">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-on-surface-variant text-sm mb-4">
            Please connect your wallet first to publish your profile.
          </p>
          <Button onClick={onClose} variant="primary">Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Freelancer Profile &amp; Verification">
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
            Display Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Satoshi Nakamoto"
            className="glass-input text-sm"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Professional Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Smart Contract &amp; DeFi Architect"
            className="glass-input text-sm"
          />
        </div>

        {/* Domain */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Primary Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as FreelancerDomain)}
            className="glass-input text-sm [&>option]:bg-surface-container [&>option]:text-on-surface"
          >
            {DOMAIN_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Hourly Rate (USDC) <span className="text-error">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-on-surface-variant font-mono text-sm">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0"
              min="1"
              className="glass-input pl-8 text-sm font-mono"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Skills (Max 6)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Solidity, Rust, TypeScript"
              className="glass-input flex-1 text-sm"
              disabled={skills.length >= 6}
            />
            <Button
              variant="outline"
              onClick={handleAddSkills}
              disabled={skills.length >= 6 || !skillsInput.trim()}
              className="text-xs px-3.5 shrink-0"
            >
              Add
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {skills.map((skill) => (
                <Badge key={skill} variant="default" className="font-medium text-[11px] px-2.5 py-1 gap-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-0.5 hover:text-error transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* GitHub Verification */}
        <div className="rounded-xl border border-glass-border bg-glass-subtle p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-accent-light" />
            <label className="text-xs font-semibold uppercase tracking-wider text-accent-light">
              GitHub Skill Verification Oracle
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="glass-input flex-1 text-xs"
            />
            <Button
              variant="outline"
              onClick={handleVerifySkills}
              disabled={!githubUrl.trim() || isVerifying}
              className="text-xs px-3.5 gap-1.5 shrink-0"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Scanning…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-success-light" />
                  Verify Repos
                </>
              )}
            </Button>
          </div>
          {verifyError && (
            <p className="text-xs text-error mt-1">{verifyError}</p>
          )}

          {verifiedSkills.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] text-on-surface-variant mb-1.5">
                Oracle-Verified Languages:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verifiedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-success-light bg-success/15 border border-success/30 rounded-full px-2.5 py-0.5"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="Introduce your background, notable clients, and smart contract expertise..."
            rows={3}
            className="glass-input text-sm resize-none"
          />
          <p className="text-[11px] text-slate-700 text-right mt-1 font-mono font-bold">
            {bio.length}/280
          </p>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
            Portfolio / Case Studies URL
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://portfolio.dev"
            className="glass-input text-sm"
          />
        </div>
      </div>

      {saveError && (
        <div className="bg-error/10 text-error p-3 rounded-xl border border-error/20 text-xs mt-3">
          {saveError}
        </div>
      )}

      <div className="pt-4 flex justify-end gap-2.5 border-t border-glass-border mt-4">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || isSaving} variant="primary" className="px-6 shadow-glow-accent">
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </Modal>
  );
}
