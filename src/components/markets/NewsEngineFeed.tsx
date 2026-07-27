/**
 * NewsEngineFeed — AI-powered market intelligence feed panel
 *
 * Displays processed news items from the pipeline with:
 * - Sector filter tabs
 * - Direction + confidence badges
 * - Educational rationale display
 * - Mandatory SEBI disclaimer on every card
 * - Breaking vs routine visual differentiation
 */

import React, { useEffect, useState } from 'react';
import { useNewsStore, EngineFeedItem } from '../../stores/newsStore';

const DIRECTION_CONFIG = {
  positive: { label: 'Positive', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: '▲' },
  negative: { label: 'Negative', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: '▼' },
  neutral:  { label: 'Neutral',  color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', icon: '●' },
  mixed:    { label: 'Mixed',    color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: '◆' },
} as const;

const CONFIDENCE_CONFIG = {
  high:   { label: 'High Confidence',   color: '#10b981' },
  medium: { label: 'Med. Confidence',   color: '#f59e0b' },
  low:    { label: 'Early Stage',        color: '#6b7280' },
} as const;

const SOURCE_LABEL: Record<string, string> = {
  NSE: 'NSE',
  BSE: 'BSE',
  RBI: 'RBI',
  PIB: 'PIB',
  MACRO: 'Macro',
  NEWSDATA: 'News',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface FeedCardProps {
  item: EngineFeedItem;
  expanded: boolean;
  onToggle: () => void;
}

function FeedCard({ item, expanded, onToggle }: FeedCardProps) {
  const dir = DIRECTION_CONFIG[item.direction] || DIRECTION_CONFIG.neutral;
  const conf = CONFIDENCE_CONFIG[item.confidence] || CONFIDENCE_CONFIG.low;
  const isBreaking = item.urgency === 'breaking';

  return (
    <div
      onClick={onToggle}
      style={{
        background: isBreaking
          ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(20,20,30,0.8) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: isBreaking ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = isBreaking
          ? 'linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(25,25,40,0.9) 100%)'
          : 'rgba(255,255,255,0.05)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = isBreaking
          ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(20,20,30,0.8) 100%)'
          : 'rgba(255,255,255,0.03)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Breaking pulse indicator */}
      {isBreaking && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '3px', height: '100%',
          background: 'linear-gradient(180deg, #ef4444, #f87171)',
          borderRadius: '12px 0 0 12px',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        {/* Direction badge */}
        <div style={{
          flexShrink: 0, marginTop: '1px',
          width: '28px', height: '28px', borderRadius: '8px',
          background: dir.bg, color: dir.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700,
        }}>
          {dir.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            {isBreaking && (
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                color: '#ef4444', background: 'rgba(239,68,68,0.15)',
                padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase',
              }}>⚡ Breaking</span>
            )}
            <span style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.4)',
              background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px',
            }}>
              {SOURCE_LABEL[item.source] || item.source}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
              {timeAgo(item.publishedAt)}
            </span>
          </div>

          {/* Headline */}
          <p style={{
            margin: 0, fontSize: '13px', fontWeight: 600,
            color: 'rgba(255,255,255,0.9)', lineHeight: '1.4',
          }}>
            {item.headline}
          </p>
        </div>
      </div>

      {/* Sector pills */}
      {item.sectors.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px', paddingLeft: '38px' }}>
          {item.sectors.map(sector => (
            <span key={sector} style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(139, 92, 246, 0.12)', color: 'rgba(167, 139, 250, 0.9)',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              {sector}
            </span>
          ))}
        </div>
      )}

      {/* Direction + Confidence badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '38px' }}>
        <span style={{
          fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
          background: dir.bg, color: dir.color, fontWeight: 600,
        }}>
          {dir.label}
        </span>
        <span style={{ fontSize: '11px', color: conf.color, fontWeight: 500 }}>
          · {conf.label}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          {expanded ? '▲ Less' : '▼ Analysis'}
        </span>
      </div>

      {/* Expanded rationale */}
      {expanded && (
        <div style={{
          marginTop: '14px', paddingTop: '14px', paddingLeft: '38px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{
            margin: '0 0 12px 0', fontSize: '13px',
            color: 'rgba(255,255,255,0.7)', lineHeight: '1.6',
          }}>
            {item.rationale}
          </p>

          {item.historicalAnalogues && item.historicalAnalogues.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Historical Context
              </p>
              {item.historicalAnalogues.slice(0, 2).map((analogue, i) => (
                <p key={i} style={{
                  margin: '0 0 4px 0', fontSize: '12px',
                  color: 'rgba(255,255,255,0.5)', paddingLeft: '8px',
                  borderLeft: '2px solid rgba(139,92,246,0.3)',
                }}>
                  {analogue}
                </p>
              ))}
            </div>
          )}

          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
              fontSize: '11px', color: 'rgba(139,92,246,0.8)', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '4px',
            }}
              onClick={e => e.stopPropagation()}
            >
              View Source ↗
            </a>
          )}

          {/* SEBI Disclaimer — mandatory on every card */}
          <div style={{
            marginTop: '12px', padding: '8px 12px', borderRadius: '6px',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
          }}>
            <p style={{ margin: 0, fontSize: '10px', color: 'rgba(245,158,11,0.7)', lineHeight: '1.5' }}>
              {item.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface NewsEngineFeedProps {
  compact?: boolean;
}

export function NewsEngineFeed({ compact = false }: NewsEngineFeedProps) {
  const {
    engineFeed, loadingFeed, feedError, selectedSector,
    availableSectors, fetchEngineFeed, fetchAvailableSectors, setSelectedSector,
  } = useNewsStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  useEffect(() => {
    fetchAvailableSectors();
    fetchEngineFeed({ limit: compact ? 10 : 25 });
  }, []);

  const handleSectorChange = (sector: string | null) => {
    setSelectedSector(sector);
  };

  const filteredFeed = directionFilter === 'all'
    ? engineFeed
    : engineFeed.filter(i => i.direction === directionFilter);

  const breakingCount = engineFeed.filter(i => i.urgency === 'breaking').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: breakingCount > 0 ? '#ef4444' : '#10b981',
            boxShadow: breakingCount > 0 ? '0 0 8px #ef4444' : '0 0 8px #10b981',
            animation: breakingCount > 0 ? 'pulse 1.5s infinite' : 'none',
          }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            AI Market Intelligence
          </span>
          {breakingCount > 0 && (
            <span style={{
              fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 600,
            }}>
              {breakingCount} Breaking
            </span>
          )}
        </div>

        {/* Direction filter */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', 'positive', 'negative', 'mixed'].map(d => (
            <button key={d} onClick={() => setDirectionFilter(d)} style={{
              padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: directionFilter === d ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
              color: directionFilter === d ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            }}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sector filter pills */}
      {!compact && availableSectors.length > 0 && (
        <div style={{
          display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '14px',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => handleSectorChange(null)}
            style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
              fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: !selectedSector ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
              color: !selectedSector ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            All Sectors
          </button>
          {availableSectors.map(sector => (
            <button key={sector} onClick={() => handleSectorChange(sector)} style={{
              flexShrink: 0, padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
              fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: selectedSector === sector ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
              color: selectedSector === sector ? '#a78bfa' : 'rgba(255,255,255,0.4)',
              whiteSpace: 'nowrap',
            }}>
              {sector}
            </button>
          ))}
        </div>
      )}

      {/* Feed content */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {loadingFeed && (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{
              width: '32px', height: '32px', margin: '0 auto 12px',
              border: '2px solid rgba(139,92,246,0.2)',
              borderTopColor: '#8b5cf6', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              Loading market intelligence...
            </p>
          </div>
        )}

        {!loadingFeed && feedError && (
          <div style={{
            padding: '20px', textAlign: 'center',
            background: 'rgba(239,68,68,0.06)', borderRadius: '10px',
            border: '1px solid rgba(239,68,68,0.15)',
          }}>
            <p style={{ fontSize: '13px', color: 'rgba(239,68,68,0.8)', margin: '0 0 8px 0' }}>
              Pipeline unavailable
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              The AI engine is starting up or temporarily offline. Check back in a moment.
            </p>
            <button
              onClick={() => fetchEngineFeed()}
              style={{
                marginTop: '12px', padding: '6px 16px', borderRadius: '6px',
                background: 'rgba(139,92,246,0.2)', color: '#a78bfa',
                border: '1px solid rgba(139,92,246,0.3)', cursor: 'pointer', fontSize: '12px',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loadingFeed && !feedError && filteredFeed.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>📰</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px 0' }}>
              No items yet
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              The pipeline is warming up. Market-hours items will appear here.
            </p>
          </div>
        )}

        {!loadingFeed && filteredFeed.map(item => (
          <FeedCard
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
          />
        ))}
      </div>

      {/* Global disclaimer footer */}
      {filteredFeed.length > 0 && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '8px',
          background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)',
        }}>
          <p style={{ margin: 0, fontSize: '10px', color: 'rgba(245,158,11,0.6)', lineHeight: '1.5' }}>
            ⚠️ All analysis is for educational purposes only and does not constitute investment advice.
            TradeVault is not a SEBI-registered Research Analyst.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
