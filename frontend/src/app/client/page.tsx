"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { FreelancerCard } from "@/components/FreelancerCard";
import { Button } from "@/components/ui/Button";
import { CreateJobModal } from "@/components/CreateJobModal";
import { ActiveJobs } from "@/components/ActiveJobs";
import {
  getRegisteredFreelancers,
  isKycVerified,
  type FreelancerProfile,
} from "@/lib/freelancerRegistry";
import { Users, ShieldCheck } from "lucide-react";

export default function ClientDashboard() {
  const account = useActiveAccount();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Browse Freelancers");
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

  useEffect(() => {
    if (account) {
      console.log("=== GIGLY ACTIVE ACCOUNT ===");
      console.log("ADDRESS:", account.address);
      console.log("============================");
    }
  }, [account]);

  // Route protection
  useEffect(() => {
    if (!account) {
      router.push("/");
    }
  }, [account, router]);

  if (!account) return null;

  // Filter freelancers based on verified toggle
  const displayedFreelancers = showVerifiedOnly
    ? freelancers.filter(
        (p) => p.verifiedSkills && p.verifiedSkills.length > 0
      )
    : freelancers;

  return (
    <div className="min-h-screen p-8 bg-[#F9FAFB]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Client Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage your hires and escrow payments.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsPostJobModalOpen(true)}>Post a Job</Button>
          <CustomConnectButton />
        </div>
      </header>

      <Tabs 
        tabs={["Active Jobs", "Browse Freelancers"]} 
        activeTab={activeTab} 
        onChange={setActiveTab}
        className="mb-8"
      />

      {activeTab === "Active Jobs" && (
        <ActiveJobs refreshCounter={refreshCounter} onInteractionSuccess={() => setRefreshCounter(c => c + 1)} />
      )}

      {activeTab === "Browse Freelancers" && (
        <>
          {/* Verified Talent Toggle */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-slate-500">
              {displayedFreelancers.length} freelancer{displayedFreelancers.length !== 1 ? "s" : ""} found
            </p>
            <button
              onClick={() => setShowVerifiedOnly((v) => !v)}
              className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border transition-all ${
                showVerifiedOnly
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-gray-200 text-slate-500 hover:border-gray-300"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Only verified developers
              {/* Toggle indicator */}
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  showVerifiedOnly ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    showVerifiedOnly ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </span>
            </button>
          </div>

          {!isLoaded ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading freelancers...</p>
            </div>
          ) : displayedFreelancers.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-20">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {showVerifiedOnly
                  ? "No verified freelancers yet"
                  : "No freelancers registered yet"}
              </h3>
              <p className="text-slate-500 text-sm">
                {showVerifiedOnly
                  ? "Try turning off the verified filter, or check back later."
                  : "Connect as a freelancer to create a profile and appear here!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedFreelancers.map((profile) => (
                <div 
                  key={profile.address} 
                  className="cursor-pointer hover:-translate-y-1 transition-transform"
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
                    isVerified={isKycVerified(profile.address)}
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
