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

export default function FreelancerDashboard() {
  const account = useActiveAccount();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Incoming Tasks");
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Route protection
  useEffect(() => {
    if (!account) {
      router.push("/");
    }
  }, [account, router]);

  if (!account) return null; // Prevent rendering before redirect

  return (
    <div className="min-h-screen p-8 bg-[#F9FAFB]">
      <header className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Freelancer Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage your gigs and earnings.</p>
        </div>
        <CustomConnectButton />
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
    </div>
  );
}
