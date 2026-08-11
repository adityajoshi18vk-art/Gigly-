"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Tabs } from "@/components/ui/Tabs";
import { FreelancerCard } from "@/components/FreelancerCard";
import { Button } from "@/components/ui/Button";
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
