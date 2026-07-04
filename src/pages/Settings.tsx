import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, LogOut, Trash2, RefreshCw, BookOpen, Check } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { useBrokerStore } from '../stores/brokerStore';
import { useTradeStore } from '../stores/tradeStore';
import { useTradingRulesStore } from '../stores/tradingRulesStore';

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
  const { connections, fetchConnections, addConnection, removeConnection, syncConnection } = useBrokerStore();
  const fetchTrades = useTradeStore(state => state.fetchTrades);

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

  // Sync local state when rules load from server
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
      alert('Failed to save rules: ' + error);
    } else {
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
  const [syncingBroker, setSyncingBroker] = useState<string | null>(null);

  // Profile fields
  const [profileName, setProfileName] = useState(profile?.fullName || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [isSaving, setIsSaving] = useState(false);

  const activeBrokerInfo = SUPPORTED_BROKERS.find(b => b.id === selectedBroker);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert('API Key is required.');
      return;
    }
    if (selectedBroker === 'dhan' && !clientId) {
      alert('Client ID is strictly required for the DhanHQ API.');
      return;
    }
    if (selectedBroker === 'angelone' && (!apiPassword || !totpSecret || !clientId)) {
      alert('Angel One requires Client Code, Password, and TOTP Secret for automated login.');
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
      alert(error);
    } else {
      setApiKey('');
      setApiSecret('');
      setClientId('');
      setApiPassword('');
      setTotpSecret('');
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async (brokerId: string) => {
    if (confirm(`Are you sure you want to disconnect ${brokerId}?`)) {
      await removeConnection(brokerId);
    }
  };

  const handleSync = async (brokerId: string) => {
    setSyncingBroker(brokerId);
    const { error, count } = await syncConnection(brokerId);
    if (error) {
      alert(error);
    } else {
      alert(`Successfully synced ${count} trades!`);
      // Refresh the trades store so the Trades page shows new data
      await fetchTrades();
    }
    setSyncingBroker(null);
  };

  return (
    <div className="max-w-[600px] space-y-5 page-enter font-ui pb-20">
      {/* Page Header */}
      <div>
        <h2 className="text-tv-lg font-bold text-primary">
          Settings
        </h2>
        <p className="text-tv-sm text-secondary">
          Configure broker API connections, sync preferences, and update profile parameters.
        </p>
      </div>

      {/* SECTION 1: BROKER CONNECTIONS */}
      <div className="space-y-3">
        <span className="label-section text-muted block">Connected Brokers</span>

        {connections.length > 0 ? (
          <div className="space-y-3">
            {connections.map((conn) => {
              const brokerName = SUPPORTED_BROKERS.find(b => b.id === conn.broker)?.name || conn.broker;
              return (
                <div key={conn.id} className="card space-y-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-tv-md text-primary">{brokerName}</span>
                      <Badge variant="win">Connected</Badge>
                    </div>
                    {conn.clientId && <div className="text-tv-xs font-mono text-secondary mt-1">Client ID: {conn.clientId}</div>}
                    {conn.lastSyncedAt && <div className="text-tv-xs text-secondary mt-1">Last synced: {new Date(conn.lastSyncedAt).toLocaleString()}</div>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="ghost" size="sm" onClick={() => handleSync(conn.broker)} disabled={syncingBroker === conn.broker}>
                      <RefreshCw className={`w-4 h-4 mr-1.5 ${syncingBroker === conn.broker ? 'animate-spin' : ''}`} /> Sync Trades
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDisconnect(conn.broker)}>
                      <Trash2 className="w-4 h-4 mr-1.5" /> Disconnect
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-tv-sm text-secondary p-4 bg-base/50 rounded-tv-md border border-tv-border border-dashed text-center">
            No brokers connected. Configure a new connection below.
          </div>
        )}

        {/* Add New Connection Form */}
        <div className="card space-y-4 mt-6">
          <div>
            <h3 className="font-semibold text-tv-md text-primary mb-1">Add Broker Integration</h3>
            <p className="text-tv-xs text-secondary">Connect your broker account to sync trades automatically.</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                Select Broker
              </label>
              <select
                value={selectedBroker}
                onChange={(e) => {
                  setSelectedBroker(e.target.value);
                  setApiKey('');
                  setApiSecret('');
                  setClientId('');
                }}
                className="input-base cursor-pointer bg-base"
              >
                {SUPPORTED_BROKERS.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                  {selectedBroker === 'dhan' ? 'Access Token (JWT)' : 'API Key'}
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedBroker === 'dhan' ? "Enter Access Token" : "Enter API Key"}
                  className="input-base font-mono"
                  required
                />
              </div>

              {activeBrokerInfo?.requiresSecret && (
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                    API Secret
                  </label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter API Secret"
                    className="input-base font-mono"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                  Client ID {selectedBroker !== 'dhan' && selectedBroker !== 'angelone' && <span className="text-muted normal-case">(Optional)</span>}
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={selectedBroker === 'angelone' ? "Enter Client Code" : "e.g. AB1234"}
                  className="input-base font-mono"
                  required={selectedBroker === 'dhan' || selectedBroker === 'angelone'}
                />
              </div>

              {selectedBroker === 'angelone' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                      Angel One Password
                    </label>
                    <input
                      type="password"
                      value={apiPassword}
                      onChange={(e) => setApiPassword(e.target.value)}
                      placeholder="Enter Password"
                      className="input-base font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                      TOTP Secret (Auth Token)
                    </label>
                    <input
                      type="password"
                      value={totpSecret}
                      onChange={(e) => setTotpSecret(e.target.value)}
                      placeholder="e.g. JBSWY3DPEHPK3PXP"
                      className="input-base font-mono"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <Button variant="primary" size="md" type="submit" disabled={isConnecting} className="w-full">
              {isConnecting ? 'Connecting...' : `Connect ${activeBrokerInfo?.name}`}
            </Button>
          </form>

          {/* Warning Banner */}
          <div className="border border-gold-border bg-gold-dim/40 rounded-tv-lg p-3 flex gap-2.5 items-start mt-2">
            <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <div className="text-tv-xs text-secondary leading-relaxed">
              <strong className="text-gold">Token Expiry:</strong> Some brokers (like Zerodha) expire tokens daily at 6:00 AM IST. You may need to manually authenticate the OAuth handshake every morning to continue receiving real-time fills.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: MY TRADING RULES */}
      <div className="space-y-3 pt-4">
        <span className="label-section text-muted block">My Trading Rules</span>
        <p className="text-tv-xs text-secondary -mt-1 mb-2">
          Define your personal trading plan. The discipline scorer uses these rules on top of universal signals.
          Leave a field blank to use universal defaults only.
        </p>

        <div className="card space-y-5">
          {/* Trading Window */}
          <div>
            <h4 className="text-tv-sm font-semibold text-primary mb-3">Trading Window (IST)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Start Time</label>
                <input
                  type="time"
                  value={windowStart}
                  onChange={e => setWindowStart(e.target.value)}
                  className="input-base font-mono"
                  placeholder="10:00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">End Time</label>
                <input
                  type="time"
                  value={windowEnd}
                  onChange={e => setWindowEnd(e.target.value)}
                  className="input-base font-mono"
                  placeholder="14:00"
                />
              </div>
            </div>
          </div>

          {/* Session & Loss Limits */}
          <div>
            <h4 className="text-tv-sm font-semibold text-primary mb-3">Session & Loss Limits</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Max Trades / Day</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxTradesPerDay}
                  onChange={e => setMaxTradesPerDay(e.target.value)}
                  className="input-base font-mono"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Max Daily Loss (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={maxDailyLoss}
                  onChange={e => setMaxDailyLoss(e.target.value)}
                  className="input-base font-mono"
                  placeholder="e.g. 2000"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">Max Loss / Trade (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={maxLossPerTrade}
                  onChange={e => setMaxLossPerTrade(e.target.value)}
                  className="input-base font-mono"
                  placeholder="e.g. 500"
                />
              </div>
            </div>
          </div>

          {/* Allowed Instruments */}
          <div>
            <h4 className="text-tv-sm font-semibold text-primary mb-1">Allowed Instruments</h4>
            <p className="text-tv-xs text-muted mb-3">Leave all unselected to allow any instrument.</p>
            <div className="flex flex-wrap gap-2">
              {INSTRUMENTS.map(inst => (
                <button
                  key={inst}
                  onClick={() => toggleInstrument(inst)}
                  className={`px-3 py-1.5 rounded-tv-md text-tv-xs font-semibold border transition-all ${
                    allowedInstruments.includes(inst)
                      ? 'bg-accent/20 border-accent text-accent-light'
                      : 'bg-base border-tv-border text-secondary hover:border-accent/50'
                  }`}
                >
                  {allowedInstruments.includes(inst) && <Check className="inline w-3 h-3 mr-1" />}
                  {inst}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Markets */}
          <div>
            <h4 className="text-tv-sm font-semibold text-primary mb-1">Allowed Markets</h4>
            <p className="text-tv-xs text-muted mb-3">Leave all unselected to allow any market.</p>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map(mkt => (
                <button
                  key={mkt}
                  onClick={() => toggleMarket(mkt)}
                  className={`px-3 py-1.5 rounded-tv-md text-tv-xs font-semibold border transition-all ${
                    allowedMarkets.includes(mkt)
                      ? 'bg-accent/20 border-accent text-accent-light'
                      : 'bg-base border-tv-border text-secondary hover:border-accent/50'
                  }`}
                >
                  {allowedMarkets.includes(mkt) && <Check className="inline w-3 h-3 mr-1" />}
                  {mkt}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={isSavingRules}
            onClick={handleSaveRules}
          >
            {rulesSaved
              ? <><Check className="w-4 h-4 mr-1.5" /> Rules Saved!</>
              : isSavingRules ? 'Saving…'
              : <><BookOpen className="w-4 h-4 mr-1.5" /> Save My Trading Rules</>
            }
          </Button>

          <div className="border border-tv-border bg-base/30 rounded-tv-lg p-3 text-tv-xs text-secondary leading-relaxed">
            <strong className="text-primary">How it works:</strong> After saving, click <strong>Sync Trades</strong> in the Connected Brokers section.
            The discipline scorer will re-evaluate all your trades using both universal signals <em>and</em> your personal rules.
            Trades that break your own rules will score lower than universal analysis alone.
          </div>
        </div>
      </div>

      {/* SECTION 3: PROFILE */}
      <div className="space-y-3 pt-4">
        <span className="label-section text-muted block">User Profile</span>

        <div className="card space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-light text-tv-md font-semibold uppercase">
              {profileName ? profileName.slice(0, 2) : 'US'}
            </div>
            <div>
              <div className="text-tv-base font-semibold text-primary">{profileName || 'Trader'}</div>
              <div className="text-tv-xs text-secondary font-mono">{timezone}</div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="input-base"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="input-base cursor-pointer bg-base"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="md"
              className="w-full border-tv-border"
              disabled={isSaving}
              onClick={async () => {
                setIsSaving(true);
                try {
                  const { error } = await updateProfile({ fullName: profileName, timezone });
                  if (error) throw new Error(error);
                  alert('Profile details saved.');
                } catch (err: any) {
                  alert('Failed to save profile: ' + err.message);
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save Profile Details'}
            </Button>
            
            <Button
              variant="danger"
              size="md"
              className="w-full mt-4 flex items-center justify-center gap-2"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 3: OTHER NOTES */}
      <div className="border border-gold-border bg-gold-dim/40 rounded-tv-lg p-3 flex gap-2.5 items-start mt-4">
        <Shield className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div className="text-tv-xs text-secondary leading-relaxed">
          <strong className="text-gold">Security Notice:</strong> Your API Secrets are stored securely in our cloud vault. We never share your broker credentials with third parties.
        </div>
      </div>
    </div>
  );
}
