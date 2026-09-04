"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FreelancerCard } from "@/components/FreelancerCard";
import { ShieldCheck, Clock, AlertTriangle, Sparkles } from "lucide-react";

export default function StyleGuide() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen p-6 lg:p-12 font-sans text-on-surface">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <header className="border-b border-glass-border pb-6 flex items-center justify-between">
          <div>
            <div className="pill-badge mb-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-light" />
              <span className="text-xs font-semibold text-accent-light uppercase">Design Tokens v2.0</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-on-surface">Gigly Design System</h1>
            <p className="text-on-surface-variant text-sm mt-1">Deep space navy aesthetic with radial atmospheric glow and translucent glass surfaces.</p>
          </div>
        </header>

        {/* --- Buttons & Badges --- */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-on-surface">1. Action &amp; Status Contrast</h2>
          <div className="surface-card rounded-2xl p-6">
            <p className="text-xs text-on-surface-variant mb-4">
              Demonstrating primary violet gradient buttons alongside dark glass status pills.
            </p>
            <div className="flex flex-wrap items-center gap-4 p-4 bg-glass-light rounded-xl border border-glass-border">
              <Button variant="primary">
                Primary Action
              </Button>
              <Button variant="outline">
                Glass Outline
              </Button>
              <Button variant="ghost">
                Ghost
              </Button>
              <div className="h-6 w-px bg-glass-border hidden sm:block" />
              <Badge variant="success">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Released
              </Badge>
              <Badge variant="pending">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Pending Review
              </Badge>
              <Badge variant="danger">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Disputed
              </Badge>
            </div>
          </div>
        </section>

        {/* --- Buttons Variants & Sizes --- */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-on-surface">2. Button Variants</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Primary</p>
              <Button variant="primary" className="w-full">Default</Button>
              <Button variant="primary" size="sm" className="w-full">Small</Button>
              <Button variant="primary" className="w-full" disabled>Disabled</Button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Outline</p>
              <Button variant="outline" className="w-full">Default</Button>
              <Button variant="outline" size="sm" className="w-full">Small</Button>
              <Button variant="outline" className="w-full" disabled>Disabled</Button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Ghost</p>
              <Button variant="ghost" className="w-full">Default</Button>
              <Button variant="ghost" size="sm" className="w-full">Small</Button>
              <Button variant="ghost" className="w-full" disabled>Disabled</Button>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-wider text-on-surface-variant">Danger</p>
              <Button variant="danger" className="w-full">Dispute</Button>
              <Button variant="danger" size="sm" className="w-full">Cancel</Button>
              <Button variant="danger" className="w-full" disabled>Disabled</Button>
            </div>
          </div>
        </section>

        {/* --- Freelancer Showcase --- */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-on-surface">3. Verified Profile Cards</h2>
            <span className="text-xs text-on-surface-variant font-mono">Mobile-first flex reflow</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FreelancerCard 
              name="Alice Cooper"
              title="Senior Full-Stack Web3 Developer"
              avatarFallback="AC"
              rating={4.9}
              reviews={124}
              hourlyRate="$60/hr"
              skills={["React", "Node.js", "Solidity", "TypeScript"]}
              verifiedSkills={["Solidity", "TypeScript"]}
              domain="Smart Contracts"
              isVerified={true}
            />
            <FreelancerCard 
              name="Bob Builder"
              title="UI/UX Product Designer"
              avatarFallback="BB"
              rating={5.0}
              reviews={89}
              hourlyRate="$45/hr"
              skills={["Figma", "Design Systems", "Framer"]}
              domain="UI/UX"
              isVerified={true}
            />
            <FreelancerCard 
              name="Charlie Davis"
              title="Smart Contract Security Auditor"
              avatarFallback="CD"
              rating={4.8}
              reviews={42}
              hourlyRate="$120/hr"
              skills={["Slither", "Foundry", "Yul"]}
              verifiedSkills={["Foundry"]}
              domain="Auditing"
              isVerified={false}
            />
          </div>
        </section>

        {/* --- Modals & Glass Surfaces --- */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-on-surface">4. Glass Morphism &amp; Dialogs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive 3D Glass Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                  Cards feature subtle mouse-reactive 3D tilt, violet glare reflections, and a luminous top edge highlight line.
                </p>
                <Button onClick={() => setIsModalOpen(true)}>Open Demo Modal</Button>
              </CardContent>
            </Card>

            <div className="surface-card rounded-2xl p-8 flex flex-col items-center justify-center text-center border-dashed border-glass-border">
              <Sparkles className="w-8 h-8 text-accent-light mb-2" />
              <p className="text-sm font-semibold text-on-surface">Translucent Dark Surface</p>
              <p className="text-xs text-on-surface-variant mt-1">backdrop-blur-xl with space-navy palette</p>
            </div>
          </div>
        </section>

      </div>

      {/* Modal Instance */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Escrow Action Confirmation"
      >
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          Are you sure you want to submit this milestone deliverable on-chain? A 24-hour review window will begin immediately.
        </p>
        <div className="flex justify-end gap-3 pt-2 border-t border-glass-border">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>Confirm Submission</Button>
        </div>
      </Modal>
    </div>
  );
}
