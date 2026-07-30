import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-canvas pt-32 pb-24 selection:bg-primary/20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" />
            <span>Data Protection</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-6 font-display">
            Privacy Policy
          </h1>
          <p className="text-xl text-secondary max-w-2xl leading-relaxed">
            TradeVault is built for institutional trading desks and disciplined speculators. 
            We protect your data with the same rigor you apply to risk management.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-primary prose-p:text-secondary prose-a:text-iris prose-a:no-underline hover:prose-a:underline"
        >
          <p className="text-tertiary text-sm">Last Updated: October 1, 2026</p>

          <h2>1. Information We Collect</h2>
          <p>
            When you use TradeVault, we collect the necessary information to provide our algorithmic journaling and coaching services:
          </p>
          <ul>
            <li><strong>Account Data:</strong> Email address, name, and basic profile information.</li>
            <li><strong>Trading Data:</strong> Execution history, broker sync logs, P&amp;L metrics, and journal entries.</li>
            <li><strong>Usage Metrics:</strong> Interaction patterns with the AI Coach to improve personalized behavioral feedback.</li>
          </ul>

          <h2>2. How We Use Your Data</h2>
          <p>
            Your trading data is strictly utilized to provide you with insights. We do not sell your data to hedge funds, HFT firms, or third-party marketers. Your data powers:
          </p>
          <ul>
            <li>Your personal analytics dashboard and behavioral profile.</li>
            <li>The AI Coach's ability to detect tilt and discipline breaches.</li>
            <li>Automated synchronization with your connected brokerages via secure OAuth/API keys.</li>
          </ul>

          <h2>3. Data Security &amp; Encryption</h2>
          <p>
            TradeVault employs bank-grade security protocols:
          </p>
          <ul>
            <li><strong>At Rest:</strong> All databases are encrypted using AES-256 encryption.</li>
            <li><strong>In Transit:</strong> TLS 1.3 encryption is enforced across all API and client communications.</li>
            <li><strong>API Keys:</strong> Broker API keys are encrypted at the field level and never exposed to the frontend.</li>
          </ul>

          <h2>4. Third-Party Integrations</h2>
          <p>
            TradeVault integrates with external brokerages and data providers (e.g., Yahoo Finance). We only request read-only access where possible. We are not responsible for the privacy practices of these third-party services.
          </p>

          <h2>5. Your Rights &amp; Controls</h2>
          <p>
            You retain full ownership of your trading data. You can at any time:
          </p>
          <ul>
            <li>Export your complete trade history as CSV/JSON.</li>
            <li>Disconnect any linked brokerages, immediately purging the associated connection tokens.</li>
            <li>Delete your account permanently, which initiates a hard delete of all your records within 30 days.</li>
          </ul>

          <h2>6. Contact Our Security Team</h2>
          <p>
            If you have questions regarding our privacy practices or wish to report a security vulnerability, please contact our compliance team at <strong>security@tradevault.com</strong>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
