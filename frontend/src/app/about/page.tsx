import Link from "next/link";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Footer } from "@/components/landing/Footer";
import { Shield, Lock, Award, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[#071014] selection:bg-accent/30 selection:text-white">
      <LandingNavbar />

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-primary text-xs font-mono uppercase tracking-wider mb-6 font-semibold">
            [ ABOUT GIGLY ]
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#071014] mb-6 leading-tight">
            Rebuilding the Gig Economy on <span className="text-[#0DA5F0]">Trustless Code</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-normal">
            Gigly was founded on a simple conviction: freelancers shouldn't surrender 20% of their livelihood to centralized middlemen, and clients shouldn't have to rely on blind faith.
          </p>
        </div>

        {/* The Problem & Solution Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0DA5F0] flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3 text-slate-900">2.5% Fair Fee Escrow</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Traditional platforms charge up to 20% and freeze accounts without warning. Gigly caps platform fees at 2.5% governed by an immutable smart contract.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0DA5F0] flex items-center justify-center mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3 text-slate-900">Zero-Knowledge KYC</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Never upload raw passport or Aadhaar scans to corporate honeypots. Verification happens on-device via Groth16 ZK-SNARKs with zero stored PII.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#0DA5F0] flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3 text-slate-900">Verifiable Reputation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ratings can't be bought or faked. Trust scores and Verifiable Credentials (VCs) are minted strictly upon on-chain settlement proof hashes.
            </p>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-white shadow-xl mb-20">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-8 text-center">
            Traditional Platforms vs. Gigly Protocol
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
                  <th className="pb-4 font-semibold">Feature</th>
                  <th className="pb-4 font-semibold text-rose-600">Traditional Web2</th>
                  <th className="pb-4 font-semibold text-primary">Gigly Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                <tr>
                  <td className="py-4 font-semibold text-slate-900">Platform Take-Rate</td>
                  <td className="py-4 text-slate-600">15% – 25% + hidden payout fees</td>
                  <td className="py-4 text-emerald-700 font-semibold">2.5% max transparent on-chain fee</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-900">Payment Escrow</td>
                  <td className="py-4 text-slate-600">Centralized bank holding; arbitrary fund holds</td>
                  <td className="py-4 text-emerald-700 font-semibold">Optimistic smart contract on Sepolia</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-900">Identity &amp; Compliance</td>
                  <td className="py-4 text-slate-600">Raw ID copies stored on centralized servers</td>
                  <td className="py-4 text-emerald-700 font-semibold">Client-side ZK-SNARKs (0 bytes of PII stored)</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold text-slate-900">Reviews &amp; Ratings</td>
                  <td className="py-4 text-slate-600">Prone to fake bot reviews &amp; extortion</td>
                  <td className="py-4 text-emerald-700 font-semibold">W3C did:ethr tied to verified settlement txs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12 px-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-3">
            Ready to experience trustless freelancing?
          </h3>
          <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto">
            Connect your wallet and start creating or claiming gigs with decentralized cryptographic protection.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-[#0877AF] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
