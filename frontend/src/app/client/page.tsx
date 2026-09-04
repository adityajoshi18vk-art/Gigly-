"use client";

import { useState, useEffect, useCallback } from "react";

import Link from "next/link";
import { Home, Plus } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { FreelancerCard } from "@/components/FreelancerCard";

import { CreateJobModal } from "@/components/CreateJobModal";
import { ActiveJobs } from "@/components/ActiveJobs";
import { PastJobs } from "@/components/PastJobs";
import { PublicGigs } from "@/components/PublicGigs";
import { clearJobsCache } from "@/lib/useJobs";
import {
  getRegisteredFreelancers,
  type FreelancerProfile,
} from "@/lib/freelancerRegistry";
import { Users, ShieldCheck } from "lucide-react";
import { usePortalAuth } from "@/lib/usePortalAuth";

export default function ClientDashboard() {
  const { account } = usePortalAuth("client");
  
  const [activeTab, setActiveTab] = useState("Active Jobs");
  const [selectedFreelancer, setSelectedFreelancer] = useState<{
    name: string;
    address: string;
    hourlyRate?: number;
  } | null>(null);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // ── Dynamic freelancer registry (SSR-safe, API-backed) ────────────────
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchFreelancers = useCallback(async () => {
    const profiles = await getRegisteredFreelancers();
    setFreelancers(profiles);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchFreelancers();
  }, [fetchFreelancers]);

  const handleProfileSaved = () => {
    fetchFreelancers();
  };


  // Filter freelancers based on verified toggle
  const displayedFreelancers = showVerifiedOnly
    ? freelancers.filter(
        (p) =>
          (p.verifiedSkills && p.verifiedSkills.length > 0) ||
          p.kycVerified === true
      )
    : freelancers;

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-glow-accent text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-on-surface tracking-tight">Client Hub</h1>
            <p className="text-on-surface-variant text-xs font-normal">Escrow-backed freelance management</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0 px-2">
          <button 
            onClick={() => setIsPostJobModalOpen(true)}
            className="btn-gradient-primary text-xs font-semibold py-2.5 px-5 flex items-center gap-1.5 shadow-glow-accent"
          >
            <Plus className="w-4 h-4" />
            Post Open Job
          </button>
          <CustomConnectButton />
        </div>
      </header>

      <Tabs 
        tabs={["Active Jobs", "Past Jobs", "Browse Freelancers", "Public Gigs"]} 
        activeTab={activeTab} 
        onChange={setActiveTab}
        className="mb-8"
      />

      {activeTab === "Active Jobs" && (
        <ActiveJobs refreshCounter={refreshCounter} onInteractionSuccess={() => { clearJobsCache(); setRefreshCounter(c => c + 1); }} />
      )}

      {activeTab === "Past Jobs" && (
        <PastJobs role="client" refreshCounter={refreshCounter} />
      )}

      {activeTab === "Public Gigs" && (
        <PublicGigs refreshCounter={refreshCounter} />
      )}

      {activeTab === "Browse Freelancers" && (
        <>
          {/* Verified Talent Toggle */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-slate-700 font-mono font-bold uppercase tracking-wider">
              {displayedFreelancers.length} Verified Profile{displayedFreelancers.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setShowVerifiedOnly((v) => !v)}
              className={`flex items-center gap-2.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                showVerifiedOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:text-slate-950"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Only verified talent
              {/* Custom micro-switch */}
              <span
                className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                  showVerifiedOnly ? "bg-emerald-500" : "bg-glass-medium border border-glass-border"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    showVerifiedOnly ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          {!isLoaded ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-on-surface-variant text-sm">Discovering top freelancers...</p>
            </div>
          ) : displayedFreelancers.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20 surface-card p-12 rounded-2xl border-dashed border-glass-border">
              <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border flex items-center justify-center mx-auto mb-4 text-on-surface-variant">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                {showVerifiedOnly
                  ? "No verified talent found"
                  : "No freelancers registered yet"}
              </h3>
              <p className="text-on-surface-variant text-sm max-w-xs mx-auto">
                {showVerifiedOnly
                  ? "Try toggling the verification filter to see all active providers."
                  : "Connect with a freelancer wallet to publish your profile to the network."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedFreelancers.map((profile) => (
                <div 
                  key={profile.address} 
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedFreelancer({
                      name: profile.name,
                      address: profile.address,
                      hourlyRate: profile.hourlyRate,
                    })
                  }
                >
                  <FreelancerCard
                    name={profile.name}
                    title={profile.title}
                    avatarFallback={profile.avatarFallback}
                    rating={5.0}
                    reviews={0}
                    hourlyRate={`$${profile.hourlyRate}/hr`}
                    skills={profile.skills}
                    verifiedSkills={profile.verifiedSkills}
                    domain={profile.domain}
                    portfolioUrl={profile.portfolioUrl}
                    githubUrl={profile.githubUrl}
                    isVerified={profile.kycVerified === true}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <CreateJobModal 
        isOpen={!!selectedFreelancer || isPostJobModalOpen}
        onClose={() => {
          setSelectedFreelancer(null);
          setIsPostJobModalOpen(false);
        }}
        onSuccess={() => {
          clearJobsCache();
          setRefreshCounter(c => c + 1);
          handleProfileSaved();
        }}
        freelancerName={selectedFreelancer?.name || ""}
        freelancerAddress={selectedFreelancer?.address || ""}
        suggestedRate={selectedFreelancer?.hourlyRate}
      />
    </div>
  );
}
