import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, CheckCircle, Zap, Sparkles } from 'lucide-react';
import { Reveal } from '../ui/Motion';
import { MagneticButton } from '../ui/MagneticButton';

export default function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-20 pb-32 relative z-20" aria-label="Final Onboarding Conversion Trigger">
      
      <Reveal direction="up">
        <div className="w-full rounded-[2.5rem] bg-gradient-to-br from-surface-1 via-surface-0 to-surface-1 border border-border-hover p-8 sm:p-14 md:p-20 shadow-floating relative overflow-hidden text-center flex flex-col items-center justify-center">
          
          {/* Ambient Lighting Background Core */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-[140px] bg-gradient-to-tr from-accent/25 via-iris/20 to-transparent pointer-events-none -z-10" />

          {/* Verification Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-mono-stat font-bold text-iris mb-6">
            <Sparkles size={14} />
            <span>ZERO DOPAMINE · INSTITUTIONAL EXCELLENCE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight max-w-3xl mb-6 leading-tight">
            Ready to trade with verifiable algorithmic discipline?
          </h2>

          <p className="text-base sm:text-xl text-secondary max-w-2xl mb-10 leading-relaxed font-normal">
            Stop letting psychological tilt and unverified intuition drain your trading capital. Synchronize your broker account in 30 seconds and activate your AI behavioral guardrails today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mx-auto mb-8">
            <MagneticButton
              onClick={() => navigate('/signup')}
              variant="primary"
              className="w-full sm:w-auto px-10 py-5 text-base sm:text-lg font-extrabold shadow-[0_6px_36px_rgba(59,114,255,0.45)]"
              magneticPull={0.25}
            >
              <span>Create Free Account Now</span>
              <ArrowRight size={20} className="text-white/80" />
            </MagneticButton>
          </div>

          {/* Risk Reversal Footer Credentials */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm font-semibold text-tertiary border-t border-border/60 pt-8 w-full max-w-2xl">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-success stroke-[2.5]" />
              <span>Free forever tier available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-success stroke-[2.5]" />
              <span>No credit card required</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle size={16} className="text-success stroke-[2.5]" />
              <span>30-second read-only setup</span>
            </span>
          </div>

        </div>
      </Reveal>

    </section>
  );
}
