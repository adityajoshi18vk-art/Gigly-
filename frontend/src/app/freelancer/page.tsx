"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { IncomingJobs } from "@/components/IncomingJobs";
import { BrowseGigs } from "@/components/BrowseGigs";
import { Earnings } from "@/components/Earnings";
import { DIDTrustCard } from "@/components/DIDTrustCard";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { Button } from "@/components/ui/Button";
import { UserCog } from "lucide-react";

export default function FreelancerDashboard() {
  const account = useActiveAccount();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Incoming Tasks");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Route protection
  useEffect(() => {
    if (!account) {
      router.push("/");
    }
  }, [account, router]);

  if (!account) return null; // Prevent rendering before redirect

  return (
    <div className="min-h-screen p-8 bg-[#F9FAFB]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Freelancer Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage your gigs and earnings.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 text-sm"
          >
            <UserCog className="w-4 h-4" />
            Edit Profile
          </Button>
          <CustomConnectButton />
        </div>
      </header>

      <Tabs 
        tabs={["Incoming Tasks", "Browse Gigs", "Earnings"]} 
        activeTab={activeTab} 
        onChange={setActiveTab}
        className="mb-8"
      />

      {activeTab === "Incoming Tasks" && (
        <IncomingJobs 
          refreshCounter={refreshCounter} 
          onInteractionSuccess={() => setRefreshCounter(c => c + 1)}
        />
      )}

      {activeTab === "Browse Gigs" && (
        <BrowseGigs 
          refreshCounter={refreshCounter}
          onInteractionSuccess={() => {
            setRefreshCounter(c => c + 1);
            setActiveTab("Incoming Tasks");
          }}
        />
      )}

      {activeTab === "Earnings" && (
        <div className="space-y-6">
          <Earnings />
          <DIDTrustCard />
        </div>
      )}

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
