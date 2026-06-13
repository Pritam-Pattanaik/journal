import React, { useState } from 'react';
import { Shield, AlertTriangle, LogOut } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const { profile, signOut, updateProfile } = useAuthStore();
  const [zerodhaConnected, setZerodhaConnected] = useState(false);
  const [angelOneConnected, setAngelOneConnected] = useState(false);

  // AngelOne Form fields
  const [angelKey, setAngelKey] = useState('');
  const [angelClientId, setAngelClientId] = useState('');
  const [angelMpin, setAngelMpin] = useState('');

  // Profile fields
  const [profileName, setProfileName] = useState(profile?.fullName || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [isSaving, setIsSaving] = useState(false);

  const handleZerodhaToggle = () => {
    if (zerodhaConnected) {
      if (confirm('Disconnect Zerodha Kite account?')) {
        setZerodhaConnected(false);
      }
    } else {
      setZerodhaConnected(true);
    }
  };

  const handleAngelConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!angelKey || !angelClientId || !angelMpin) {
      alert('Please fill in all AngelOne credentials.');
      return;
    }
    setAngelOneConnected(true);
  };

  const handleAngelDisconnect = () => {
    if (confirm('Disconnect AngelOne account?')) {
      setAngelOneConnected(false);
      setAngelKey('');
      setAngelClientId('');
      setAngelMpin('');
    }
  };

  return (
    <div className="max-w-[600px] space-y-5 page-enter font-ui">
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
        <span className="label-section text-muted block">Broker Connections</span>

        {/* Zerodha Card */}
        <div className="card space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-tv-md text-primary">Zerodha Kite</span>
              {zerodhaConnected ? (
                <Badge variant="win">Connected</Badge>
              ) : (
                <Badge variant="accent">Disconnected</Badge>
              )}
            </div>
            {zerodhaConnected ? (
              <Button variant="danger" size="sm" onClick={handleZerodhaToggle}>
                Disconnect
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleZerodhaToggle}>
                Connect via Kite OAuth
              </Button>
            )}
          </div>

          {zerodhaConnected && (
            <div className="text-tv-sm text-secondary space-y-1 bg-base/20 border border-tv-border rounded-tv-sm p-3 font-mono">
              <div>Client ID: AB1234</div>
              <div>Last Synced: 2026-06-06 15:45 PM IST</div>
            </div>
          )}

          {/* Warning Banner */}
          <div className="border border-gold-border bg-gold-dim/40 rounded-tv-lg p-3 flex gap-2.5 items-start">
            <AlertTriangle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
            <div className="text-tv-xs text-secondary leading-relaxed">
              <strong className="text-gold">Kite Token Expiry Warning:</strong> Zerodha Kite Connect access tokens expire daily at 6:00 AM IST. You must complete the OAuth authorization handshake again when you first login each day to maintain automatic sync.
            </div>
          </div>
        </div>

        {/* AngelOne Card */}
        <div className="card space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-tv-md text-primary">AngelOne SmartAPI</span>
              {angelOneConnected ? (
                <Badge variant="win">Connected</Badge>
              ) : (
                <Badge variant="accent">Disconnected</Badge>
              )}
            </div>
            {angelOneConnected && (
              <Button variant="danger" size="sm" onClick={handleAngelDisconnect}>
                Disconnect
              </Button>
            )}
          </div>

          {angelOneConnected ? (
            <div className="text-tv-sm text-secondary space-y-1 bg-base/20 border border-tv-border rounded-tv-sm p-3 font-mono">
              <div>Client ID: ANG-9942</div>
              <div>Last Synced: 2026-06-06 15:46 PM IST</div>
            </div>
          ) : (
            <form onSubmit={handleAngelConnect} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                    API Key
                  </label>
                  <input
                    type="text"
                    value={angelKey}
                    onChange={(e) => setAngelKey(e.target.value)}
                    placeholder="Enter API Key"
                    className="input-base font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={angelClientId}
                    onChange={(e) => setAngelClientId(e.target.value)}
                    placeholder="Enter Client ID"
                    className="input-base font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-secondary font-medium uppercase tracking-wider block">
                  MPIN
                </label>
                <input
                  type="password"
                  value={angelMpin}
                  onChange={(e) => setAngelMpin(e.target.value)}
                  placeholder="Enter 4-digit MPIN"
                  maxLength={4}
                  className="input-base font-mono"
                />
              </div>
              <Button variant="primary" size="md" type="submit" className="w-full">
                Connect AngelOne
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* SECTION 2: PROFILE */}
      <div className="space-y-3">
        <span className="label-section text-muted block">User Profile</span>

        <div className="card space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent-light text-tv-md font-semibold">
              VM
            </div>
            <div>
              <div className="text-tv-base font-semibold text-primary">{profileName}</div>
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
      <div className="border border-gold-border bg-gold-dim/40 rounded-tv-lg p-3 flex gap-2.5 items-start">
        <Shield className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <div className="text-tv-xs text-secondary leading-relaxed">
          <strong className="text-gold">Exchange Limitations:</strong> TradeVault auto-sync currently supports Indian Stock Exchanges (NSE / F&O). Support for Crypto exchanges (Binance, Coinbase) is not available in Version 1. Crypto transactions must be logged manually via the Trade Log manual entry screen (Phase 2).
        </div>
      </div>
    </div>
  );
}
