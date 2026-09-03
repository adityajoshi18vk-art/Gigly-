"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { FreelancerCard } from "@/components/FreelancerCard";

import { CreateJobModal } from "@/components/CreateJobModal";
import { ActiveJobs } from "@/components/ActiveJobs";

const DEMO_FREELANCERS = [
  {
    name: "Giglytest Freelancer",
    title: "Senior Full-Stack Developer",
    avatarFallback: "GF",
    rating: 5.0,
    reviews: 12,
    hourlyRate: "$85/hr",
    skills: ["React", "Thirdweb", "Solidity"],
    address: "0x750E278e1470e6a0db967BEeA91b82429C371944", // Real giglytest2 smart account address
  },
  {
    name: "Alice Designer",
    title: "UI/UX Product Designer",
    avatarFallback: "AD",
    rating: 4.9,
    reviews: 45,
    hourlyRate: "$60/hr",
    skills: ["Figma", "Web Design", "Branding"],
    address: "0x1111111111111111111111111111111111111111",
  },
  {
    name: "Charlie Auditor",
    title: "Smart Contract Security",
    avatarFallback: "CA",
    rating: 4.8,
    reviews: 89,
    hourlyRate: "$150/hr",
    skills: ["Auditing", "Yul", "DeFi"],
    address: "0x2222222222222222222222222222222222222222",
  }
];

export default function ClientDashboard() {
  const account = useActiveAccount();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Browse Freelancers");
  const [selectedFreelancer, setSelectedFreelancer] = useState<{name: string, address: string} | null>(null);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (account) {
      console.log("=== GIGLY ACTIVE ACCOUNT ===");
      console.log("ADDRESS:", account.address);
      console.log("FULL ACCOUNT:", JSON.stringify(account, null, 2));
      console.log("============================");
    }
  }, [account]);

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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Client Hub</h1>
            <p className="text-white/50 text-xs font-medium">Manage your hires and escrow.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0 px-2">
          <button 
            onClick={() => setIsPostJobModalOpen(true)}
            className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-bold tracking-wide hover:bg-white/90 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Post a Job
          </button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_FREELANCERS.map((freelancer) => (
            <div 
              key={freelancer.address} 
              className="cursor-pointer hover:-translate-y-1 transition-transform"
              onClick={() => setSelectedFreelancer({ name: freelancer.name, address: freelancer.address })}
            >
              <FreelancerCard
                name={freelancer.name}
                title={freelancer.title}
                avatarFallback={freelancer.avatarFallback}
                rating={freelancer.rating}
                reviews={freelancer.reviews}
                hourlyRate={freelancer.hourlyRate}
                skills={freelancer.skills}
              />
            </div>
          ))}
        </div>
      )}

      <CreateJobModal 
        isOpen={!!selectedFreelancer || isPostJobModalOpen}
        onClose={() => {
          setSelectedFreelancer(null);
          setIsPostJobModalOpen(false);
        }}
        onSuccess={() => setRefreshCounter(c => c + 1)}
        freelancerName={selectedFreelancer?.name || ""}
        freelancerAddress={selectedFreelancer?.address || ""}
      />
    </div>
  );
}
