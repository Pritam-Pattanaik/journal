import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, LogOut, Trash2, RefreshCw, BookOpen, Check, CheckCircle2, Key, Settings2 } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useBrokerStore } from '../stores/brokerStore';
import { notify } from '../lib/notify';
import { useTradingRulesStore } from '../stores/tradingRulesStore';
import { cn } from '../lib/cn';

const SUPPORTED_BROKERS = [
  { id: 'zerodha', name: 'Zerodha Kite', requiresSecret: true },
  { id: 'angelone', name: 'Angel One', requiresSecret: false },
  { id: 'dhan', name: 'DhanHQ', requiresSecret: false },
  { id: 'groww', name: 'Groww API', requiresSecret: true },
  { id: '5paisa', name: '5paisa Developer', requiresSecret: true },
  { id: 'upstox', name: 'Upstox API', requiresSecret: true },
  { id: 'bullforce', name: 'BullForce API', requiresSecret: true },
];

export default function Settings() {
  const { profile, signOut, updateProfile } = useAuthStore();
  const { connections, fetchConnections, addConnection, removeConnection, syncConnection, syncingBrokers, updateToken } = useBrokerStore();

  const { rules, fetchRules, saveRules } = useTradingRulesStore();

  useEffect(() => {
    fetchConnections();
    fetchRules();
  }, [fetchConnections, fetchRules]);

  // ── My Trading Rules state ──────────────────────────────────────────────────
  const INSTRUMENTS = ['CE', 'PE', 'FUT', 'EQ'];
  const MARKETS = ['F&O', 'NSE', 'BSE', 'MCX'];

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

  const toggleInstrument = (inst: string) => {
    setAllowedInstruments(prev =>
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  const toggleMarket = (mkt: string) => {
    setAllowedMarkets(prev =>
      prev.includes(mkt) ? prev.filter(m => m !== mkt) : [...prev, mkt]
    );
  };

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
    if (error) {
      notify.error('Failed to save rules: ' + error);
    } else {
      notify.success('Rules updated successfully');
      setRulesSaved(true);
      setTimeout(() => setRulesSaved(false), 2500);
    }
  };

  // ── Integration Form fields ─────────────────────────────────────────────────
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

  const [profileName, setProfileName] = useState(profile?.fullName || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const activeBrokerInfo = SUPPORTED_BROKERS.find(b => b.id === selectedBroker);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      notify.error('API Key is required.');
      return;
    }
    if (selectedBroker === 'dhan' && !clientId) {
      notify.error('Client ID is strictly required for DhanHQ.');
      return;
    }
    if (selectedBroker === 'angelone' && (!apiPassword || !totpSecret || !clientId)) {
      notify.error('Angel One requires Client Code, Password, and TOTP Secret.');
      return;
    }
    
    setIsConnecting(true);
    const metadataObj: any = {};
    if (apiPassword) metadataObj.password = apiPassword;
    if (totpSecret) metadataObj.totpSecret = totpSecret;

    const { error } = await addConnection({
      broker: selectedBroker,
      apiKey,
      apiSecret,
      clientId,
      metadata: Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : undefined,
    });
    if (error) {
      notify.error(error);
    } else {
      notify.success(`Connected to ${activeBrokerInfo?.name}! Syncing in background...`);
      setApiKey('');
      setApiSecret('');
      setClientId('');
      setApiPassword('');
      setTotpSecret('');
      handleSync(selectedBroker).catch(console.error);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async (brokerId: string) => {
    if (window.confirm(`Are you sure you want to disconnect ${brokerId}?`)) {
      const { error } = await removeConnection(brokerId);
      if (error) {
        notify.error(error);
      } else {
        notify.success(`Broker ${brokerId} disconnected.`);
      }
    }
  };

  const handleSync = async (brokerId: string, fullSync = false) => {
    setBrokerSyncErrors(prev => ({ ...prev, [brokerId]: '' }));
    const { error, count } = await syncConnection(brokerId, fullSync);
    if (error) {
      if (error.includes('TOKEN_EXPIRED') || error.includes('expired') || error.includes('timed out')) {
        setBrokerSyncErrors(prev => ({
          ...prev,
          [brokerId]: 'Token expired. Paste a new token below.',
        }));
        setShowTokenInput(prev => ({ ...prev, [brokerId]: true }));
      } else {
        notify.error(error);
      }
    } else {
      notify.success(fullSync
        ? `Full resync complete: ${count} trades built!`
        : `Synced ${count} trades.`
      );
    }
  };

  const handleUpdateToken = async (brokerId: string) => {
    const newToken = tokenInputs[brokerId]?.trim();
    if (!newToken) return;
    setUpdatingToken(prev => ({ ...prev, [brokerId]: true }));
    const { error } = await updateToken(brokerId, newToken);
    setUpdatingToken(prev => ({ ...prev, [brokerId]: false }));
    if (error) {
      notify.error('Failed to update token: ' + error);
    } else {
      setTokenInputs(prev => ({ ...prev, [brokerId]: '' }));
      setShowTokenInput(prev => ({ ...prev, [brokerId]: false }));
      setBrokerSyncErrors(prev => ({ ...prev, [brokerId]: '' }));
      notify.success('Token updated! Syncing trades now…');
      handleSync(brokerId, false);
    }
  };

  // Upgraded Responsive Styles
  const inputStyles = "w-full bg-surface-1 border border-black/10 dark:border-white/10 rounded-xl px-5 py-4 text-base text-primary placeholder:text-tertiary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all shadow-sm";
  const labelStyles = "text-xs md:text-sm font-bold text-tertiary uppercase tracking-widest block mb-2";

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 mt-4">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-primary tracking-tight flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-accent" />
          Settings Workspace
        </h2>
        <p className="text-base text-secondary mt-2">
          Configure broker API connections, sync preferences, and update profile parameters.
        </p>
      </div>

      {/* SECTION 1: BROKER CONNECTIONS */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-4">
          Broker Integrations
          <div className="h-px bg-black/10 dark:bg-white/10 flex-1" />
        </h3>

        {connections.length > 0 ? (
          <div className="space-y-6">
            {connections.map((conn) => {
              const brokerName = SUPPORTED_BROKERS.find(b => b.id === conn.broker)?.name || conn.broker;
              return (
                <div key={conn.id} className="glass-panel p-8 md:p-10 rounded-[2rem] flex flex-col space-y-8">
                  {/* Broker info row */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-2xl text-primary">{brokerName}</span>
                        <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest bg-success/10 text-success border border-success/20">Active</span>
                      </div>
                      {conn.clientId && <div className="text-sm font-mono text-tertiary mt-3">Client ID: {conn.clientId}</div>}
                      {conn.lastSyncedAt && <div className="text-sm text-tertiary mt-2">Last synced: {new Date(conn.lastSyncedAt).toLocaleString()}</div>}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button variant="secondary" className="h-12 md:h-14 px-6 text-sm font-bold" onClick={() => handleSync(conn.broker, false)} disabled={!!syncingBrokers[conn.broker]}>
                        <RefreshCw className={cn("w-5 h-5 mr-2", syncingBrokers[conn.broker] && "animate-spin")} /> 
                        {syncingBrokers[conn.broker] ? 'Syncing...' : 'Sync'}
                      </Button>
                      <Button variant="secondary" className="h-12 md:h-14 px-6 text-sm font-bold" onClick={() => handleSync(conn.broker, true)} disabled={!!syncingBrokers[conn.broker]}
                        title="Re-fetch full 90-day history">
                        <RefreshCw className={cn("w-5 h-5 mr-2", syncingBrokers[conn.broker] && "animate-spin")} /> 
                        Full Resync
                      </Button>
                      <Button variant="secondary" className="h-12 md:h-14 px-6 text-sm font-bold" onClick={() => setShowTokenInput(prev => ({ ...prev, [conn.broker]: !prev[conn.broker] }))}>
                        <Key className="w-5 h-5 mr-2" /> Update Token
                      </Button>
                      <Button variant="destructive" className="h-12 md:h-14 px-6 text-sm font-bold bg-danger/10 text-danger hover:bg-danger/20 border-0" onClick={() => handleDisconnect(conn.broker)}>
                        <Trash2 className="w-5 h-5 mr-2" /> Disconnect
                      </Button>
                    </div>
                  </div>

                  {/* Token expired error */}
                  {brokerSyncErrors[conn.broker] && (
                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-warning/10 border border-warning/20">
                      <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
                      <span className="text-base text-warning font-semibold">{brokerSyncErrors[conn.broker]}</span>
                    </div>
                  )}

                  {/* Inline token update field */}
                  {showTokenInput[conn.broker] && (
                    <div className="flex gap-4 items-center">
                      <input
                        type="text"
                        value={tokenInputs[conn.broker] || ''}
                        onChange={e => setTokenInputs(prev => ({ ...prev, [conn.broker]: e.target.value }))}
                        placeholder={conn.broker === 'dhan' ? 'Paste new Dhan Access Token (JWT)' : 'Paste new API Key'}
                        className={inputStyles}
                      />
                      <Button
                        variant="primary"
                        disabled={!tokenInputs[conn.broker]?.trim() || updatingToken[conn.broker]}
                        onClick={() => handleUpdateToken(conn.broker)}
                        className="px-8 h-12 md:h-14 font-bold"
                      >
                        {updatingToken[conn.broker] ? 'Saving…' : 'Save & Sync'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-base text-secondary p-12 glass-panel rounded-[2rem] border-dashed border-black/20 dark:border-white/20 text-center font-medium">
            No brokers connected. Configure a new connection below.
          </div>
        )}

        {/* Add New Connection Form */}
        <div className="glass-panel p-8 md:p-12 rounded-[2rem] mt-10">
          <div className="mb-10">
            <h3 className="font-bold text-2xl text-primary mb-2">Add Integration</h3>
            <p className="text-base text-secondary">Connect your broker account to sync trades automatically.</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-8">
            <div className="space-y-2">
              <label className={labelStyles}>Select Broker</label>
              <select
                value={selectedBroker}
                onChange={(e) => {
                  setSelectedBroker(e.target.value);
                  setApiKey('');
                  setApiSecret('');
                  setClientId('');
                }}
                className={cn(inputStyles, "appearance-none bg-surface-1 cursor-pointer font-semibold")}
              >
                {SUPPORTED_BROKERS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelStyles}>
                  {selectedBroker === 'dhan' ? 'Access Token (JWT)' : 'API Key'}
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedBroker === 'dhan' ? "Enter Access Token" : "Enter API Key"}
                  className={cn(inputStyles, "font-mono")}
                  required
                />
              </div>

              {activeBrokerInfo?.requiresSecret && (
                <div className="space-y-2">
                  <label className={labelStyles}>API Secret</label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter API Secret"
                    className={cn(inputStyles, "font-mono")}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className={labelStyles}>
                  Client ID {selectedBroker !== 'dhan' && selectedBroker !== 'angelone' && <span className="opacity-50 normal-case ml-1">(Optional)</span>}
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={selectedBroker === 'angelone' ? "Enter Client Code" : "e.g. AB1234"}
                  className={cn(inputStyles, "font-mono")}
                  required={selectedBroker === 'dhan' || selectedBroker === 'angelone'}
                />
              </div>

              {selectedBroker === 'angelone' && (
                <>
                  <div className="space-y-2">
                    <label className={labelStyles}>Angel One Password</label>
                    <input
                      type="password"
                      value={apiPassword}
                      onChange={(e) => setApiPassword(e.target.value)}
                      placeholder="Enter Password"
                      className={cn(inputStyles, "font-mono")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelStyles}>TOTP Secret</label>
                    <input
                      type="password"
                      value={totpSecret}
                      onChange={(e) => setTotpSecret(e.target.value)}
                      placeholder="e.g. JBSWY3DPEHPK3PXP"
                      className={cn(inputStyles, "font-mono")}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <Button variant="primary" type="submit" disabled={isConnecting} className="w-full h-14 md:h-16 text-base md:text-lg font-bold mt-4">
              {isConnecting ? 'Connecting...' : `Connect ${activeBrokerInfo?.name}`}
            </Button>
          </form>

          {/* Warning Banner */}
          <div className="p-5 bg-warning/10 border border-warning/20 rounded-2xl flex gap-4 items-start mt-10">
            <AlertTriangle className="h-6 w-6 text-warning shrink-0" />
            <div className="text-base text-primary leading-relaxed font-medium">
              <strong className="text-warning font-bold">Token Expiry:</strong> Some brokers expire tokens daily. You may need to manually update tokens every morning to continue receiving real-time fills.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: MY TRADING RULES */}
      <section className="space-y-6 pt-12">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-4">
          Trading Discipline Parameters
          <div className="h-px bg-black/10 dark:bg-white/10 flex-1" />
        </h3>
        
        <div className="glass-panel p-8 md:p-12 rounded-[2rem] space-y-12">
          <p className="text-base text-tertiary font-medium">
            Define your personal trading plan. The AI Coach uses these parameters to score your discipline. Leave blank to use universal defaults.
          </p>

          {/* Trading Window */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-6">Time Window (IST)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className={labelStyles}>Start Time</label>
                <input
                  type="time"
                  value={windowStart}
                  onChange={e => setWindowStart(e.target.value)}
                  className={cn(inputStyles, "font-mono bg-surface-1 appearance-none")}
                />
              </div>
              <div>
                <label className={labelStyles}>End Time</label>
                <input
                  type="time"
                  value={windowEnd}
                  onChange={e => setWindowEnd(e.target.value)}
                  className={cn(inputStyles, "font-mono bg-surface-1 appearance-none")}
                />
              </div>
            </div>
          </div>

          {/* Session Limits */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-6">Risk & Volume Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className={labelStyles}>Max Trades / Day</label>
                <input
                  type="number"
                  min="1"
                  value={maxTradesPerDay}
                  onChange={e => setMaxTradesPerDay(e.target.value)}
                  className={cn(inputStyles, "font-mono")}
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className={labelStyles}>Max Daily Loss (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={maxDailyLoss}
                  onChange={e => setMaxDailyLoss(e.target.value)}
                  className={cn(inputStyles, "font-mono")}
                  placeholder="e.g. 2000"
                />
              </div>
              <div>
                <label className={labelStyles}>Max Loss / Trade (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={maxLossPerTrade}
                  onChange={e => setMaxLossPerTrade(e.target.value)}
                  className={cn(inputStyles, "font-mono")}
                  placeholder="e.g. 500"
                />
              </div>
            </div>
          </div>

          {/* Allowed Instruments */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-3">Allowed Instruments</h4>
            <p className="text-xs font-bold text-tertiary uppercase tracking-widest mb-5">Leave unselected to allow all</p>
            <div className="flex flex-wrap gap-4">
              {INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => toggleInstrument(inst)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-bold transition-all border outline-none",
                    allowedInstruments.includes(inst)
                      ? "bg-primary text-canvas border-transparent shadow-md"
                      : "bg-surface-1 border-black/10 dark:border-white/10 text-secondary hover:bg-surface-2 hover:text-primary"
                  )}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Markets */}
          <div>
            <h4 className="text-lg font-bold text-primary mb-3">Allowed Markets</h4>
            <p className="text-xs font-bold text-tertiary uppercase tracking-widest mb-5">Leave unselected to allow all</p>
            <div className="flex flex-wrap gap-4">
              {MARKETS.map(mkt => (
                <button
                  key={mkt}
                  onClick={() => toggleMarket(mkt)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-sm font-bold transition-all border outline-none",
                    allowedMarkets.includes(mkt)
                      ? "bg-primary text-canvas border-transparent shadow-md"
                      : "bg-surface-1 border-black/10 dark:border-white/10 text-secondary hover:bg-surface-2 hover:text-primary"
                  )}
                >
                  {mkt}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            className="w-full h-14 md:h-16 text-lg font-bold"
            disabled={isSavingRules}
            onClick={handleSaveRules}
          >
            {rulesSaved
              ? <><Check className="w-6 h-6 mr-2" /> Saved</>
              : isSavingRules ? 'Saving…'
              : <><BookOpen className="w-6 h-6 mr-2" /> Save Parameters</>
            }
          </Button>
        </div>
      </section>

      {/* SECTION 3: PROFILE */}
      <section className="space-y-6 pt-12">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-4">
          User Profile
          <div className="h-px bg-black/10 dark:bg-white/10 flex-1" />
        </h3>

        <div className="glass-panel p-8 md:p-12 rounded-[2rem] space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-canvas text-2xl font-bold uppercase shadow-lg">
              {profileName ? profileName.slice(0, 2) : 'US'}
            </div>
            <div>
              <div className="text-2xl font-bold text-primary tracking-tight">{profileName || 'Trader'}</div>
              <div className="text-base text-tertiary font-mono mt-1">{timezone}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelStyles}>Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={inputStyles}
              />
            </div>

            <div>
              <label className={labelStyles}>Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={cn(inputStyles, "appearance-none bg-surface-1 cursor-pointer font-semibold")}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 pt-6">
            <Button
              variant="secondary"
              className="flex-1 h-14 md:h-16 text-lg font-bold"
              disabled={isSavingProfile}
              onClick={async () => {
                setIsSavingProfile(true);
                try {
                  const { error } = await updateProfile({ fullName: profileName, timezone });
                  if (error) throw new Error(error);
                  notify.success('Profile saved successfully.');
                } catch (err: any) {
                  notify.error('Failed to save profile: ' + err.message);
                } finally {
                  setIsSavingProfile(false);
                }
              }}
            >
              {isSavingProfile ? 'Saving...' : 'Update Profile'}
            </Button>
            
            <Button
              variant="secondary"
              className="sm:w-40 h-14 md:h-16 text-lg font-bold bg-danger/10 text-danger hover:bg-danger/20 border-0"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </section>

      {/* SECRETS NOTICE */}
      <div className="p-6 bg-surface-1 border border-black/10 dark:border-white/10 rounded-2xl flex gap-4 items-start mt-12 mb-20 shadow-sm">
        <Shield className="h-6 w-6 text-tertiary shrink-0" />
        <div className="text-base text-tertiary leading-relaxed font-medium">
          <strong className="text-secondary font-bold">Security Notice:</strong> Your API Secrets are stored securely using AES-256 encryption in our cloud vault. Credentials are never exposed to the client.
        </div>
      </div>
    </div>
  );
}
