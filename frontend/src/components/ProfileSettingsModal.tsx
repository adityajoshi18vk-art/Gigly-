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
import { CheckCircle2, X, Loader2, ShieldCheck } from "lucide-react";

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

  // Pre-fill from existing profile
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

  // ── GitHub Skill Verification ─────────────────────────────────────────
  const handleVerifySkills = async () => {
    if (!githubUrl.trim() || !account?.address) return;

    // Extract handle from URL or raw handle
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

      // Show success toast
      const skillList = (data.verifiedSkills || []).join(", ");
      setToastMessage(
        skillList
          ? `GitHub analyzed! Verified skills: ${skillList}`
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
      setToastMessage("Profile published to marketplace!");
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

  // Guard: wallet not connected
  if (!account?.address) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-slate-500 mb-4">
            Please connect your wallet first to publish a profile.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      {/* Toast */}
      {showToast && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg border border-emerald-200 mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Display Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riya Sharma"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Professional Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Solidity Engineer"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
          />
        </div>

        {/* Domain */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Domain
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as FreelancerDomain)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-white"
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
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Hourly Rate (USD) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="0"
              min="1"
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Skills (max 6)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Solidity, React, Figma"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              disabled={skills.length >= 6}
            />
            <Button
              variant="outline"
              onClick={handleAddSkills}
              disabled={skills.length >= 6 || !skillsInput.trim()}
              className="text-xs h-9 px-3"
            >
              Add
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="default" className="font-medium text-[11px] px-2 gap-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-0.5 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="Tell clients about your experience..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
          />
          <p className="text-xs text-slate-400 text-right mt-0.5">
            {bio.length}/280
          </p>
        </div>

        {/* Portfolio URL */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Portfolio URL
          </label>
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourportfolio.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
          />
        </div>

        {/* GitHub URL + Verify Button */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            GitHub URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/yourname"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            />
            <Button
              variant="outline"
              onClick={handleVerifySkills}
              disabled={!githubUrl.trim() || isVerifying}
              className="text-xs h-9 px-3 gap-1.5 shrink-0"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" />
                  Verify Skills
                </>
              )}
            </Button>
          </div>
          {verifyError && (
            <p className="text-xs text-rose-500 mt-1">{verifyError}</p>
          )}

          {/* Verified Skills Display */}
          {verifiedSkills.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">
                GitHub-verified skills:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {verifiedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="flex items-start gap-2 bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-100 mt-4">
          <p className="text-sm">{saveError}</p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
        <Button variant="ghost" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid || isSaving}>
          {isSaving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </Modal>
  );
}
