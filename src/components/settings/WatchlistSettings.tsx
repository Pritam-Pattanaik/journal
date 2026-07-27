/**
 * WatchlistSettings — Manage sector/ticker watchlist for news engine alerts
 *
 * Allows users to:
 * - Add Nifty sector buckets to their watchlist (get breaking alerts for those sectors)
 * - Remove items from their watchlist
 *
 * COMPLIANCE NOTE: This is relevance filtering, not personalised investment advice.
 * All UI copy must make clear that this controls what news you see, not what you should trade.
 */

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, X, AlertTriangle } from 'lucide-react';
import { useNewsStore, WatchlistItem } from '../../stores/newsStore';
import { notify } from '../../lib/notify';

const SECTOR_ICONS: Record<string, string> = {
  'Nifty Bank': '🏦',
  'Nifty IT': '💻',
  'Nifty Auto': '🚗',
  'Nifty Pharma': '💊',
  'Nifty FMCG': '🛒',
  'Nifty Metal': '⚙️',
  'Nifty Energy': '⚡',
  'Nifty Realty': '🏢',
  'Nifty PSU Bank': '🏛️',
  'Nifty Financial Services': '💰',
};

export function WatchlistSettings() {
  const {
    watchlist, loadingWatchlist, availableSectors,
    fetchWatchlist, addToWatchlist, removeFromWatchlist,
  } = useNewsStore();

  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const watchedSectors = watchlist.filter(w => w.type === 'sector').map(w => w.value);
  const unwatchedSectors = availableSectors.filter(s => !watchedSectors.includes(s));

  const handleAdd = async (sector: string) => {
    setAdding(true);
    try {
      await addToWatchlist('sector', sector);
      notify.success(`Added ${sector} to your watchlist`);
    } catch {
      notify.error('Failed to add to watchlist');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    try {
      await removeFromWatchlist(item.id);
      notify.success(`Removed ${item.value} from watchlist`);
    } catch {
      notify.error('Failed to remove from watchlist');
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
          News Intelligence Watchlist
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>
          Select sectors to receive breaking market alerts and personalised digest summaries.
          This controls <strong>what news you see</strong> — not investment recommendations.
        </p>
      </div>

      {/* Compliance note */}
      <div style={{
        padding: '10px 14px', borderRadius: '8px', marginBottom: '20px',
        background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
        display: 'flex', alignItems: 'flex-start', gap: '8px',
      }}>
        <AlertTriangle size={14} color="rgba(245,158,11,0.8)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(245,158,11,0.7)', lineHeight: '1.5' }}>
          News alerts are for educational awareness only. Sector watchlists do not constitute
          investment advice. TradeVault is not a SEBI-registered Research Analyst.
        </p>
      </div>

      {/* Active watchlist */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
        }}>
          <Bell size={14} color="rgba(139,92,246,0.8)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Your Watchlist ({watchedSectors.length})
          </span>
        </div>

        {loadingWatchlist ? (
          <div style={{
            padding: '20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>Loading...</p>
          </div>
        ) : watchedSectors.length === 0 ? (
          <div style={{
            padding: '20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}>
            <BellOff size={20} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              No sectors in your watchlist yet
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
              Add sectors below to receive breaking alerts
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {watchlist.filter(w => w.type === 'sector').map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)',
              }}>
                <span style={{ fontSize: '14px' }}>{SECTOR_ICONS[item.value] || '📊'}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(167,139,250,0.9)' }}>
                  {item.value}
                </span>
                <button
                  onClick={() => handleRemove(item)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.3)', padding: '2px', borderRadius: '4px',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                  title={`Remove ${item.value}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add sectors */}
      {unwatchedSectors.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
          }}>
            <Plus size={14} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Add Sectors
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unwatchedSectors.map(sector => (
              <button
                key={sector}
                onClick={() => handleAdd(sector)}
                disabled={adding}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                  fontWeight: 600, cursor: adding ? 'not-allowed' : 'pointer',
                  border: '1px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!adding) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.color = '#a78bfa';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                <span style={{ fontSize: '14px' }}>{SECTOR_ICONS[sector] || '📊'}</span>
                {sector}
                <Plus size={10} />
              </button>
            ))}
          </div>
        </div>
      )}

      {watchedSectors.length === availableSectors.length && availableSectors.length > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginTop: '12px',
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(16,185,129,0.8)', fontWeight: 600 }}>
            ✓ Watching all available sectors — you'll receive alerts for any market-moving news.
          </p>
        </div>
      )}
    </div>
  );
}
