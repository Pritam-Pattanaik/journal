/**
 * SystemHealth — Developer-Only Diagnostics Page
 * Accessible at /app/system-health
 * Toggled via Ctrl+Shift+D shortcut registered in DevToolsOverlay
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  Activity, BarChart3, Cpu, Server, Radio, Zap,
  CheckCircle, XCircle, RefreshCw,
} from "lucide-react";
import { api, BASE_URL } from "../lib/api";

interface MarketHealth {
  providers: Record<string, {
    name: string;
    healthy: boolean;
    failCount: number;
    lastSuccessAt: number | null;
    lastFailAt: number | null;
  }>;
  lastUpdate: number;
}

interface NewsEngineHealth {
  status: "healthy" | "degraded" | "down";
  engine: { running: boolean; mode: string };
  pipeline: {
    itemsLast1h: number;
    triagePassRate: string;
    triageCircuitBreaker: string;
    scoringCircuitBreaker: string;
  };
  costs: { triageDailyUsd: string; scoringDailyUsd: string };
}

interface ServerHealth {
  status: string;
  timestamp: string;
}

function StatusChip({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{
        background: ok ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
        color: ok ? "#10b981" : "#ef4444",
        border: `1px solid ${ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      {ok ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {label ?? (ok ? "OK" : "FAIL")}
    </span>
  );
}

function MetricRow({ label, value, status }: { label: string; value?: React.ReactNode; status?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] text-white/40">{label}</span>
      <span className="text-[12px] font-mono font-semibold text-white/70">
        {status !== undefined ? <StatusChip ok={status} /> : value}
      </span>
    </div>
  );
}

function SectionCard({ title, icon, children, refreshFn, loading }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  refreshFn?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-violet-400">{icon}</span>
          <h3 className="text-[13px] font-bold text-white/80">{title}</h3>
        </div>
        {refreshFn && (
          <button onClick={refreshFn} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SystemHealth() {
  const [marketHealth, setMarketHealth] = useState<MarketHealth | null>(null);
  const [newsHealth, setNewsHealth] = useState<NewsEngineHealth | null>(null);
  const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingServer, setLoadingServer] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [sseConnected, setSseConnected] = useState<boolean | null>(null);

  const fetchMarketHealth = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const data = await api.get<MarketHealth>("/market/health");
      setMarketHealth(data);
    } catch { /* ignore */ } finally {
      setLoadingMarket(false);
    }
  }, []);

  const fetchNewsHealth = useCallback(async () => {
    setLoadingNews(true);
    try {
      const data = await api.get<NewsEngineHealth>("/news-engine/health");
      setNewsHealth(data);
    } catch { /* ignore */ } finally {
      setLoadingNews(false);
    }
  }, []);

  const fetchServerHealth = useCallback(async () => {
    setLoadingServer(true);
    try {
      const data = await api.get<ServerHealth>("/health");
      setServerHealth(data);
    } catch { /* ignore */ } finally {
      setLoadingServer(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.allSettled([fetchMarketHealth(), fetchNewsHealth(), fetchServerHealth()]);
    setLastRefresh(new Date());
  }, [fetchMarketHealth, fetchNewsHealth, fetchServerHealth]);

  // SSE connectivity probe
  useEffect(() => {
    const es = new EventSource(`${BASE_URL}/market/stream`, { withCredentials: true });
    const timeout = setTimeout(() => { setSseConnected(false); es.close(); }, 8000);
    es.onmessage = () => { clearTimeout(timeout); setSseConnected(true); es.close(); };
    es.onerror = () => { clearTimeout(timeout); setSseConnected(false); es.close(); };
    return () => { clearTimeout(timeout); es.close(); };
  }, []);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 30_000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const formatTime = (ts: number | null) => {
    if (!ts) return "Never";
    const diff = Date.now() - ts;
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
    return `${Math.floor(diff / 60_000)}m ago`;
  };

  return (
    <div className="w-full min-h-screen bg-canvas pb-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={20} className="text-violet-400" />
              <h1 className="text-xl font-bold text-white/90">System Health Center</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>DEV ONLY</span>
            </div>
            <p className="text-[12px] text-white/35">
              Real-time diagnostics · Auto-refreshes every 30s
              {lastRefresh && <span className="ml-2 text-white/20">Last: {lastRefresh.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button onClick={refreshAll} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-bold text-violet-400 transition-colors" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <RefreshCw size={12} />Refresh All
          </button>
        </div>

        {/* Quick status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Server size={16} className="text-blue-400" />, label: "Backend", chip: <StatusChip ok={serverHealth?.status === "ok"} label={serverHealth?.status ?? "..."} /> },
            { icon: <Radio size={16} className="text-emerald-400" />, label: "SSE", chip: sseConnected === null ? <span className="text-[11px] text-white/40">Checking...</span> : <StatusChip ok={sseConnected} label={sseConnected ? "Connected" : "Failed"} /> },
            { icon: <Cpu size={16} className="text-yellow-400" />, label: "News Engine", chip: newsHealth ? <StatusChip ok={newsHealth.status === "healthy"} label={newsHealth.status} /> : <span className="text-[11px] text-white/40">Loading...</span> },
            { icon: <Zap size={16} className="text-violet-400" />, label: "Market API", chip: marketHealth ? <StatusChip ok={Object.values(marketHealth.providers).some(p => p.healthy)} /> : <span className="text-[11px] text-white/40">Loading...</span> },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {item.icon}
              <div>
                <p className="text-[10px] text-white/35 uppercase font-bold">{item.label}</p>
                {item.chip}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Market Data Providers" icon={<BarChart3 size={14} />} refreshFn={fetchMarketHealth} loading={loadingMarket}>
            {marketHealth ? (
              <div className="flex flex-col gap-2">
                {Object.values(marketHealth.providers).map(provider => (
                  <div key={provider.name} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-white/70 capitalize">{provider.name}</span>
                      <StatusChip ok={provider.healthy} />
                    </div>
                    <MetricRow label="Fail Count" value={provider.failCount} />
                    <MetricRow label="Last Success" value={formatTime(provider.lastSuccessAt)} />
                  </div>
                ))}
                <MetricRow label="Last Worker Update" value={formatTime(marketHealth.lastUpdate)} />
              </div>
            ) : <div className="text-center py-4 text-white/30 text-[12px]">Loading...</div>}
          </SectionCard>

          <SectionCard title="AI News Engine" icon={<Cpu size={14} />} refreshFn={fetchNewsHealth} loading={loadingNews}>
            {newsHealth ? (
              <div>
                <MetricRow label="Engine Running" status={newsHealth.engine.running} />
                <MetricRow label="Mode" value={newsHealth.engine.mode} />
                <MetricRow label="Items (Last 1h)" value={newsHealth.pipeline.itemsLast1h} />
                <MetricRow label="Triage Pass Rate" value={newsHealth.pipeline.triagePassRate} />
                <MetricRow label="Triage Circuit" value={newsHealth.pipeline.triageCircuitBreaker} />
                <MetricRow label="Scoring Circuit" value={newsHealth.pipeline.scoringCircuitBreaker} />
                <MetricRow label="Triage Cost/Day" value={`$${newsHealth.costs.triageDailyUsd}`} />
                <MetricRow label="Scoring Cost/Day" value={`$${newsHealth.costs.scoringDailyUsd}`} />
              </div>
            ) : <div className="text-center py-4 text-white/30 text-[12px]">Loading...</div>}
          </SectionCard>

          <SectionCard title="Backend Server" icon={<Server size={14} />} refreshFn={fetchServerHealth} loading={loadingServer}>
            {serverHealth ? (
              <div>
                <MetricRow label="Status" status={serverHealth.status === "ok"} />
                <MetricRow label="Server Time" value={new Date(serverHealth.timestamp).toLocaleString()} />
                <MetricRow label="Environment" value={import.meta.env.MODE} />
                <MetricRow label="API Base" value={import.meta.env.VITE_API_URL || "/api (proxy)"} />
              </div>
            ) : <div className="text-center py-4 text-white/30 text-[12px]">Loading...</div>}
          </SectionCard>

          <SectionCard title="SSE Live Stream" icon={<Radio size={14} />}>
            <MetricRow label="Connection" status={sseConnected ?? false} />
            <MetricRow label="Heartbeat" value="30s" />
            <MetricRow label="Backoff" value="Exp (5s → 60s max)" />
            <MetricRow label="Max Retries" value="10" />
            <MetricRow label="Auth" value="Cookie-based (HttpOnly)" />
            <MetricRow label="Broadcast Type" value="EventEmitter → EventSource" />
          </SectionCard>
        </div>

        <div className="mt-6 p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-[10px] text-white/20">
            🔒 Developer diagnostics · Press <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/40 font-mono text-[10px]">Ctrl+Shift+D</kbd> to toggle
          </p>
        </div>
      </div>
    </div>
  );
}
