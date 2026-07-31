/**
 * InteractiveMarketChart.tsx — Production-grade rewrite
 *
 * Architecture:
 * - Chart instance is created ONCE on mount, never destroyed on data updates.
 * - Data, crosshair mode, and chart type are updated imperatively via the lightweight-charts API.
 * - Hover data uses a stable ref-based callback (no stale closures).
 * - All toolbar buttons are fully functional.
 * - A rich OHLC tooltip tracks the cursor.
 * - Fullscreen syncs with the Escape key via fullscreenchange events.
 * - Download correctly composites chart onto a white/dark bg canvas before saving.
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineStyle,
  ColorType,
  SeriesType,
  MouseEventParams,
} from 'lightweight-charts';
import {
  Crosshair,
  BarChart2,
  Activity,
  Download,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useLiveChartData, ChartCandle } from '../../hooks/useLiveMarketData';
import { isMarketOpen } from '../../lib/dateUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD', 'Max'];

const SYMBOLS = [
  { key: 'nifty',     label: 'NIFTY 50' },
  { key: 'banknifty', label: 'BANK NIFTY' },
  { key: 'finnifty',  label: 'FINNIFTY' },
  { key: 'sensex',    label: 'SENSEX' },
  { key: 'vix',       label: 'INDIA VIX' },
];

// ─── Theme helpers ────────────────────────────────────────────────────────────

const CHART_COLORS = {
  up: '#22C55E',
  down: '#EF4444',
  grid: 'rgba(255,255,255,0.06)',
  text: '#6B7280',
  accent: '#3B82F6',
  bg: 'rgba(0,0,0,0)',
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipData {
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  time: string;
  priceChange: number;
  pctChange: number;
  isPositive: boolean;
  x: number;
  y: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  symbol?: string;
  onSymbolChange?: (sym: string) => void;
}

export default function InteractiveMarketChart({ symbol: propSymbol, onSymbolChange }: Props = {}) {
  const [localSymbol, setLocalSymbol] = useState('nifty');
  const symbol = propSymbol ?? localSymbol;
  const setSymbol = onSymbolChange ?? setLocalSymbol;

  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState<'area' | 'candle'>('area');
  const [magnet, setMagnet]       = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip]     = useState<TooltipData | null>(null);

  const containerRef  = useRef<HTMLDivElement>(null);
  const wrapperRef    = useRef<HTMLDivElement>(null);
  const chartRef      = useRef<IChartApi | null>(null);
  const seriesRef     = useRef<ISeriesApi<SeriesType> | null>(null);
  const dataRef       = useRef<ChartCandle[]>([]);  // stable ref for hover closure

  const { data, loading, error } = useLiveChartData(symbol, timeframe);

  // Keep dataRef in sync for the crosshair callback without adding it as a dep
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // ── Compute derived values ─────────────────────────────────────────────────

  const latest   = data[data.length - 1];
  const baseline = data[0];

  const defaultChange = useMemo(() => {
    if (!latest || !baseline) return { change: 0, pct: 0, isUp: true };
    const change = latest.close - baseline.close;
    const pct    = (change / baseline.close) * 100;
    return { change, pct, isUp: change >= 0 };
  }, [latest, baseline]);

  const displayPrice      = tooltip ? tooltip.price      : latest?.close ?? 0;
  const displayChange     = tooltip ? tooltip.priceChange : defaultChange.change;
  const displayPct        = tooltip ? tooltip.pctChange   : defaultChange.pct;
  const displayIsPositive = tooltip ? tooltip.isPositive  : defaultChange.isUp;

  // ── Stable crosshair handler (reads dataRef, not stale closure) ────────────

  const handleCrosshairMove = useCallback((param: MouseEventParams) => {
    const el  = containerRef.current;
    const s   = seriesRef.current;
    const d   = dataRef.current;
    if (!el || !s || d.length === 0) { setTooltip(null); return; }

    const { point, time, seriesData } = param;

    if (
      !point || !time ||
      point.x < 0 || point.x > el.clientWidth ||
      point.y < 0 || point.y > el.clientHeight
    ) {
      setTooltip(null);
      return;
    }

    const raw = seriesData.get(s) as any;
    if (!raw) { setTooltip(null); return; }

    const price: number  = raw.value  ?? raw.close ?? 0;
    const open: number   = raw.open   ?? price;
    const high: number   = raw.high   ?? price;
    const low: number    = raw.low    ?? price;
    const close: number  = raw.close  ?? price;

    const basePrice       = d[0].close;
    const priceChange     = price - basePrice;
    const pctChange       = (priceChange / basePrice) * 100;
    const isPositive      = priceChange >= 0;

    const ts  = (time as number) * 1000;
    const dateObj = new Date(ts);
    const timeStr = dateObj.toLocaleTimeString('en-IN', {
      hour:   '2-digit',
      minute: '2-digit',
    }) + '  ·  ' + dateObj.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    setTooltip({ price, open, high, low, close, time: timeStr, priceChange, pctChange, isPositive, x: point.x, y: point.y });
  }, []); // stable — reads refs, not state

  // ── Initialize chart ONCE on mount ────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.bg },
        textColor:  CHART_COLORS.text,
        fontFamily: 'Inter, "DM Sans", system-ui, sans-serif',
        fontSize:   11,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid, style: LineStyle.SparseDotted },
        horzLines: { color: CHART_COLORS.grid, style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_COLORS.accent,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: CHART_COLORS.accent,
        },
        horzLine: {
          color: CHART_COLORS.accent,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: CHART_COLORS.accent,
        },
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
        autoScale:   true,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor:    CHART_COLORS.grid,
        timeVisible:    true,
        secondsVisible: false,
        fixLeftEdge:    false,
        fixRightEdge:   false,
      },
      handleScroll:  { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale:   { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      autoSize: true,
    });

    chartRef.current = chart;
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []); // eslint-disable-line — runs once

  // ── Rebuild series when chart type changes ─────────────────────────────────

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    // Remove existing series
    if (seriesRef.current) {
      try { chart.removeSeries(seriesRef.current as any); } catch {}
      seriesRef.current = null;
    }

    const isUp     = (dataRef.current.length > 1)
      ? dataRef.current[dataRef.current.length - 1].close >= dataRef.current[0].close
      : true;
    const lineColor = isUp ? CHART_COLORS.up : CHART_COLORS.down;

    if (chartType === 'area') {
      const area = chart.addAreaSeries({
        lineColor,
        topColor:    `${lineColor}33`,
        bottomColor: `${lineColor}00`,
        lineWidth:   2,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
        crosshairMarkerVisible:         true,
        crosshairMarkerRadius:          5,
        crosshairMarkerBorderColor:     '#FFFFFF',
        crosshairMarkerBorderWidth:     1.5,
        crosshairMarkerBackgroundColor: lineColor,
      });
      seriesRef.current = area;
    } else {
      const candle = chart.addCandlestickSeries({
        upColor:   CHART_COLORS.up,
        downColor: CHART_COLORS.down,
        borderVisible:  false,
        wickUpColor:   CHART_COLORS.up,
        wickDownColor: CHART_COLORS.down,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      });
      seriesRef.current = candle;
    }

    // Restore current data into new series
    applyData(dataRef.current);
  }, [chartType]); // eslint-disable-line

  // ── Update chart when data or symbol changes (NO full chart teardown) ──────

  const applyData = useCallback((candles: ChartCandle[]) => {
    const series = seriesRef.current;
    const chart  = chartRef.current;
    if (!series || !chart || candles.length === 0) return;

    try {
      if (chartType === 'area') {
        const isUp      = candles[candles.length - 1].close >= candles[0].close;
        const lineColor = isUp ? CHART_COLORS.up : CHART_COLORS.down;
        // Update series colors without recreation
        (series as ISeriesApi<'Area'>).applyOptions({
          lineColor,
          topColor:    `${lineColor}33`,
          bottomColor: `${lineColor}00`,
          crosshairMarkerBackgroundColor: lineColor,
        });
      }

      // Build unique sorted time-value pairs
      const seen = new Set<number>();
      const formatted = candles
        .map(d => {
          const t = typeof d.time === 'number' ? d.time : new Date(d.time as any).getTime() / 1000;
          return { time: t as any, value: d.close, open: d.open, high: d.high, low: d.low, close: d.close };
        })
        .filter(d => { if (seen.has(d.time)) return false; seen.add(d.time); return true; })
        .sort((a, b) => a.time - b.time);

      series.setData(formatted as any);
      chart.timeScale().fitContent();
    } catch (err) {
      console.warn('[Chart] setData failed:', err);
    }
  }, [chartType]);

  useEffect(() => {
    applyData(data);
    // Reset tooltip on data change
    setTooltip(null);
  }, [data, applyData]);

  // ── Sync crosshair / magnet mode imperatively ──────────────────────────────

  useEffect(() => {
    chartRef.current?.applyOptions({
      crosshair: { mode: magnet ? CrosshairMode.Magnet : CrosshairMode.Normal },
    });
  }, [magnet]);

  // ── Fullscreen handling with ESC key sync ──────────────────────────────────

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Give browser time to resize, then tell chart to fit
      setTimeout(() => chartRef.current?.timeScale().fitContent(), 100);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Download: composite chart onto opaque bg ───────────────────────────────

  const downloadSnapshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;

    const offscreen = document.createElement('canvas');
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `TradeVault_${symbol.toUpperCase()}_${timeframe}_${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  }, [symbol, timeframe]);

  // ── Reset zoom ─────────────────────────────────────────────────────────────

  const resetZoom = useCallback(() => {
    chartRef.current?.timeScale().fitContent();
  }, []);

  // ── Derived display ────────────────────────────────────────────────────────

  const currentSymbolLabel = SYMBOLS.find(s => s.key === symbol)?.label ?? symbol.toUpperCase();
  const isLive = timeframe === '1D' && isMarketOpen();

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'flex flex-col relative select-none',
        'rounded-2xl border border-white/[0.06] bg-[#0d1117]/90 backdrop-blur-xl shadow-xl',
        isFullscreen
          ? 'fixed inset-0 z-[200] rounded-none border-0 p-0'
          : 'mb-8 w-full'
      )}
    >
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 px-5 pt-5 pb-0">

        {/* Left: Symbol selector + Live price */}
        <div className="flex flex-col gap-2 min-w-0">

          {/* Symbol selector + Live pill */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <select
                value={symbol}
                onChange={e => { setSymbol(e.target.value); setTooltip(null); }}
                aria-label="Select market symbol"
                className="
                  appearance-none pl-3 pr-7 py-1.5
                  bg-white/[0.06] hover:bg-white/[0.09] active:bg-white/[0.12]
                  border border-white/[0.1] rounded-lg
                  text-xs font-bold text-white/90
                  outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  transition-colors cursor-pointer
                "
              >
                {SYMBOLS.map(s => (
                  <option key={s.key} value={s.key} className="bg-[#0d1117] text-white/90">
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-[10px]">▾</span>
            </div>

            {!loading && (
              isLive ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/30 text-[10px] font-bold tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  CLOSED
                </span>
              )
            )}
          </div>

          {/* Price display */}
          <div className="flex items-end gap-3 h-12">
            {loading && data.length === 0 ? (
              <>
                <div className="h-10 w-44 bg-white/[0.06] rounded-lg animate-pulse" />
                <div className="h-6 w-28 bg-white/[0.04] rounded-md mb-1 animate-pulse" />
              </>
            ) : latest ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-[2.125rem] leading-none font-bold tabular-nums tracking-tight text-white transition-[color] duration-200">
                    {displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className={cn(
                  'flex items-center gap-1.5 text-[13px] font-semibold mb-1.5 px-2.5 py-1 rounded-md border transition-all duration-200',
                  displayIsPositive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10    text-red-400    border-red-500/20'
                )}>
                  {displayIsPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{displayIsPositive ? '+' : ''}{displayChange.toFixed(2)}</span>
                  <span className="opacity-70">({displayIsPositive ? '+' : ''}{displayPct.toFixed(2)}%)</span>
                </div>

                {tooltip && (
                  <span className="text-[11px] text-white/30 font-mono mb-1.5 whitespace-nowrap">
                    {tooltip.time}
                  </span>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Right: Timeframe + Toolbar */}
        <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0">

          {/* Timeframe pills */}
          <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 gap-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                aria-label={`Set timeframe to ${tf}`}
                aria-pressed={timeframe === tf}
                className={cn(
                  'px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-150',
                  timeframe === tf
                    ? 'bg-blue-500/20 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-white/35 hover:text-white/70 hover:bg-white/[0.05]'
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">

            {/* Chart-type group */}
            <div className="flex items-center bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 gap-0.5">
              <ToolBtn
                active={!magnet}
                onClick={() => setMagnet(false)}
                title="Normal crosshair"
                aria-label="Normal crosshair"
              >
                {/* Custom crosshair icon */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="7" y1="0" x2="7" y2="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="7" y1="10.5" x2="7" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="0" y1="7" x2="3.5" y2="7" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10.5" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </ToolBtn>

              <ToolBtn
                active={magnet}
                onClick={() => setMagnet(true)}
                title="Magnet crosshair (snap to data)"
                aria-label="Magnet crosshair"
              >
                {/* Magnet icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 4v6a6 6 0 0012 0V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6"  y1="4" x2="6"  y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18" y1="4" x2="18" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </ToolBtn>

              <div className="w-px h-4 bg-white/10 mx-0.5" />

              <ToolBtn
                active={chartType === 'area'}
                onClick={() => setChartType('area')}
                title="Area chart"
                aria-label="Area chart"
              >
                <Activity size={14} />
              </ToolBtn>

              <ToolBtn
                active={chartType === 'candle'}
                onClick={() => setChartType('candle')}
                title="Candlestick chart"
                aria-label="Candlestick chart"
              >
                <BarChart2 size={14} />
              </ToolBtn>

              <div className="w-px h-4 bg-white/10 mx-0.5" />

              <ToolBtn
                active={false}
                onClick={resetZoom}
                title="Reset zoom (fit all)"
                aria-label="Reset zoom"
              >
                {/* Fit icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 14v6h6M20 10V4h-6M14 4l6 6M10 20l-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </ToolBtn>
            </div>

            {/* Download */}
            <ToolBtn
              active={false}
              onClick={downloadSnapshot}
              title="Download chart as PNG"
              aria-label="Download chart"
              standalone
            >
              <Download size={14} />
            </ToolBtn>

            {/* Fullscreen */}
            <ToolBtn
              active={isFullscreen}
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              standalone
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </ToolBtn>
          </div>
        </div>
      </div>

      {/* ─── Chart canvas ─────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0 px-4 pb-4 pt-4">
        <div
          ref={containerRef}
          className="w-full h-full min-h-[380px] relative rounded-xl overflow-hidden border border-white/[0.05] bg-[#0a0e14]"
          style={isFullscreen ? { minHeight: 'calc(100vh - 200px)' } : {}}
        >
          {/* Loading overlay */}
          {loading && data.length === 0 && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0e14]/90 backdrop-blur-sm">
              <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-white/40 tracking-wide">Loading {currentSymbolLabel}…</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0e14]/90 backdrop-blur-sm gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-red-400 text-lg">!</span>
              </div>
              <p className="text-sm font-semibold text-red-400">Chart data unavailable</p>
              <p className="text-xs text-white/30 max-w-[200px] text-center">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-1.5 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 rounded-lg text-xs font-bold text-white/70 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* OHLC Tooltip — floats near cursor but stays within bounds */}
          {tooltip && (
            <OHLCTooltip tooltip={tooltip} isPositive={displayIsPositive} />
          )}
        </div>
      </div>

      {/* ─── Bottom status bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 pb-3.5 text-[10px] text-white/25 font-mono">
        <span>
          {currentSymbolLabel} · {timeframe}
          {data.length > 0 && ` · ${data.length} candles`}
        </span>
        <span>
          Powered by Yahoo Finance · Educational only
        </span>
      </div>
    </div>
  );
}

// ─── ToolBtn ─────────────────────────────────────────────────────────────────

interface ToolBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  standalone?: boolean;
}

function ToolBtn({ active, standalone, children, className, ...props }: ToolBtnProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        standalone && 'bg-white/[0.04] border border-white/[0.07]',
        active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-white/35 hover:text-white/75 hover:bg-white/[0.07]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── OHLC Tooltip ─────────────────────────────────────────────────────────────

function OHLCTooltip({ tooltip, isPositive }: { tooltip: TooltipData; isPositive: boolean }) {
  const TOOLTIP_W = 180;
  const TOOLTIP_H = 135;
  const OFFSET    = 16;

  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    const w = parent.clientWidth;
    const h = parent.clientHeight;

    let left = tooltip.x + OFFSET;
    let top  = tooltip.y + OFFSET;

    if (left + TOOLTIP_W > w - 8) left = tooltip.x - TOOLTIP_W - OFFSET;
    if (top  + TOOLTIP_H > h - 8) top  = tooltip.y - TOOLTIP_H - OFFSET;
    if (left < 8) left = 8;
    if (top  < 8) top  = 8;

    setPos({ top, left });
  }, [tooltip.x, tooltip.y]);

  const fmt = (v: number) => v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      ref={containerRef}
      style={{ top: pos.top, left: pos.left, width: TOOLTIP_W }}
      className="absolute z-30 pointer-events-none transition-all duration-75 ease-out"
    >
      <div className="bg-[#1A2235]/95 backdrop-blur-xl border border-white/[0.15] rounded-xl shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
        {/* Top: Time */}
        <div className="px-3.5 py-1.5 text-[9px] font-bold tracking-widest text-white/50 uppercase border-b border-white/[0.05] bg-white/[0.02]">
          {tooltip.time}
        </div>

        {/* Middle: Price & Change */}
        <div className="px-3.5 py-2.5 border-b border-white/[0.05] flex items-center justify-between">
          <span className={cn(
            'text-[17px] font-display font-bold tabular-nums tracking-tight',
            isPositive ? 'text-emerald-400' : 'text-red-400',
          )}>
            {fmt(tooltip.price)}
          </span>
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-md',
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400',
          )}>
            {isPositive ? '+' : ''}{tooltip.pctChange.toFixed(2)}%
          </span>
        </div>

        {/* Bottom: OHLC */}
        <div className="px-3.5 py-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 bg-black/20">
          {[
            ['O', tooltip.open],
            ['H', tooltip.high],
            ['L', tooltip.low],
            ['C', tooltip.close],
          ].map(([lbl, val]) => (
            <div key={lbl as string} className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-white/40">{lbl}</span>
              <span className="text-[10px] font-mono font-medium text-white/90 tabular-nums">{fmt(val as number)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
