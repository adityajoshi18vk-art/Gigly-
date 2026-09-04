"use client";

import { useEffect, useState, useCallback } from "react";
import { readContract, prepareContractCall, waitForReceipt } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import {
  votingDisputeContract,
  credentialContract,
  escrowContract,
  client as thirdwebClient,
  CONTRACTS,
} from "@/lib/config";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
  ArrowUpRight,
  Gavel,
  AlertTriangle,
  Award,
  UserCheck,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DisputeInfo {
  disputeId: number;
  jobId: number;
  client: string;
  reason: string;
  createdAt: bigint;
  status: number;
  jurors: string[];
  voted: boolean[];
  voteForFreelancer: boolean[];
  votesForFreelancer: number;
  totalVotesCast: number;
  taskTitle: string;
  submissionLink: string;
  amount: bigint;
  freelancer: string;
}

function isVotingContractDeployed(): boolean {
  const addr = CONTRACTS.VotingDispute;
  return !!addr && addr !== "0x0000000000000000000000000000000000000000";
}

// ─── Countdown ───────────────────────────────────────────────────────────────

function useCountdown(createdAt: bigint, windowSecs: number) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const end = Number(createdAt) + windowSecs;
    const tick = () => setRemaining(Math.max(0, end - Math.floor(Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt, windowSecs]);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return { remaining, label: `${mins}m ${secs.toString().padStart(2, "0")}s` };
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function JuryPage() {
  const account = useActiveAccount();

  if (!isVotingContractDeployed()) {
    return (
      <div className="min-h-screen py-16 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center">
        <div className="surface-card rounded-3xl p-10 shadow-level-2 text-center space-y-4 max-w-lg w-full">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-display text-xl font-bold text-on-surface">VotingDispute Not Deployed</h1>
          <p className="text-sm text-on-surface-variant">
            Deploy the contract first, then update{" "}
            <code className="font-mono text-accent-light bg-glass-light px-1.5 py-0.5 rounded-md">
              CONTRACTS.VotingDispute
            </code>{" "}
            in{" "}
            <code className="font-mono text-accent-light bg-glass-light px-1.5 py-0.5 rounded-md">
              frontend/src/lib/config.ts
            </code>.
          </p>
          <code className="block bg-surface-container-lowest border border-glass-border p-3 rounded-xl text-xs font-mono text-accent-light text-left overflow-x-auto">
            npx hardhat run scripts/deploy_voting.ts --network sepolia
          </code>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen py-16 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center">
        <div className="surface-card rounded-3xl p-10 shadow-level-2 text-center space-y-6 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Community Jury</h1>
          <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
            Connect your wallet to register as a juror or cast votes on active disputes.
          </p>
          <CustomConnectButton />
        </div>
      </div>
    );
  }

  return <JuryDashboard address={account.address} />;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

function JuryDashboard({ address }: { address: string }) {
  const [isJuror, setIsJuror] = useState(false);
  const [hasNFT, setHasNFT] = useState(false);
  const [jurorPoolSize, setJurorPoolSize] = useState(0);
  const [disputes, setDisputes] = useState<DisputeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

  const refresh = useCallback(() => setRefreshCounter((c) => c + 1), []);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const [tokens, jurorStatus, poolSize] = await Promise.all([
          readContract({
            contract: credentialContract,
            method: "function getTokensByFreelancer(address) view returns (uint256[])",
            params: [address],
          }),
          readContract({
            contract: votingDisputeContract,
            method: "function isJuror(address) view returns (bool)",
            params: [address],
          }),
          readContract({
            contract: votingDisputeContract,
            method: "function jurorPoolSize() view returns (uint256)",
            params: [],
          }),
        ]);
        setHasNFT(tokens.length > 0);
        setIsJuror(jurorStatus);
        setJurorPoolSize(Number(poolSize));
      } catch (err) {
        console.error("Failed to fetch juror status:", err);
      }
    }
    fetchStatus();
  }, [address, refreshCounter]);

  useEffect(() => {
    async function fetchDisputes() {
      setLoading(true);
      try {
        const count = await readContract({
          contract: votingDisputeContract,
          method: "function disputeCount() view returns (uint256)",
          params: [],
        });
        const total = Number(count);
        if (total === 0) { setDisputes([]); setLoading(false); return; }

        const ids = Array.from({ length: total }, (_, i) => i + 1);
        const all = await Promise.all(
          ids.map(async (dId) => {
            try {
              const d = await readContract({
                contract: votingDisputeContract,
                method: "function getDispute(uint256) view returns (uint256,address,string,uint256,uint8,address[3],bool[3],bool[3],uint8,uint8)",
                params: [BigInt(dId)],
              });
              const jobId = Number(d[0]);
              const job = await readContract({
                contract: escrowContract,
                method: "function jobs(uint256) view returns (address client, address freelancer, uint256 amount, uint256 releasedAmount, uint256 submittedAt, uint8 status, string taskTitle, string submissionLink)",
                params: [BigInt(jobId)],
              });
              return {
                disputeId: dId,
                jobId,
                client: d[1] as string,
                reason: d[2] as string,
                createdAt: d[3] as bigint,
                status: d[4] as number,
                jurors: Array.from(d[5] as readonly string[]),
                voted: Array.from(d[6] as readonly boolean[]),
                voteForFreelancer: Array.from(d[7] as readonly boolean[]),
                votesForFreelancer: d[8] as number,
                totalVotesCast: d[9] as number,
                freelancer: job[1] as string,
                amount: job[2] as bigint,
                taskTitle: job[6] as string,
                submissionLink: job[7] as string,
              } as DisputeInfo;
            } catch { return null; }
          })
        );
        setDisputes(all.filter(Boolean) as DisputeInfo[]);
      } catch (err) {
        console.error("Failed to fetch disputes:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDisputes();
  }, [refreshCounter]);

  const handleRegister = async () => {
    try {
      setRegistering(true);
      const tx = prepareContractCall({ contract: votingDisputeContract, method: "function registerAsJuror()", params: [] });
      const result = await sendTransaction(tx);
      await waitForReceipt({ client: thirdwebClient, chain: votingDisputeContract.chain, transactionHash: result.transactionHash });
      refresh();
    } catch (err) { console.error(err); alert("Failed to register. Make sure you hold a GiglyCredential NFT."); }
    finally { setRegistering(false); }
  };

  const handleDeregister = async () => {
    try {
      setRegistering(true);
      const tx = prepareContractCall({ contract: votingDisputeContract, method: "function deregisterAsJuror()", params: [] });
      const result = await sendTransaction(tx);
      await waitForReceipt({ client: thirdwebClient, chain: votingDisputeContract.chain, transactionHash: result.transactionHash });
      refresh();
    } catch (err) { console.error(err); }
    finally { setRegistering(false); }
  };

  const myDisputes = disputes.filter((d) => d.jurors.map((j) => j.toLowerCase()).includes(address.toLowerCase()));
  const allActiveDisputes = disputes.filter((d) => d.status === 1);
  const resolvedDisputes = disputes.filter((d) => d.status === 2);

  return (
    <div className="py-8 px-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="surface-card p-6 rounded-3xl shadow-level-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 flex items-center justify-center text-black shadow-glow-accent">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-on-surface">Community Jury</h1>
            <p className="text-xs text-on-surface-variant">
              Decentralised dispute resolution &middot; {jurorPoolSize} juror{jurorPoolSize !== 1 ? "s" : ""} registered
            </p>
          </div>
        </div>
        <CustomConnectButton />
      </div>

      {/* Juror Status */}
      <div className="surface-card rounded-2xl p-5 shadow-level-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Your Juror Status</p>
          <div className="flex items-center gap-2">
            {isJuror ? (
              <><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" /><span className="text-sm font-semibold text-emerald-400">Active Juror</span></>
            ) : hasNFT ? (
              <><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-sm font-semibold text-amber-400">Eligible — Not Registered</span></>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-on-surface-variant/40" /><span className="text-sm text-on-surface-variant">No GiglyCredential NFT — Not Eligible</span></>
            )}
          </div>
          {!hasNFT && <p className="text-xs text-on-surface-variant/60">Complete a gig to earn a GiglyCredential NFT and become eligible.</p>}
        </div>
        <div className="flex gap-2">
          {hasNFT && !isJuror && (
            <Button onClick={handleRegister} disabled={registering} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              {registering ? "Registering..." : "Join Juror Pool"}
            </Button>
          )}
          {isJuror && (
            <Button variant="outline" onClick={handleDeregister} disabled={registering} className="text-xs text-on-surface-variant border-glass-border hover:border-error/40 hover:text-error">
              {registering ? "Leaving..." : "Leave Pool"}
            </Button>
          )}
        </div>
      </div>

      {/* Contributor NFT Banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-400/8 border border-amber-400/20 rounded-2xl">
        <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <span className="font-semibold text-amber-400">Earn a +Contributor NFT</span> — Every juror who casts a vote receives a soulbound <strong className="text-on-surface">+Contributor</strong> NFT. It signals that you actively participate in maintaining the integrity of the Gigly economy.
        </div>
      </div>

      {/* My Assigned Disputes */}
      {myDisputes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-400" />
            Assigned to You ({myDisputes.length})
          </h2>
          <AnimatePresence>
            {myDisputes.map((d, i) => (
              <motion.div key={d.disputeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <DisputeCard dispute={d} address={address} isAssigned onAction={refresh} />
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      )}

      {/* All Active */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-on-surface uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-on-surface-variant" />
          All Active Disputes ({allActiveDisputes.length})
        </h2>
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-on-surface-variant text-sm font-mono">Loading on-chain disputes...</p>
          </div>
        ) : allActiveDisputes.length === 0 ? (
          <div className="surface-card p-12 rounded-3xl border-dashed border-glass-border text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-glass-light border border-glass-border flex items-center justify-center mx-auto text-success-light">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="font-display text-lg font-bold text-on-surface">No Active Voting Disputes</h2>
            <p className="text-on-surface-variant text-xs max-w-sm mx-auto">When clients raise community-jury disputes, they appear here for assigned jurors to vote on.</p>
          </div>
        ) : (
          <AnimatePresence>
            {allActiveDisputes.map((d, i) => (
              <motion.div key={d.disputeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <DisputeCard dispute={d} address={address} isAssigned={d.jurors.map((j) => j.toLowerCase()).includes(address.toLowerCase())} onAction={refresh} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>

      {/* Resolved */}
      {resolvedDisputes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Resolved Disputes ({resolvedDisputes.length})</h2>
          <AnimatePresence>
            {resolvedDisputes.map((d, i) => (
              <motion.div key={d.disputeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <DisputeCard dispute={d} address={address} isAssigned={false} onAction={refresh} />
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}

// ─── Dispute Card ────────────────────────────────────────────────────────────

function DisputeCard({ dispute: d, address, isAssigned, onAction }: { dispute: DisputeInfo; address: string; isAssigned: boolean; onAction: () => void; }) {
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [casting, setCasting] = useState(false);
  const [finalising, setFinalising] = useState(false);
  const { mutateAsync: sendTransaction } = useSendTransaction({ payModal: false });

  const { remaining, label: countdownLabel } = useCountdown(d.createdAt, 3 * 60);

  const mySlot = d.jurors.findIndex((j) => j.toLowerCase() === address.toLowerCase());
  const myVoted = mySlot >= 0 ? d.voted[mySlot] : false;
  const windowExpired = remaining === 0;
  const canFinalise = d.status === 1 && (windowExpired || d.totalVotesCast === 3);

  const handleVote = async (voteForFreelancer: boolean) => {
    try {
      setCasting(true);
      const tx = prepareContractCall({ contract: votingDisputeContract, method: "function castVote(uint256,bool)", params: [BigInt(d.disputeId), voteForFreelancer] });
      const result = await sendTransaction(tx);
      await waitForReceipt({ client: thirdwebClient, chain: votingDisputeContract.chain, transactionHash: result.transactionHash });
      setVoteModalOpen(false);
      onAction();
    } catch (err) { console.error(err); alert("Failed to cast vote."); }
    finally { setCasting(false); }
  };

  const handleFinalise = async () => {
    try {
      setFinalising(true);
      const tx = prepareContractCall({ contract: votingDisputeContract, method: "function finaliseDispute(uint256)", params: [BigInt(d.disputeId)] });
      const result = await sendTransaction(tx);
      await waitForReceipt({ client: thirdwebClient, chain: votingDisputeContract.chain, transactionHash: result.transactionHash });
      onAction();
    } catch (err) { console.error(err); alert("Failed to finalise dispute."); }
    finally { setFinalising(false); }
  };

  return (
    <div className="relative surface-card-interactive rounded-2xl p-6 overflow-hidden transition-all duration-300">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-glass-border pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-[11px] text-on-surface-variant font-mono tracking-widest uppercase bg-glass-light px-2.5 py-0.5 rounded-full border border-glass-border">Dispute #{d.disputeId}</span>
            <span className="text-[11px] text-on-surface-variant font-mono bg-glass-subtle px-2 py-0.5 rounded-full border border-glass-border">Job #{d.jobId}</span>
            <Badge variant={d.status === 1 ? "pending" : "success"}>{d.status === 1 ? "Voting Open" : "Resolved"}</Badge>
            {isAssigned && <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2 py-0.5 rounded-full">YOU&apos;RE A JUROR</span>}
          </div>
          <h3 className="font-display font-semibold text-on-surface text-lg">{d.taskTitle || `Job #${d.jobId}`}</h3>
          <div className="flex flex-wrap gap-3 mt-1 text-xs font-mono text-on-surface-variant">
            <span>Client: <span className="text-on-surface">{d.client.slice(0, 6)}...{d.client.slice(-4)}</span></span>
            <span>Freelancer: <span className="text-on-surface">{d.freelancer.slice(0, 6)}...{d.freelancer.slice(-4)}</span></span>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[11px] text-on-surface-variant/60 uppercase font-mono tracking-wider">Escrowed</p>
          <p className="font-bold text-on-surface text-xl font-mono">${formatUnits(d.amount, 6)} <span className="text-xs text-on-surface-variant font-sans">USDC</span></p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-glass-subtle border border-glass-border p-3.5 rounded-xl space-y-1.5">
          <p className="text-xs font-semibold text-accent-light uppercase tracking-wider">Freelancer Submission</p>
          {d.submissionLink ? (
            <a href={d.submissionLink.startsWith("http") ? d.submissionLink : `https://${d.submissionLink}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-accent-light hover:text-white underline font-mono break-all">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" />{d.submissionLink}<ArrowUpRight className="w-3 h-3 shrink-0" />
            </a>
          ) : <span className="text-xs text-on-surface-variant/50 italic font-mono">No link attached</span>}
        </div>
        <div className="bg-glass-subtle border border-glass-border p-3.5 rounded-xl space-y-1.5">
          <p className="text-xs font-semibold text-error uppercase tracking-wider">Client Dispute Reason</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">{d.reason || "No reason provided"}</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-glass-border p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-on-surface uppercase tracking-wider">Jury Votes ({d.totalVotesCast}/3)</span>
          {d.status === 1 && !windowExpired && (
            <span className="flex items-center gap-1 text-amber-400 font-mono"><Clock className="w-3.5 h-3.5" />{countdownLabel} left</span>
          )}
          {d.status === 1 && windowExpired && <span className="text-on-surface-variant/60 font-mono text-[11px]">Window closed</span>}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {d.jurors.map((juror, i) => {
            const isMe = juror.toLowerCase() === address.toLowerCase();
            return (
              <div key={i} className={`p-2.5 rounded-xl border text-center text-xs ${isMe ? "border-amber-400/40 bg-amber-400/8" : "border-glass-border bg-glass-subtle"}`}>
                <p className={`font-mono text-[10px] mb-1 ${isMe ? "text-amber-400" : "text-on-surface-variant"}`}>{isMe ? "You" : `Juror ${i + 1}`}</p>
                {d.voted[i] ? (
                  <div className={`flex items-center justify-center gap-1 font-semibold ${d.voteForFreelancer[i] ? "text-success-light" : "text-error"}`}>
                    {d.voteForFreelancer[i] ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {d.voteForFreelancer[i] ? "Good" : "Failed"}
                  </div>
                ) : <span className="text-on-surface-variant/40 text-[11px]">Pending...</span>}
              </div>
            );
          })}
        </div>

        {d.totalVotesCast > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-on-surface-variant">
              <span>{d.votesForFreelancer} pro-freelancer</span>
              <span>{d.totalVotesCast - d.votesForFreelancer} pro-client</span>
            </div>
            <div className="h-2 rounded-full bg-glass-medium overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${(d.votesForFreelancer / 3) * 100}%` }} />
            </div>
            <p className="text-[11px] text-on-surface-variant font-mono">
              {d.votesForFreelancer >= 2 ? "Outcome: Full release → Freelancer" : d.votesForFreelancer === 1 ? "Outcome: 70% Freelancer / 30% Client refund" : "Outcome: Full refund → Client + discount voucher"}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {isAssigned && !myVoted && d.status === 1 && !windowExpired && (
            <Button onClick={() => setVoteModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
              <Gavel className="w-3.5 h-3.5" />Cast My Vote
            </Button>
          )}
          {isAssigned && myVoted && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold"><ShieldCheck className="w-4 h-4" />Vote Submitted</span>
          )}
          {canFinalise && (
            <Button variant="primary" onClick={handleFinalise} disabled={finalising} className="text-xs font-semibold px-4 py-2 shadow-glow-accent">
              {finalising ? "Finalising..." : "Finalise & Execute Payout"}
            </Button>
          )}
        </div>
      </div>

      <Modal isOpen={voteModalOpen} onClose={() => setVoteModalOpen(false)} title="Cast Your Vote">
        <div className="space-y-5">
          <div className="p-3 bg-amber-400/8 border border-amber-400/20 rounded-xl text-xs text-on-surface-variant leading-relaxed">
            <strong className="text-amber-400">Important:</strong> Review the submission and dispute reason carefully. Your vote is <strong>final and cannot be changed</strong>.
          </div>
          {d.submissionLink && (
            <a href={d.submissionLink.startsWith("http") ? d.submissionLink : `https://${d.submissionLink}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-xs text-accent-light hover:text-white bg-accent/10 hover:bg-accent/20 px-3.5 py-2.5 rounded-xl border border-accent/25 transition-all">
              <LinkIcon className="w-4 h-4" />Open Freelancer&apos;s Submission<ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </a>
          )}
          <p className="text-xs text-on-surface-variant"><strong className="text-on-surface">Client says:</strong> {d.reason}</p>
          <p className="text-sm font-semibold text-on-surface">Does the submission meet the project requirements?</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleVote(true)} disabled={casting}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/8 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-sm transition-all hover:border-emerald-500/50 disabled:opacity-50">
              <CheckCircle2 className="w-7 h-7" />Yes — Project is Good
            </button>
            <button onClick={() => handleVote(false)} disabled={casting}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-error/30 bg-error/8 hover:bg-error/20 text-error font-semibold text-sm transition-all hover:border-error/50 disabled:opacity-50">
              <XCircle className="w-7 h-7" />No — Project Failed
            </button>
          </div>
          {casting && (
            <div className="flex items-center justify-center gap-2 text-sm text-on-surface-variant">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Submitting vote on-chain...
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
