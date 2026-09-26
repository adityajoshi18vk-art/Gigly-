"use client";

import { useState, useCallback, useEffect } from "react";

import Link from "next/link";
import { Home, Sparkles, UserCog, RefreshCw } from "lucide-react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { IncomingJobs } from "@/components/IncomingJobs";
import { BrowseGigs } from "@/components/BrowseGigs";
import { PastJobs } from "@/components/PastJobs";
import { clearJobsCache } from "@/lib/useJobs";
import { Earnings } from "@/components/Earnings";
import { DIDTrustCard } from "@/components/DIDTrustCard";
import { Credentials } from "@/components/Credentials";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { Button } from "@/components/ui/Button";
import { usePortalAuth } from "@/lib/usePortalAuth";
import { getFreelancerProfile, type FreelancerProfile } from "@/lib/freelancerRegistry";

export default function FreelancerDashboard() {
  const { account } = usePortalAuth("freelancer");

  const [activeTab, setActiveTab] = useState("Active Jobs");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Profile & Modal State ─────────────────────────────────────────────────
  // `isProfileLoading` is the single source of truth for "check in progress".
  // The modal MUST NOT render while this is true to avoid flashing for
  // returning users whose data is still in-flight from Supabase.
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<FreelancerProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // ── Supabase Profile Check ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // No wallet connected yet — nothing to check.
    if (!account?.address) {
      setIsProfileLoading(false);
      return;
    }

    async function checkProfile() {
      setIsProfileLoading(true);
      try {
        const profile = await getFreelancerProfile(account!.address);
        if (cancelled) return;

        if (!profile || !profile.name?.trim() || !profile.title?.trim()) {
          // NEW USER: profile missing or incomplete — open onboarding modal.
          setExistingProfile(null);
          setIsOnboarding(true);
          setIsProfileModalOpen(true);
        } else {
          // RETURNING USER: cache profile, keep modal closed.
          setExistingProfile(profile);
          setIsOnboarding(false);
          setIsProfileModalOpen(false);
        }
      } catch (err) {
        console.warn("[Gigly] Failed to check freelancer profile:", err);
        // On error, do NOT open the modal — fail silently to avoid spam.
      } finally {
        if (!cancelled) setIsProfileLoading(false);
      }
    }

    checkProfile();
    return () => { cancelled = true; };
  }, [account?.address]);

  // ── Manual "Edit Profile" trigger (bypasses new-user check) ──────────────
  const handleOpenEditProfile = useCallback(() => {
    // Always open modal in edit mode (non-onboarding) when user clicks the button.
    setIsOnboarding(false);
    setIsProfileModalOpen(true);
  }, []);

  // ── On successful save, update local state & close modal ─────────────────
  const handleProfileSaved = useCallback(async () => {
    setIsOnboarding(false);
    setIsProfileModalOpen(false);
    // Re-fetch to keep `existingProfile` in sync with the latest Supabase data.
    if (account?.address) {
      try {
        const updated = await getFreelancerProfile(account.address);
        if (updated) setExistingProfile(updated);
      } catch {
        // Non-critical; local state is already updated by the modal.
      }
    }
  }, [account?.address]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    clearJobsCache();
    setRefreshCounter(c => c + 1);
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  return (
    <div className="min-h-screen py-4 sm:py-6 relative text-on-background">

      {/* Onboarding Notice Banner — only shown while profile is incomplete */}
      {isOnboarding && !isProfileLoading && (
        <div className="mb-6 p-4 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center text-accent-light">
              <UserCog className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface">
                Profile Setup Required
              </p>
              <p className="text-[11px] text-on-surface-variant">
                Complete your profile details to unlock the freelancer dashboard and receive gigs.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsProfileModalOpen(true)}
            className="text-xs shrink-0"
          >
            Resume Setup
          </Button>
        </div>
      )}

      {/* Top Header */}
      <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between surface-card p-4 sm:p-5 rounded-3xl mb-8 shadow-level-1">
        <div className="flex items-center gap-4 px-2">
          <Link href="/">
            <button className="w-10 h-10 rounded-xl bg-glass-light border border-glass-border flex items-center justify-center hover:bg-glass-medium transition-colors text-on-surface-variant hover:text-on-surface">
              <Home className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary-container to-tertiary flex items-center justify-center shadow-glow-secondary text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-on-surface tracking-tight">Freelancer Hub</h1>
            <p className="text-on-surface-variant text-xs font-normal">Manage gigs, verifiable reputation &amp; payouts</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 px-2 flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh on-chain data"
            className="w-10 h-10 rounded-xl bg-glass-light border border-glass-border flex items-center justify-center hover:bg-glass-medium transition-colors text-on-surface-variant hover:text-accent-light disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-accent-light" : ""}`} />
          </button>
          {/* Edit Profile button: always opens in edit (non-onboarding) mode */}
          <Button
            variant="outline"
            onClick={handleOpenEditProfile}
            className="flex items-center gap-2 text-xs font-medium py-2.5 px-4"
          >
            <UserCog className="w-4 h-4" />
            Edit Profile &amp; Verify
          </Button>
          <CustomConnectButton />
        </div>
      </header>

      <Tabs
        tabs={["Active Jobs", "Past Jobs", "Browse Gigs", "Earnings", "Credentials"]}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="mb-8"
      />

      {activeTab === "Active Jobs" && (
        <IncomingJobs
          refreshCounter={refreshCounter}
          onInteractionSuccess={() => { clearJobsCache(); setRefreshCounter(c => c + 1); }}
        />
      )}

      {activeTab === "Past Jobs" && (
        <PastJobs role="freelancer" refreshCounter={refreshCounter} />
      )}

      {activeTab === "Browse Gigs" && (
        <BrowseGigs
          refreshCounter={refreshCounter}
          onInteractionSuccess={() => {
            clearJobsCache();
            setRefreshCounter(c => c + 1);
            setActiveTab("Active Jobs");
          }}
        />
      )}

      {activeTab === "Earnings" && (
        <div className="space-y-6">
          <Earnings />
          <DIDTrustCard />
        </div>
      )}

      {activeTab === "Credentials" && <Credentials />}

      {/*
        ── Modal Gate ──────────────────────────────────────────────────────────
        The modal is intentionally NOT rendered while `isProfileLoading` is true.
        This prevents it from flashing open for returning users while Supabase
        fetch is still in-flight. Once the check resolves, React will correctly
        evaluate `isProfileModalOpen` (false for existing users, true for new).
      */}
      {!isProfileLoading && (
        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          isOnboarding={isOnboarding}
          existingProfile={existingProfile}
          onClose={() => {
            setIsProfileModalOpen(false);
            setIsOnboarding(false);
          }}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}
