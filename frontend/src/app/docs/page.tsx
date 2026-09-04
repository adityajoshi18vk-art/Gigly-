import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, ShieldCheck, Terminal, Cpu, ArrowRight, Layers } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-[#071014] selection:bg-accent/30 selection:text-white">
      <LandingNavbar />

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-mono uppercase tracking-wider mb-6 font-semibold">
            [ DEVELOPER DOCUMENTATION ]
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#071014] mb-6 leading-tight">
            Gigly Protocol <span className="text-[#0DA5F0]">Documentation</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-normal">
            Everything you need to understand, integrate with, and build upon Gigly's decentralized freelance escrow and zero-knowledge compliance infrastructure.
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <a href="#quickstart" className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all">
            <Terminal className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">Quickstart Guide</h3>
            <p className="text-xs text-slate-600">Connect wallet, obtain testnet USDC, and post or claim your first gig.</p>
          </a>

          <a href="#zk-kyc" className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all">
            <ShieldCheck className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">Zero-Knowledge KYC</h3>
            <p className="text-xs text-slate-600">Off-chain identity verification via Anon Aadhaar (India) &amp; ZKPassport (Global).</p>
          </a>

          <a href="#reputation" className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-300 transition-all">
            <Cpu className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">DID &amp; Trust Scores</h3>
            <p className="text-xs text-slate-600">W3C did:ethr verifiable credentials tied directly to on-chain payment settlements.</p>
          </a>
        </div>

        {/* Section 1: Quickstart */}
        <div id="quickstart" className="space-y-6 mb-16 scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-slate-900 pb-3 border-b border-slate-200">
            1. Protocol Quickstart
          </h2>
          <div className="prose prose-slate max-w-none text-sm text-slate-600 space-y-4">
            <p>
              Gigly operates on the <strong>Ethereum Sepolia Testnet</strong>. Before interacting with the escrow contracts, you need a Web3 wallet (MetaMask, Coinbase, or Social Login via Thirdweb) and Sepolia ETH for gas.
            </p>
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto space-y-1">
              <div># 1. Network: Ethereum Sepolia</div>
              <div># 2. Chain ID: 11155111</div>
              <div># 3. Currency: Sepolia ETH &amp; Official Circle USDC</div>
              <div># 4. Verified Contracts: /contracts</div>
            </div>
            <h3 className="text-base font-bold text-slate-800 mt-6">Client Lifecycle:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Navigate to <Link href="/client" className="text-primary font-semibold hover:underline">Client Hub</Link>.</li>
              <li>Click <strong>Post Open Job</strong>, enter title, description, and budget in USDC.</li>
              <li>Approve the USDC token transfer and deposit funds into the <code className="text-primary font-mono font-semibold">OptimisticEscrow</code> contract.</li>
              <li>Funds remain securely locked until the freelancer submits proof-of-work.</li>
            </ol>
            <h3 className="text-base font-bold text-slate-800 mt-6">Freelancer Lifecycle:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Verify identity via the <Link href="/freelancer" className="text-primary font-semibold hover:underline">Compliance Gate</Link> (ZK-SNARK proof).</li>
              <li>Browse open tasks and accept an assignment.</li>
              <li>Submit work link (GitHub repository, Figma design, deploy URL) to trigger the review countdown.</li>
              <li>Once approved or after the review window elapses without dispute, release payment directly to your wallet!</li>
            </ol>
          </div>
        </div>

        {/* Section 2: ZK-KYC Architecture */}
        <div id="zk-kyc" className="space-y-6 mb-16 scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-slate-900 pb-3 border-b border-slate-200">
            2. Zero-Knowledge Compliance Engine
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Gigly completely solves the KYC paradox: compliance without compromise. Instead of storing sensitive government credentials, Gigly uses cryptographic Zero-Knowledge proofs:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-xs font-mono font-bold text-primary uppercase">[ INDIA &bull; RBI COMPLIANT ]</span>
              <h4 className="font-display text-lg font-bold text-slate-900 mt-2 mb-2">Anon Aadhaar (PSE)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Uses the official Aadhaar digital signature from the UIDAI. The Groth16 ZK-SNARK circuit proves that the signature is authentic and the user is over 18 without revealing Aadhaar number, name, or photo.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <span className="text-xs font-mono font-bold text-primary uppercase">[ GLOBAL &bull; GDPR COMPLIANT ]</span>
              <h4 className="font-display text-lg font-bold text-slate-900 mt-2 mb-2">ZKPassport (ICAO 9303)</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Taps the NFC chip in modern e-passports. The device generates a client-side cryptographic proof verifying national government issuance while discarding all raw PII locally on device.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Reputation */}
        <div id="reputation" className="space-y-6 mb-16 scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-slate-900 pb-3 border-b border-slate-200">
            3. Verifiable Reputation &amp; W3C DIDs
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Every freelancer and client profile is mapped to a decentralized identifier anchored to Ethereum Sepolia:
          </p>
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 font-mono text-xs text-primary font-semibold">
            did:ethr:sepolia:&#123;wallet_address&#125;
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Whenever a client releases payment or a claim timeout completes, the <code className="text-primary font-mono font-semibold">OptimisticEscrow</code> contract calls the <code className="text-primary font-mono font-semibold">GiglyCredential</code> smart contract to mint a soulbound credential. Trust scores cannot be manipulated, purchased, or faked because every score increment requires an on-chain transaction hash.
          </p>
        </div>

        {/* Section 4: Community Jury */}
        <div id="community-jury" className="space-y-6 mb-16 scroll-mt-28">
          <h2 className="font-display text-2xl font-bold text-slate-900 pb-3 border-b border-slate-200">
            4. Decentralized Community Jury (VotingDispute)
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Instead of relying on a centralized superuser or platform admin to arbitrate disputes, Gigly features decentralized community jury voting:
          </p>
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <h4 className="font-display text-base font-bold text-slate-900">How Community Jury Resolution Works:</h4>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li><strong>Juror Eligibility:</strong> Any verified GiglyCredential NFT holder can register as a community juror via the <Link href="/jury" className="text-primary font-semibold hover:underline">Jury Portal</Link>.</li>
              <li><strong>Pseudo-Random Selection:</strong> When a client raises a jury dispute, 3 eligible jurors are randomly selected on-chain using block prevrandao entropy.</li>
              <li><strong>Independent Review:</strong> Jurors review the project requirements vs deliverables and cast their vote independently.</li>
              <li><strong>Fair Payout Rules:</strong> &ge;60% votes (2+ out of 3) releases 100% to freelancer; 1 vote awards a 70/30 split; 0 votes issues a full refund to client.</li>
              <li><strong>+Contributor SBT:</strong> Every participating juror receives an exclusive on-chain +Contributor Soulbound Token recognizing their governance participation.</li>
            </ul>
          </div>
        </div>

        {/* Links to Contracts */}
        <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold mb-1">Looking for contract source code?</h3>
            <p className="text-slate-300 font-medium text-xs">Explore our verified Solidity contracts and ABI interfaces on Etherscan.</p>
          </div>
          <Link
            href="/contracts"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-[#0877AF] text-white text-xs font-bold shrink-0 transition-all shadow-sm"
          >
            View Smart Contracts <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
