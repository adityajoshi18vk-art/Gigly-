"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FreelancerCard } from "@/components/FreelancerCard";
import { ShieldCheck, Clock, AlertTriangle } from "lucide-react";

export default function StyleGuide() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 font-sans text-foreground">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <header className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-slate-900">Gigly Design System</h1>
          <p className="text-slate-500 mt-2">Clean, Web2-style aesthetic for freelance escrow.</p>
        </header>

        {/* --- Buttons & Badges (Refined Check) --- */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">1. Action & Status Contrast (Refinement Check)</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                Ensuring primary teal buttons and emerald status badges are visually distinct.
              </p>
              <div className="flex flex-wrap items-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <Button>
                  Primary Action
                </Button>
                <div className="h-8 w-px bg-gray-300 hidden sm:block" />
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
            </CardContent>
          </Card>
        </section>

        {/* --- Buttons --- */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">2. Buttons</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500">Primary</p>
              <Button className="w-full">Default</Button>
              <Button className="w-full hover:bg-primary-hover">Hovered</Button>
              <Button className="w-full" disabled>Disabled</Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500">Outline</p>
              <Button variant="outline" className="w-full">Default</Button>
              <Button variant="outline" className="w-full bg-gray-50">Hovered</Button>
              <Button variant="outline" className="w-full" disabled>Disabled</Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-500">Ghost</p>
              <Button variant="ghost" className="w-full">Default</Button>
              <Button variant="ghost" className="w-full bg-gray-100">Hovered</Button>
              <Button variant="ghost" className="w-full" disabled>Disabled</Button>
            </div>
          </div>
        </section>

        {/* --- Freelancer Grid Reflow --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">3. Mobile-First Grid Reflow</h2>
            <span className="text-sm text-slate-500 hidden sm:inline-block">Resize window to see reflow</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FreelancerCard 
              name="Alice Cooper"
              title="Senior Full-Stack Developer"
              avatarFallback="AC"
              rating={4.9}
              reviews={124}
              hourlyRate="$60/hr"
              skills={["React", "Node.js", "Solidity", "TypeScript"]}
            />
            <FreelancerCard 
              name="Bob Builder"
              title="UI/UX Product Designer"
              avatarFallback="BB"
              rating={5.0}
              reviews={89}
              hourlyRate="$45/hr"
              skills={["Figma", "Prototyping", "Wireframing"]}
            />
            <FreelancerCard 
              name="Charlie Davis"
              title="Smart Contract Auditor"
              avatarFallback="CD"
              rating={4.8}
              reviews={42}
              hourlyRate="$120/hr"
              skills={["Security", "Yul", "Hardhat"]}
            />
          </div>
        </section>

        {/* --- Modals & Cards --- */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">4. Cards & Modals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Cards use a soft 1px border, 12px border-radius, and a very subtle drop shadow that elevates on hover.
                </p>
                <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
              </CardContent>
            </Card>

            <Card className="flex items-center justify-center bg-gray-50 border-dashed">
              <p className="text-sm text-slate-400">Empty State Placeholder</p>
            </Card>
          </div>
        </section>

      </div>

      {/* Modal Instance */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Submit Work"
      >
        <p className="text-sm text-slate-600 mb-6">
          Are you sure you want to submit this milestone for review? The client will have 24 hours to approve or dispute.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={() => setIsModalOpen(false)}>Confirm Submission</Button>
        </div>
      </Modal>

    </div>
  );
}
