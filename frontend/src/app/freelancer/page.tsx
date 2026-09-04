"use client";

import { useState } from "react";

import Link from "next/link";
import { Home, Sparkles, UserCog } from "lucide-react";
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

export default function FreelancerDashboard() {
  const { account } = usePortalAuth("freelancer");
  
  const [activeTab, setActiveTab] = useState("Active Jobs");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


  return (
    <div className="min-h-screen py-4 sm:py-6 relative text-on-background">
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
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
