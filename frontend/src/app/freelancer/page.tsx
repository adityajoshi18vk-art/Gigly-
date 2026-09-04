"use client";

import { useState, useCallback, useEffect } from "react";

import Link from "next/link";
import { Home, Sparkles, UserCog, RefreshCw, Loader2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
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
import { getFreelancerProfile } from "@/lib/freelancerRegistry";

export default function FreelancerDashboard() {
  const { account } = usePortalAuth("freelancer");
  
  const [activeTab, setActiveTab] = useState("Active Jobs");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if connected freelancer has a registered profile in Supabase
  useEffect(() => {
    let cancelled = false;
    if (!account?.address) {
      setIsCheckingProfile(false);
      return;
    }

    async function checkProfile() {
      setIsCheckingProfile(true);
      try {
        const profile = await getFreelancerProfile(account!.address);
        if (cancelled) return;
        // If no profile found or essential details are missing, initiate onboarding
        if (!profile || !profile.name?.trim() || !profile.title?.trim()) {
          setIsOnboarding(true);
          setIsProfileModalOpen(true);
        } else {
          setIsOnboarding(false);
        }
      } catch (err) {
        console.warn("Failed to check freelancer profile:", err);
      } finally {
        if (!cancelled) {
          setIsCheckingProfile(false);
        }
      }
    }

    checkProfile();
    return () => {
      cancelled = true;
    };
  }, [account?.address]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    clearJobsCache();
    setRefreshCounter(c => c + 1);
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  return (
    <div className="min-h-screen py-4 sm:py-6 relative text-on-background">
      {/* Onboarding Notice Banner */}
      {isOnboarding && (
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
          <Button
            variant="outline"
            onClick={() => setIsProfileModalOpen(true)}
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

      {activeTab === "Credentials" && (
        <Credentials />
      )}

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        isOnboarding={isOnboarding}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsOnboarding(false);
        }}
        onSaved={() => {
          setIsOnboarding(false);
          setIsProfileModalOpen(false);
        }}
      />
    </div>
  );
}
