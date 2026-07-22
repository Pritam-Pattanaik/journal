import React, { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, LogOut, Trash2, RefreshCw, BookOpen,
  Check, Key,  Link2, User,  Target, ChevronDown,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

import { useAuthStore } from '../stores/authStore';
import { useBrokerStore } from '../stores/brokerStore';
import { notify } from '../lib/notify';
import { useTradingRulesStore } from '../stores/tradingRulesStore';
import { cn } from '../lib/cn';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '../components/ui/Motion';

const SUPPORTED_BROKERS = [
  { id: 'zerodha',   name: 'Zerodha Kite',        requiresSecret: true },
  { id: 'angelone',  name: 'Angel One',            requiresSecret: false },
  { id: 'dhan',      name: 'DhanHQ',               requiresSecret: false },
  { id: 'groww',     name: 'Groww API',             requiresSecret: true },
  { id: '5paisa',    name: '5paisa Developer',      requiresSecret: true },
  { id: 'upstox',    name: 'Upstox API',            requiresSecret: true },
  { id: 'bullforce', name: 'BullForce API',         requiresSecret: true },
];

const INSTRUMENTS = ['CE', 'PE', 'FUT', 'EQ'];
const MARKETS = ['F&O', 'NSE', 'BSE', 'MCX'];

// Section header component
function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-iris/10 border border-iris/20 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-iris" strokeWidth={1.8} />
      </div>
      <div>
        <h3 className="font-display text-base font-bold text-primary">{title}</h3>
        <p className="text-xs text-tertiary mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const { profile, signOut, updateProfile } = useAuthStore();
  const { connections, fetchConnections, addConnection, removeConnection, syncConnection, syncingBrokers, updateToken } = useBrokerStore();
  const { rules, fetchRules, saveRules } = useTradingRulesStore();

  useEffect(() => { fetchConnections(); fetchRules(); }, [fetchConnections, fetchRules]);

  // Rules state
  const [windowStart, setWindowStart] = useState(rules?.windowStart || '');
  const [windowEnd, setWindowEnd] = useState(rules?.windowEnd || '');
  const [maxTradesPerDay, setMaxTradesPerDay] = useState<string>(rules?.maxTradesPerDay?.toString() || '');
  const [maxDailyLoss, setMaxDailyLoss] = useState<string>(rules?.maxDailyLoss?.toString() || '');
  const [maxLossPerTrade, setMaxLossPerTrade] = useState<string>(rules?.maxLossPerTrade?.toString() || '');
  const [allowedInstruments, setAllowedInstruments] = useState<string[]>(rules?.allowedInstruments || []);
  const [allowedMarkets, setAllowedMarkets] = useState<string[]>(rules?.allowedMarkets || []);
  const [isSavingRules, setIsSavingRules] = useState(false);
  const [rulesSaved, setRulesSaved] = useState(false);

  useEffect(() => {
    if (rules) {
      setWindowStart(rules.windowStart || '');
      setWindowEnd(rules.windowEnd || '');
      setMaxTradesPerDay(rules.maxTradesPerDay?.toString() || '');
      setMaxDailyLoss(rules.maxDailyLoss?.toString() || '');
      setMaxLossPerTrade(rules.maxLossPerTrade?.toString() || '');
      setAllowedInstruments(rules.allowedInstruments || []);
      setAllowedMarkets(rules.allowedMarkets || []);
    }
  }, [rules]);

  // Broker state
  const [selectedBroker, setSelectedBroker] = useState(SUPPORTED_BROKERS[0].id);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [clientId, setClientId] = useState('');
  const [apiPassword, setApiPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [updatingToken, setUpdatingToken] = useState<Record<string, boolean>>({});
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});
  const [showTokenInput, setShowTokenInput] = useState<Record<string, boolean>>({});
  const [brokerSyncErrors, setBrokerSyncErrors] = useState<Record<string, string>>({});

  // Profile state
  const [profileName, setProfileName] = useState(profile?.fullName || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const activeBrokerInfo = SUPPORTED_BROKERS.find(b => b.id === selectedBroker);

  const handleSaveRules = async () => {
    setIsSavingRules(true);
    const { error } = await saveRules({
      windowStart: windowStart || null,
      windowEnd: windowEnd || null,
      maxTradesPerDay: maxTradesPerDay ? parseInt(maxTradesPerDay) : null,
      maxDailyLoss: maxDailyLoss ? parseFloat(maxDailyLoss) : null,
      maxLossPerTrade: maxLossPerTrade ? parseFloat(maxLossPerTrade) : null,
      allowedInstruments: allowedInstruments.length ? allowedInstruments : null,
      allowedMarkets: allowedMarkets.length ? allowedMarkets : null,
    });
    setIsSavingRules(false);
    if (error) notify.error('Failed to save rules: ' + error);
    else { notify.success('Rules updated'); setRulesSaved(true); setTimeout(() => setRulesSaved(false), 2500); }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) { notify.error('API Key is required.'); return; }
    if (selectedBroker === 'dhan' && !clientId) { notify.error('Client ID is required for DhanHQ.'); return; }
    if (selectedBroker === 'angelone' && (!apiPassword || !totpSecret || !clientId)) { notify.error('Angel One requires Client Code, Password, and TOTP Secret.'); return; }
    setIsConnecting(true);
    const metadataObj: any = {};
    if (apiPassword) metadataObj.password = apiPassword;
    if (totpSecret) metadataObj.totpSecret = totpSecret;
    const { error } = await addConnection({ broker: selectedBroker, apiKey, apiSecret, clientId, metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : undefined });
    if (error) notify.error(error);
    else { notify.success(`Connected to ${activeBrokerInfo?.name}!`); setApiKey(''); setApiSecret(''); setClientId(''); setApiPassword(''); setTotpSecret(''); handleBrokerSync(selectedBroker).catch(console.error); }
    setIsConnecting(false);
  };

  const handleDisconnect = async (brokerId: string) => {
    if (window.confirm(`Disconnect ${brokerId}?`)) {
      const { error } = await removeConnection(brokerId);
      if (error) notify.error(error); else notify.success('Broker disconnected.');
    }
  };

  const handleBrokerSync = async (brokerId: string, fullSync = false) => {
    setBrokerSyncErrors(prev => ({ ...prev, [brokerId]: '' }));
    const { error, count } = await syncConnection(brokerId, fullSync);
    if (error) {
      if (error.includes('TOKEN_EXPIRED') || error.includes('expired')) {
        setBrokerSyncErrors(prev => ({ ...prev, [brokerId]: 'Token expired. Paste a new token.' }));
        setShowTokenInput(prev => ({ ...prev, [brokerId]: true }));
      } else notify.error(error);
    } else notify.success(fullSync ? `Full resync: ${count} trades!` : `Synced ${count} trades.`);
  };

  const handleUpdateToken = async (brokerId: string) => {
    const newToken = tokenInputs[brokerId]?.trim();
    if (!newToken) return;
    setUpdatingToken(prev => ({ ...prev, [brokerId]: true }));
    const { error } = await updateToken(brokerId, newToken);
    setUpdatingToken(prev => ({ ...prev, [brokerId]: false }));
    if (error) notify.error('Failed to update token: ' + error);
    else {
      setTokenInputs(prev => ({ ...prev, [brokerId]: '' }));
      setShowTokenInput(prev => ({ ...prev, [brokerId]: false }));
      setBrokerSyncErrors(prev => ({ ...prev, [brokerId]: '' }));
      notify.success('Token updated! Syncing now…');
      handleBrokerSync(brokerId);
    }
  };

  const inputCls = cn(
    'w-full h-11 rounded-xl border border-border bg-surface-1 px-4 text-[13px] text-primary font-medium',
    'placeholder:text-muted outline-none transition-all duration-200',
    'focus:border-iris/50 focus:bg-surface focus:shadow-[0_0_0_3px_rgba(var(--color-iris),0.12)]'
  );

  const toggleChip = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setList(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6">

      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-2xl font-bold text-primary tracking-tight">Settings</h1>
        <p className="text-xs text-tertiary mt-1">Manage broker connections, trading rules, and your profile.</p>
      </motion.div>

      <StaggerContainer staggerChildren={0.07}>

        {/* ── Connected Brokers ── */}
        <StaggerItem>
          <div className="card p-6">
            <SectionHeader icon={Link2} title="Connected Brokers" subtitle="Sync your trades automatically from your broker" />

            {connections.length > 0 ? (
              <div className="space-y-3 mb-4">
                {connections.map(conn => {
                  const brokerName = SUPPORTED_BROKERS.find(b => b.id === conn.broker)?.name || conn.broker;
                  return (
                    <div key={conn.id} className="rounded-xl border border-border bg-surface-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-semibold text-[14px] text-primary">{brokerName}</span>
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-success/10 text-success border border-success/20">Active</span>
                          </div>
                          {conn.clientId && <p className="text-[11px] font-mono text-tertiary mt-1">Client: {conn.clientId}</p>}
                          {conn.lastSyncedAt && <p className="text-[11px] text-muted mt-0.5">Last sync: {new Date(conn.lastSyncedAt).toLocaleString()}</p>}
                          {brokerSyncErrors[conn.broker] && (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-warning">
                              <AlertTriangle size={11} /> {brokerSyncErrors[conn.broker]}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button variant="ghost" size="icon-sm" title="Sync" onClick={() => handleBrokerSync(conn.broker)} disabled={!!syncingBrokers[conn.broker]}>
                            <RefreshCw className={cn('h-3.5 w-3.5', syncingBrokers[conn.broker] && 'animate-spin')} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Update Token" onClick={() => setShowTokenInput(p => ({ ...p, [conn.broker]: !p[conn.broker] }))}>
                            <Key className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="danger" size="icon-sm" onClick={() => handleDisconnect(conn.broker)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {showTokenInput[conn.broker] && (
                        <div className="flex gap-2 mt-3">
                          <input
                            type="text"
                            value={tokenInputs[conn.broker] || ''}
                            onChange={e => setTokenInputs(p => ({ ...p, [conn.broker]: e.target.value }))}
                            placeholder="Paste new token…"
                            className={cn(inputCls, 'font-mono text-[11px]')}
                          />
                          <Button size="sm" onClick={() => handleUpdateToken(conn.broker)} disabled={!tokenInputs[conn.broker]?.trim() || updatingToken[conn.broker]}>
                            {updatingToken[conn.broker] ? '…' : 'Save'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface-1/50 p-6 text-center text-sm text-tertiary mb-4">
                No brokers connected. Add one below.
              </div>
            )}

            {/* Add broker form */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-iris hover:text-iris/80 transition-colors list-none outline-none select-none py-1">
                <span className="w-4 h-4 rounded-full bg-iris/10 border border-iris/20 flex items-center justify-center">
                  <span className="text-[10px]">+</span>
                </span>
                Add New Broker Connection
                <ChevronDown size={12} className="ml-auto transition-transform group-open:rotate-180" />
              </summary>
              <form onSubmit={handleConnect} className="space-y-4 mt-4 pt-4 border-t border-border">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-1.5">Broker</label>
                  <select value={selectedBroker} onChange={e => { setSelectedBroker(e.target.value); setApiKey(''); setApiSecret(''); setClientId(''); }} className={cn(inputCls, 'appearance-none cursor-pointer')}>
                    {SUPPORTED_BROKERS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-1.5">{selectedBroker === 'dhan' ? 'Access Token' : 'API Key'}</label>
                    <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter key…" className={cn(inputCls, 'font-mono text-[11px]')} required />
                  </div>
                  {activeBrokerInfo?.requiresSecret && (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-1.5">API Secret</label>
                      <input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="Enter secret…" className={cn(inputCls, 'font-mono text-[11px]')} required />
                    </div>
                  )}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-1.5">Client ID {selectedBroker !== 'dhan' && selectedBroker !== 'angelone' && <span className="normal-case font-normal text-muted">(optional)</span>}</label>
                    <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="e.g. AB1234" className={cn(inputCls, 'font-mono text-[11px]')} required={selectedBroker === 'dhan' || selectedBroker === 'angelone'} />
                  </div>
                  {selectedBroker === 'angelone' && (
                    <>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-1.5">Password</label>
                        <input type="password" value={apiPassword} onChange={e => setApiPassword(e.target.value)} placeholder="Angel One password" className={cn(inputCls, 'font-mono text-[11px]')} required />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary block mb-1.5">TOTP Secret</label>
                        <input type="password" value={totpSecret} onChange={e => setTotpSecret(e.target.value)} placeholder="Base32 secret" className={cn(inputCls, 'font-mono text-[11px]')} required />
                      </div>
                    </>
                  )}
                </div>
                <Button type="submit" isLoading={isConnecting} className="w-full">
                  {!isConnecting && `Connect ${activeBrokerInfo?.name}`}
                </Button>
                <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/8 border border-warning/20 text-[11px] text-warning font-medium">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  Some brokers expire tokens daily. You may need to update daily.
                </div>
              </form>
            </details>
          </div>
        </StaggerItem>

        {/* ── Trading Rules ── */}
        <StaggerItem>
          <div className="card p-6">
            <SectionHeader icon={Target} title="Trading Discipline Rules" subtitle="Parameters used by AI Coach to score your execution quality" />

            <div className="space-y-5">
              {/* Time window */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary mb-2 block">Trading Window (IST)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted mb-1 block">Start</label>
                    <input type="time" value={windowStart} onChange={e => setWindowStart(e.target.value)} className={cn(inputCls, 'font-mono text-[11px]')} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted mb-1 block">End</label>
                    <input type="time" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} className={cn(inputCls, 'font-mono text-[11px]')} />
                  </div>
                </div>
              </div>

              {/* Risk limits */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary mb-2 block">Risk Limits</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Max Trades/Day', value: maxTradesPerDay, set: setMaxTradesPerDay, placeholder: 'e.g. 5' },
                    { label: 'Max Daily Loss ₹', value: maxDailyLoss, set: setMaxDailyLoss, placeholder: 'e.g. 2000' },
                    { label: 'Max Loss/Trade ₹', value: maxLossPerTrade, set: setMaxLossPerTrade, placeholder: 'e.g. 500' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-[10px] text-muted mb-1 block">{f.label}</label>
                      <input type="number" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} className={cn(inputCls, 'font-mono text-[11px]')} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Instruments */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary mb-2 block">Allowed Instruments <span className="normal-case font-normal text-muted">(empty = all)</span></label>
                <div className="flex gap-2 flex-wrap">
                  {INSTRUMENTS.map(inst => (
                    <button key={inst} onClick={() => toggleChip(allowedInstruments, setAllowedInstruments, inst)} className={cn(
                      'px-3.5 py-1.5 rounded-xl text-[12px] font-bold border transition-all',
                      allowedInstruments.includes(inst)
                        ? 'bg-iris/15 border-iris/30 text-iris'
                        : 'bg-surface-1 border-border text-secondary hover:text-primary hover:border-border-hover'
                    )}>{inst}</button>
                  ))}
                </div>
              </div>

              {/* Markets */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary mb-2 block">Allowed Markets <span className="normal-case font-normal text-muted">(empty = all)</span></label>
                <div className="flex gap-2 flex-wrap">
                  {MARKETS.map(mkt => (
                    <button key={mkt} onClick={() => toggleChip(allowedMarkets, setAllowedMarkets, mkt)} className={cn(
                      'px-3.5 py-1.5 rounded-xl text-[12px] font-bold border transition-all',
                      allowedMarkets.includes(mkt)
                        ? 'bg-accent/15 border-accent/30 text-accent'
                        : 'bg-surface-1 border-border text-secondary hover:text-primary hover:border-border-hover'
                    )}>{mkt}</button>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveRules} isLoading={isSavingRules}>
                {rulesSaved ? <><Check size={14} /> Saved!</> : !isSavingRules && <><BookOpen size={14} /> Save Trading Rules</>}
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* ── User Profile ── */}
        <StaggerItem>
          <div className="card p-6">
            <SectionHeader icon={User} title="User Profile" subtitle="Your account details and preferences" />

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-iris to-accent flex items-center justify-center text-white text-lg font-bold shadow-iris">
                {(profileName || profile?.fullName || 'US').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-[15px] text-primary">{profileName || 'Trader'}</p>
                <p className="text-xs font-mono text-tertiary">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary mb-1.5 block">Full Name</label>
                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary mb-1.5 block">Timezone</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className={cn(inputCls, 'appearance-none cursor-pointer')}>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" isLoading={isSavingProfile} onClick={async () => {
                setIsSavingProfile(true);
                try {
                  const { error } = await updateProfile({ fullName: profileName, timezone });
                  if (error) throw new Error(error);
                  notify.success('Profile saved.');
                } catch (err: any) {
                  notify.error(err.message);
                } finally { setIsSavingProfile(false); }
              }}>
                {!isSavingProfile && 'Save Profile'}
              </Button>
              <Button variant="danger" onClick={signOut} className="flex items-center gap-2">
                <LogOut size={14} /> Sign Out
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* ── Security Notice ── */}
        <StaggerItem>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-1 border border-border text-xs text-tertiary font-medium">
            <Shield size={14} className="shrink-0 mt-0.5 text-muted" />
            <p><strong className="text-secondary font-semibold">Security Notice:</strong> Your API credentials are encrypted with AES-256 in our cloud vault and are never exposed client-side.</p>
          </div>
        </StaggerItem>

      </StaggerContainer>
    </div>
  );
}
