"use client";

import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { StatementSection } from "./StatementSection";
import { FeatureSection } from "./FeatureSection";
import { InteractiveProcess } from "./InteractiveProcess";
import { PathSelection } from "./PathSelection";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden selection:bg-accent/30 selection:text-white">
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <StatementSection />
        <FeatureSection />
        <InteractiveProcess />
        <PathSelection />
      </main>

      <Footer />
    </div>
  );
}
