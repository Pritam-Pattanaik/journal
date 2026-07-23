import React, { useState, useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CrosshairMode, LineStyle, ColorType } from 'lightweight-charts';
import { Search, RefreshCcw, Crosshair, BarChart2, Activity, Settings, Download, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useLiveChartData } from '../../hooks/useLiveMarketData';
import { SkeletonLoader } from '../ui/SkeletonLoader';

const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD', 'Max'];

export default function InteractiveMarketChart() {
  const [timeframe, setTimeframe] = useState('1D');
  const [search, setSearch] = useState('nifty'); // Backend uses short keys: nifty, banknifty
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCrosshair, setIsCrosshair] = useState(true);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const { data, loading, error } = useLiveChartData(search, timeframe);

  // Initialize and update Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Detect if dark mode or light mode based on document class or standard vars
    // Lightweight charts requires explicit colors
    const isDark = document.documentElement.classList.contains('dark') || true; // Assume dark by default unless implemented otherwise in your theme
    
    // Strict hex codes requested by user:
    const themeBg = isDark ? '#111827' : '#FFFFFF';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
    const textColor = isDark ? '#9CA3AF' : '#64748B';
    const accentColor = isDark ? '#3B82F6' : '#2563EB';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' }, // Use container background
        textColor: textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: gridColor, style: LineStyle.SparseDotted },
        horzLines: { color: gridColor, style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: isCrosshair ? CrosshairMode.Normal : CrosshairMode.Magnet,
        vertLine: {
          color: accentColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: accentColor,
        },
        horzLine: {
          color: accentColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: accentColor,
        },
      },
      rightPriceScale: {
        borderColor: gridColor,
        autoScale: true,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: true, // Native responsive resizing
    });

    // Determine overall trend for coloring
    const isUp = data.length > 1 ? data[data.length - 1].close >= data[0].close : true;
    const lineColor = isUp ? (isDark ? '#22C55E' : '#16A34A') : (isDark ? '#EF4444' : '#DC2626');

    const areaSeries = chart.addAreaSeries({
      lineColor: lineColor,
      topColor: `${lineColor}40`, // 25% opacity hex
      bottomColor: `${lineColor}00`, // 0% opacity hex
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#FFFFFF',
      crosshairMarkerBackgroundColor: lineColor,
    });

    if (data && data.length > 0) {
      // Data from backend is { time, open, high, low, close, value }
      // Lightweight charts expects time as UNIX timestamp in seconds
      const formattedData = data.map(d => ({
        time: (d.time as number) || (new Date(d.time).getTime() / 1000),
        value: d.value || d.close
      }));
      
      // Sort and deduplicate data
      const uniqueData = formattedData.reduce((acc, current) => {
        const x = acc.find(item => item.time === current.time);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [] as any[]).sort((a, b) => a.time - b.time);

      areaSeries.setData(uniqueData);
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    return () => {
      chart.remove();
    };
  }, [data, isCrosshair]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const downloadSnapshot = () => {
    if (!chartRef.current) return;
    const canvas = chartContainerRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `Market_Snapshot_${search}_${timeframe}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  // Derive latest stats for header
  const latest = data[data.length - 1];
  const previous = data[0];
  const priceChange = latest && previous ? latest.close - previous.close : 0;
  const pctChange = previous ? (priceChange / previous.close) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className={cn("card flex flex-col relative overflow-hidden transition-all duration-300", isFullscreen ? "w-screen h-screen rounded-none z-[100] fixed top-0 left-0 bg-surface-0 p-6" : "p-4 sm:p-6 mb-8 w-full")}>

      {/* Toolbar / Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-4 z-10">
        
        {/* Left Side: Search & Live Price */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary group-focus-within:text-accent transition-colors" />
              <select 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 py-1.5 bg-surface-1/80 backdrop-blur-md border border-border/50 rounded-lg text-sm font-bold text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent w-48 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="nifty">NIFTY 50</option>
                <option value="banknifty">BANK NIFTY</option>
                <option value="finnifty">FINNIFTY</option>
                <option value="sensex">SENSEX</option>
                <option value="vix">INDIA VIX</option>
              </select>
            </div>
            
            {timeframe === '1D' && !loading && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/20 backdrop-blur-md shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-success">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-end gap-3 mt-2 h-[48px]">
            {loading ? (
              <>
                <SkeletonLoader width={160} height={40} className="rounded-lg" />
                <SkeletonLoader width={100} height={24} className="rounded-md mb-1" />
              </>
            ) : latest ? (
              <>
                <h3 className="text-4xl font-display font-bold tracking-tight tabular-nums text-primary">
                  {latest.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <div className={cn("flex items-center gap-1.5 text-sm font-semibold mb-1.5 px-2.5 py-1 rounded-md backdrop-blur-md border", isPositive ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20')}>
                  <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</span>
                  <span>({isPositive ? '+' : ''}{pctChange.toFixed(2)}%)</span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Right Side: Premium Institutional Toolbar */}
        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          
          {/* Top Row: Timeframes */}
          <div className="flex bg-surface-1/80 backdrop-blur-md p-1 rounded-xl border border-border/50 shadow-sm">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                  timeframe === tf ? "bg-surface-elevated text-primary shadow-sm border border-border-subtle" : "text-tertiary hover:text-secondary hover:bg-surface-2/50"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Bottom Row: Actions */}
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-1/80 backdrop-blur-md p-1 rounded-xl border border-border/50 shadow-sm">
              <button 
                onClick={() => setIsCrosshair(!isCrosshair)}
                className={cn("p-1.5 rounded-lg transition-all", isCrosshair ? 'bg-surface-elevated text-primary shadow-sm border border-border-subtle' : 'text-tertiary hover:text-secondary hover:bg-surface-2/50')}
                title="Toggle Magnet Crosshair"
              >
                <Crosshair size={16} />
              </button>
              <button 
                className="p-1.5 rounded-lg transition-all text-tertiary hover:text-secondary hover:bg-surface-2/50"
                title="Compare (Coming Soon)"
              >
                <BarChart2 size={16} />
              </button>
              <button 
                className="p-1.5 rounded-lg transition-all text-tertiary hover:text-secondary hover:bg-surface-2/50"
                title="Indicators"
              >
                <Activity size={16} />
              </button>
            </div>
            
            <button className="p-2 bg-surface-1/80 backdrop-blur-md border border-border/50 shadow-sm rounded-xl text-tertiary hover:text-primary hover:bg-surface-2 transition-all group" title="Settings">
              <Settings size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <button onClick={downloadSnapshot} className="p-2 bg-surface-1/80 backdrop-blur-md border border-border/50 shadow-sm rounded-xl text-tertiary hover:text-primary hover:bg-surface-2 transition-all" title="Download Snapshot">
              <Download size={16} />
            </button>
            <button onClick={toggleFullscreen} className="p-2 bg-surface-1/80 backdrop-blur-md border border-border/50 shadow-sm rounded-xl text-tertiary hover:text-primary hover:bg-surface-2 transition-all" title="Fullscreen">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full flex-grow min-h-[400px] relative z-10 border border-border/30 rounded-xl bg-surface-0/50 backdrop-blur-sm overflow-hidden" ref={chartContainerRef}>
        
        {loading && data.length === 0 && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-0/80 backdrop-blur-md">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-tertiary">Connecting to Market Data...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-0/80 backdrop-blur-md">
            <p className="text-sm font-semibold text-danger">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-xs font-bold transition-colors">
              Retry Connection
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
