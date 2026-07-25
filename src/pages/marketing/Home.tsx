import React, { useEffect } from 'react';
import HeroSection from '../../components/marketing/HeroSection';
import TrustTicker from '../../components/marketing/TrustTicker';
import InteractiveDashboard from '../../components/marketing/InteractiveDashboard';
import BentoGridSection from '../../components/marketing/BentoGridSection';
import MarketNewsSection from '../../components/marketing/MarketNewsSection';
import AICoachSection from '../../components/marketing/AICoachSection';
import SocialProofSection from '../../components/marketing/SocialProofSection';
import PricingSection from '../../components/marketing/PricingSection';
import FAQSection from '../../components/marketing/FAQSection';
import FinalCTASection from '../../components/marketing/FinalCTASection';

export default function Home() {
  // Ensure view starts at top on direct navigation
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="w-full relative overflow-hidden bg-canvas text-primary">
      {/* 
        NOTE: All old global window mousemove event listeners that caused 
        120 re-renders per second have been permanently removed.
        Animation and atmospheric illumination operate strictly via GPU-accelerated CSS.
      */}
      
      {/* 01. Hero Positioning & Value Conversion Section */}
      <HeroSection />

      {/* 02. Institutional Broker Ecosystem Marquee */}
      <TrustTicker />

      {/* 03. Interactive Showcase Centerpiece (Live 3-Tab Simulation) */}
      <div className="pt-20">
        <InteractiveDashboard />
      </div>

      {/* 04. Core Anatomy Pillars (Asymmetric Bento Modular Grid) */}
      <BentoGridSection />

      {/* 05. Macroevent Intelligence & Pre-News Lockouts */}
      <MarketNewsSection />

      {/* 06. AI Behavioral Coach Deep-Dive Engine */}
      <AICoachSection />

      {/* 07. Verified Social Proof & Audited Prop Performance */}
      <SocialProofSection />

      {/* 08. Transparent Investment Plans & ROI Calculator */}
      <PricingSection />

      {/* 09. Objection Resolution FAQ Accordion Vault */}
      <FAQSection />

      {/* 10. High-Conversion Closing Trigger */}
      <FinalCTASection />

    </div>
  );
}
