"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { IncomingJobs } from "@/components/IncomingJobs";
import { BrowseGigs } from "@/components/BrowseGigs";
import { Earnings } from "@/components/Earnings";
import { DIDTrustCard } from "@/components/DIDTrustCard";
import { Credentials } from "@/components/Credentials";
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
    <div className="min-h-screen p-8 bg-background relative overflow-hidden text-on-background">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/10 blur-[150px] pointer-events-none" />
      
      {/* Top Navbar / Header */}
      <header className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between bg-[#0f172a]/50 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem] mb-8 shadow-xl">
        <div className="flex items-center gap-4 px-4">
          <Link href="/">
            <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Home className="w-5 h-5 text-white/70" />
            </button>
          </Link>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Freelancer Hub</h1>
            <p className="text-white/50 text-xs font-medium">Manage your gigs and earnings.</p>
          </div>
        </div>
        <div className="mt-4 sm:mt-0 px-2 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-2 text-sm bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <UserCog className="w-4 h-4" />
            Edit Profile
          </Button>
          <CustomConnectButton />
        </div>
      </header>

      <Tabs 
        tabs={["Incoming Tasks", "Browse Gigs", "Earnings", "Credentials"]} 
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
