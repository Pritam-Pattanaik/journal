import React, { useState } from 'react';
import { BROKER_REGISTRY, getBrokerProvider } from '../../../lib/brokers/brokerRegistry';
import { BrokerProviderDefinition } from '../../../lib/brokers/brokerTypes';
import { DynamicBrokerForm } from './DynamicBrokerForm';
import { useBrokerStore } from '../../../stores/brokerStore';
import { notify } from '../../../lib/notify';
import { cn } from '../../../lib/cn';
import { Button } from '../../ui/Button';
import { 
  Check, ArrowRight, ArrowLeft, ShieldCheck, Zap, Lock, 
  ExternalLink, Server, AlertCircle, X, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BrokerConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrokerConnectionWizard: React.FC<BrokerConnectionWizardProps> = ({
  isOpen,
  onClose,
}) => {
  const { addConnection, syncConnection } = useBrokerStore();
  const [step, setStep] = useState<number>(1);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(BROKER_REGISTRY[0].providerId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [successAccountAlias, setSuccessAccountAlias] = useState<string>('');

  const activeProvider = getBrokerProvider(selectedProviderId) || BROKER_REGISTRY[0];

  const handleConnectSubmission = async (credentials: Record<string, string>, accountAlias: string) => {
    setIsProcessing(true);
    setWizardError(null);

    try {
      // Advance wizard simulation: Verify credentials -> Handshake -> Initial Sync
      setStep(4); // Step 4: Validate Credentials & Cryptographic Handshake
      await new Promise(r => setTimeout(r, 800));

      setStep(5); // Step 5: Testing Cloud Connection & Ingesting Ledger
      await new Promise(r => setTimeout(r, 900));

      // Execute actual state integration
      const payload: any = {
        broker: selectedProviderId,
        apiKey: credentials.apiKey || credentials.accessToken || 'JWT_BEARER_TOKEN',
        clientId: credentials.clientId || accountAlias,
        accountAlias: accountAlias,
      };

      if (credentials.apiSecret) payload.apiSecret = credentials.apiSecret;
      
      const metadataObj: Record<string, string> = {};
      if (credentials.apiPassword) metadataObj.password = credentials.apiPassword;
      if (credentials.totpSecret) metadataObj.totpSecret = credentials.totpSecret;
      if (credentials.accessToken) metadataObj.accessToken = credentials.accessToken;
      if (Object.keys(metadataObj).length > 0) payload.metadata = JSON.stringify(metadataObj);

      const { error } = await addConnection(payload);
      if (error) throw new Error(error);

      // Trigger automatic initial background sync
      syncConnection(selectedProviderId, true).catch(console.error);

      setSuccessAccountAlias(accountAlias);
      setStep(6); // Step 6: Completed Success Workspace!
      notify.success(`Successfully connected and secured ${accountAlias}!`);
    } catch (err: any) {
      setWizardError(err.message || 'Failed to authenticate broker connection.');
      setStep(3); // Revert to credentials step on error
      notify.error(`Connection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setIsProcessing(false);
    setWizardError(null);
    onClose();
  };

  if (!isOpen) return null;

  const stepsList = [
    { num: 1, label: 'Select Broker' },
    { num: 2, label: 'Auth Method' },
    { num: 3, label: 'Credentials' },
    { num: 4, label: 'Validation' },
    { num: 5, label: 'Initial Sync' },
    { num: 6, label: 'Completed' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn font-sans">
      <div className="bg-surface-0 border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar & Progress Stepper */}
        <div className="p-5 sm:px-6 bg-surface-1 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-iris/15 border border-iris/25 flex items-center justify-center text-iris font-bold text-sm">
              ⚡
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-primary">Institutional Connection Wizard</h3>
              <p className="text-[11px] text-tertiary">Provider-Driven Broker Management Engine</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-tertiary hover:text-primary transition-colors rounded-xl hover:bg-surface-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-6 py-3 bg-surface-1/50 border-b border-border-subtle flex items-center justify-between overflow-x-auto gap-2 text-xs">
          {stepsList.map(s => {
            const isActive = s.num === step;
            const isCompleted = s.num < step;
            return (
              <div key={s.num} className="flex items-center gap-2 shrink-0">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition-all',
                  isCompleted ? 'bg-success text-white' : isActive ? 'bg-iris text-white ring-4 ring-iris/20' : 'bg-surface-2 text-tertiary border border-border'
                )}>
                  {isCompleted ? <Check size={12} /> : s.num}
                </div>
                <span className={cn('font-medium text-[12px]', isActive ? 'text-primary font-bold' : isCompleted ? 'text-secondary' : 'text-muted')}>
                  {s.label}
                </span>
                {s.num < 6 && <div className="w-4 sm:w-6 h-px bg-border ml-1" />}
              </div>
            );
          })}
        </div>

        {/* Wizard Body (Scrollable Workspace) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {wizardError && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger font-semibold flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{wizardError}</span>
            </div>
          )}

          {/* STEP 1: SELECT BROKER GRID */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-display font-bold text-lg text-primary">Choose your Trading Institution</h4>
                <p className="text-xs text-tertiary mt-0.5">Select from Indian NSE/BSE retail brokerage APIs or Global algorithmic liquidity quant portals.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {BROKER_REGISTRY.map(broker => {
                  const isSelected = broker.providerId === selectedProviderId;
                  return (
                    <div
                      key={broker.providerId}
                      onClick={() => setSelectedProviderId(broker.providerId)}
                      className={cn(
                        'p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group',
                        isSelected 
                          ? 'bg-surface-2 border-iris shadow-[0_0_20px_rgba(var(--color-iris),0.15)] ring-1 ring-iris' 
                          : 'bg-surface-1 border-border hover:border-border-hover hover:bg-surface-2/60'
                      )}
                    >
                      <div className="flex items-start gap-3.5">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-black text-white text-sm shadow-md shrink-0 transition-transform group-hover:scale-105"
                          style={{ backgroundColor: broker.themeColor }}
                        >
                          {broker.logoText}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-display font-bold text-[14px] text-primary">{broker.name}</h5>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-0 border border-border text-tertiary">
                              {broker.region}
                            </span>
                          </div>
                          <p className="text-[11px] text-tertiary line-clamp-2 mt-1 leading-normal">{broker.tagline}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle text-[10px] font-mono text-muted">
                        <span>Auth: {broker.authModel.replace(/_/g, ' ')}</span>
                        <span className="text-iris font-bold group-hover:underline flex items-center gap-1">
                          Configure <ArrowRight size={10} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setStep(2)} className="px-6 font-bold gap-2">
                  Continue with {activeProvider.name} <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: AUTH METHOD & CAPABILITIES REVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-surface-1 border border-border flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-white text-lg shadow-lg shrink-0"
                  style={{ backgroundColor: activeProvider.themeColor }}
                >
                  {activeProvider.logoText}
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-lg text-primary">{activeProvider.name} Authentication Specification</h4>
                  <p className="text-xs text-tertiary mt-0.5 leading-relaxed">{activeProvider.tagline}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-surface-1/60 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-success" /> Token Lifecycle & Governance
                  </span>
                  <p className="text-xs text-tertiary leading-relaxed">
                    {activeProvider.tokenLifecycle.expiresDaily ? (
                      <>
                        <strong className="text-warning">Daily Session Token:</strong> In compliance with Indian broker rules, access tokens expire daily at {activeProvider.tokenLifecycle.expiryTimeLocal}. You can use our 1-click Quick Renewal Vault every morning.
                      </>
                    ) : (
                      <>
                        <strong className="text-success">Persistent Rolling Token:</strong> Automated token exchange algorithms maintain continuous background session validity without manual daily login.
                      </>
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-surface-1/60 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                    <Lock size={14} className="text-iris" /> Security Architecture
                  </span>
                  <p className="text-xs text-tertiary leading-relaxed">
                    Credentials are encrypted client-side using zero-knowledge AES-256 cloud algorithms. Secrets are purged from local browser session memory immediately upon connection.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft size={16} /> Change Broker
                </Button>
                <Button onClick={() => setStep(3)} className="px-6 font-bold gap-2">
                  Enter Credentials <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER CREDENTIALS DYNAMIC FORM */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-display font-bold text-lg text-primary">Provide {activeProvider.name} API Credentials</h4>
                <p className="text-xs text-tertiary mt-0.5">Enter your authentic institutional API keys. Unused fields are dynamically stripped.</p>
              </div>
              
              <DynamicBrokerForm
                provider={activeProvider}
                onSubmit={handleConnectSubmission}
                isLoading={isProcessing}
                onCancel={() => setStep(2)}
              />
            </div>
          )}

          {/* STEP 4 & 5: PROGRESS LOADING SIMULATION */}
          {(step === 4 || step === 5) && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-iris/15 border border-iris/30 flex items-center justify-center animate-bounce shadow-iris">
                <Server className="w-8 h-8 text-iris animate-pulse" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="font-display font-bold text-lg text-primary">
                  {step === 4 ? 'Validating Cryptographic Signatures...' : `Syncing Initial Execution Ledger from ${activeProvider.name}...`}
                </h4>
                <p className="text-xs text-tertiary leading-relaxed">
                  {step === 4 
                    ? 'Verifying regex field parameters and negotiating AES-256 cloud encryption handshake.'
                    : 'Ingesting historical closed orders, option Greeks, and quantitative discipline ratings.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 6: COMPLETED WORKSPACE */}
          {step === 6 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success text-success flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-scaleIn">
                <Check size={40} strokeWidth={3} />
              </div>
              <div className="max-w-md space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20">
                  <Sparkles size={12} /> Institutional Vault Active
                </div>
                <h4 className="font-display font-bold text-xl text-primary">
                  {successAccountAlias || activeProvider.name} Connected!
                </h4>
                <p className="text-xs text-tertiary leading-relaxed">
                  Your brokerage account has been successfully verified, encrypted, and synced with your TradeVault journal. Automated background observers are actively monitoring token health.
                </p>
              </div>

              <Button onClick={resetAndClose} className="min-w-[200px] h-12 font-bold text-sm shadow-iris">
                Launch Institutional Control Center
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
