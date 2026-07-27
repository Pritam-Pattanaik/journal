/**
 * DigestPanel — Today's pre-market digest display
 *
 * Shows the compiled morning digest if available,
 * with a "not yet available" state until 7:30 AM IST.
 */

import React, { useEffect } from 'react';
import { useNewsStore } from '../../stores/newsStore';

const DIRECTION_COLORS: Record<string, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
  mixed: '#f59e0b',
};

const DIRECTION_ICONS: Record<string, string> = {
  positive: '▲',
  negative: '▼',
  neutral: '●',
  mixed: '◆',
};

export function DigestPanel() {
  const { todayDigest, loadingDigest, fetchTodayDigest } = useNewsStore();

  useEffect(() => {
    fetchTodayDigest();
  }, []);

  if (loadingDigest) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '28px', height: '28px', margin: '0 auto 10px',
          border: '2px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Loading digest...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!todayDigest?.available) {
    return (
      <div style={{
        padding: '28px 20px', textAlign: 'center',
        background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{ fontSize: '28px', margin: '0 0 10px 0' }}>🌅</p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 6px 0' }}>
          Pre-Market Digest
        </p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '0 0 12px 0' }}>
          {todayDigest?.message || 'Ready at 7:30 AM IST on trading days'}
        </p>
        <div style={{
          padding: '8px 12px', borderRadius: '6px',
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '10px', color: 'rgba(245,158,11,0.6)' }}>
            ⚠️ For educational use only. Not investment advice.
          </p>
        </div>
      </div>
    );
  }

  const digest = todayDigest.digest;
  const sectors: string[] = digest?.sectors || [];
  const allItems = digest?.allItems || [];

  return (
    <div>
      {/* Digest header */}
      <div style={{
        padding: '14px 18px', marginBottom: '12px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.05) 100%)',
        borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              📰 Pre-Market Digest
            </p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              {allItems.length} events analysed · {sectors.length} sectors
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Generated</p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {digest?.generatedAt ? new Date(digest.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '--'} IST
            </p>
          </div>
        </div>
      </div>

      {/* Sectors summary */}
      {sectors.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Active Sectors
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {sectors.map(sector => (
              <span key={sector} style={{
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                background: 'rgba(139,92,246,0.12)', color: 'rgba(167,139,250,0.9)',
                border: '1px solid rgba(139,92,246,0.2)',
              }}>
                {sector}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Items list */}
      <div>
        {allItems.slice(0, 8).map((item: any, i: number) => (
          <div key={i} style={{
            padding: '10px 14px', marginBottom: '6px',
            background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'flex-start', gap: '10px',
          }}>
            <span style={{
              flexShrink: 0, width: '20px', height: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700,
              color: DIRECTION_COLORS[item.direction] || '#6b7280',
            }}>
              {DIRECTION_ICONS[item.direction] || '●'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>
                {item.headline}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(item.sectors || []).slice(0, 2).map((s: string) => (
                  <span key={s} style={{ fontSize: '10px', color: 'rgba(139,92,246,0.7)' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
        background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)',
      }}>
        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(245,158,11,0.6)', lineHeight: '1.5' }}>
          {digest?.disclaimer || '⚠️ Educational Use Only. Not investment advice.'}
        </p>
      </div>
    </div>
  );
}
