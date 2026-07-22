import React, { useState, useMemo } from 'react';
import { ComposedChart, Area, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Search, BarChart2, TrendingUp, Maximize2, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/cn';

// Generate realistic mock market data
const generateMarketData = (days: number) => {
  let basePrice = 24000;
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const volatility = basePrice * 0.015;
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = open + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
    const low = Math.min(open, close) - Math.random() * (volatility * 0.5);
    const volume = Math.floor(Math.random() * 5000000) + 1000000;

    basePrice = close;

    data.push({
      date: date.toISOString().split('T')[0],
      open, close, high, low, volume,
      isUp: close >= open
    });
  }
  return data;
};

const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'YTD', 'Max'];

export default function InteractiveMarketChart() {
  const [timeframe, setTimeframe] = useState('1M');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [search, setSearch] = useState('NIFTY 50');

  const data = useMemo(() => {
    let days = 30;
    if (timeframe === '1D') days = 1;
    if (timeframe === '5D') days = 5;
    if (timeframe === '1M') days = 30;
    if (timeframe === '3M') days = 90;
    if (timeframe === '6M') days = 180;
    if (timeframe === '1Y') days = 365;
    if (timeframe === 'YTD') days = 200;
    if (timeframe === 'Max') days = 1000;
    return generateMarketData(days);
  }, [timeframe, search]); // Re-generate on search change to simulate fetching

  const latest = data[data.length - 1];
  const previous = data[0];
  const priceChange = latest.close - previous.close;
  const pctChange = (priceChange / previous.close) * 100;
  const isPositive = priceChange >= 0;

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="glass-float p-3 min-w-[160px] z-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">{d.date}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-tertiary">Open</span><span className="font-mono text-right">{d.open.toFixed(2)}</span>
            <span className="text-tertiary">High</span><span className="font-mono text-right">{d.high.toFixed(2)}</span>
            <span className="text-tertiary">Low</span><span className="font-mono text-right">{d.low.toFixed(2)}</span>
            <span className="text-tertiary">Close</span><span className="font-mono text-right font-bold text-primary">{d.close.toFixed(2)}</span>
            <span className="text-tertiary mt-1">Vol</span><span className="font-mono text-right mt-1 text-secondary">{(d.volume / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card p-4 sm:p-6 mb-8 w-full flex flex-col">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
        
        {/* Left Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-surface-1 border border-border rounded-lg text-sm font-bold text-primary outline-none focus:border-accent w-48 transition-colors"
              />
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-surface-2 text-secondary uppercase">Index</span>
          </div>
          
          <div className="flex items-end gap-3 mt-4">
            <h3 className="text-4xl font-display font-bold text-primary tracking-tight tabular-nums">
              {latest.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className={cn("flex items-center gap-1.5 text-sm font-semibold mb-1.5", isPositive ? 'text-success' : 'text-danger')}>
              <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</span>
              <span>({isPositive ? '+' : ''}{pctChange.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col items-start lg:items-end gap-4 shrink-0">
          <div className="flex bg-surface-1 p-1 rounded-xl border border-border">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                  timeframe === tf ? "bg-surface-0 text-primary shadow-sm border border-border-subtle" : "text-tertiary hover:text-secondary"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-surface-1 p-1 rounded-xl border border-border">
              <button 
                onClick={() => setChartType('line')}
                className={cn("p-1.5 rounded-lg transition-colors", chartType === 'line' ? 'bg-surface-0 text-primary shadow-sm' : 'text-tertiary hover:text-secondary')}
                title="Line Chart"
              >
                <TrendingUp size={16} />
              </button>
              <button 
                onClick={() => setChartType('candle')}
                className={cn("p-1.5 rounded-lg transition-colors", chartType === 'candle' ? 'bg-surface-0 text-primary shadow-sm' : 'text-tertiary hover:text-secondary')}
                title="Candlestick (Mock)"
              >
                <BarChart2 size={16} />
              </button>
            </div>
            <button className="p-2 bg-surface-1 border border-border rounded-xl text-secondary hover:text-primary transition-colors">
              <Maximize2 size={16} />
            </button>
            <button className="p-2 bg-surface-1 border border-border rounded-xl text-secondary hover:text-primary transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="w-full h-[400px] relative group">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(var(--color-border), 0.5)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'rgba(var(--color-tertiary), 1)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
              tickFormatter={(val) => {
                const d = new Date(val);
                return timeframe === '1D' || timeframe === '5D' ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              yAxisId="price"
              domain={['auto', 'auto']}
              orientation="right"
              tick={{ fill: 'rgba(var(--color-tertiary), 1)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <YAxis 
              yAxisId="volume"
              orientation="left"
              domain={[0, 'dataMax * 4']} // Keep volume bars low
              hide
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(var(--color-border-hover), 1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* Volume Bars */}
            <Bar 
              yAxisId="volume"
              dataKey="volume" 
              fill="rgba(var(--color-tertiary), 0.2)"
              isAnimationActive={false}
            />

            {/* Price Line/Area */}
            {chartType === 'line' ? (
              <Area 
                yAxisId="price"
                type="monotone" 
                dataKey="close" 
                stroke={isPositive ? 'rgb(var(--color-success))' : 'rgb(var(--color-danger))'} 
                fillOpacity={1} 
                fill="url(#colorClose)" 
                strokeWidth={2}
                isAnimationActive={true}
              />
            ) : (
              // For a simple candlestick mock without custom shapes, we can just render the area for now,
              // as building a perfect custom candlestick SVG shape in a single file might clutter the implementation.
              // In a production app, we would use lightweight-charts here.
              <Area 
                yAxisId="price"
                type="step" 
                dataKey="close" 
                stroke="rgb(var(--color-accent))" 
                fillOpacity={0.1} 
                fill="rgb(var(--color-accent))" 
                strokeWidth={2}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
