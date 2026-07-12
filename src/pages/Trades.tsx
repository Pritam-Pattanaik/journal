import React, { useState, useEffect } from 'react';
import { Plus, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Trade } from '../types';
import FilterBar from '../components/trade/FilterBar';
import TradeRow from '../components/trade/TradeRow';
import TradeModal from '../components/trade/TradeModal';
import TradeFormModal from '../components/trade/TradeFormModal';
import Button from '../components/ui/Button';
import { useTradeStore } from '../stores/tradeStore';
import { useBrokerStore } from '../stores/brokerStore';
import { formatCurrency, formatDateFull } from '../lib/analytics';
import { getLocalYYYYMMDD } from '../lib/dateUtils';

export default function Trades() {
  const { trades, loading, fetchTrades, addTrade, updateTrade, deleteTrade } = useTradeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const { connections, isSyncing, lastSyncedAt, lastSyncError, syncingBrokers } = useBrokerStore();
  const syncAll = useBrokerStore(state => state.syncAll);

  // Fetch trades on mount if store is empty (e.g. direct navigation to /trades)
  useEffect(() => {
    if (trades.length === 0 && !loading) {
      fetchTrades();
    }
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    await syncAll();
    // syncAll automatically calls fetchTrades when done
  };

  // Compute which broker names are currently syncing for the banner
  const syncingBrokerNames = Object.entries(syncingBrokers)
    .filter(([, active]) => active)
    .map(([broker]) => broker);

  // Format relative "last synced" text
  const getLastSyncedText = () => {
    if (!lastSyncedAt) return null;
    const diffMs = Date.now() - new Date(lastSyncedAt).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} mins ago`;
    const hrs = Math.floor(mins / 60);
    return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`;
  };

  // Filter logic
  const filteredTrades = trades
    .filter((trade) => {
      // Symbol match
      const matchesSearch = trade.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Market match
      const matchesMarket = marketFilter === 'All' || trade.market === marketFilter;

      // Status match
      const matchesStatus = statusFilter === 'All' || trade.status === statusFilter;

      // Date match
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const tradeDate = new Date(trade.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
          matchesDate = tradeDate >= today;
        } else if (dateFilter === 'week') {
          const firstDayOfWeek = new Date(today);
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          firstDayOfWeek.setDate(diff);
          matchesDate = tradeDate >= firstDayOfWeek;
        } else if (dateFilter === 'month') {
          const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          matchesDate = tradeDate >= firstDayOfMonth;
        } else if (dateFilter === 'last_month') {
          const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
          matchesDate = tradeDate >= firstDayOfLastMonth && tradeDate <= lastDayOfLastMonth;
        }
      }

      return matchesSearch && matchesMarket && matchesStatus && matchesDate;
    })
    // Sort by date desc
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExportCsv = () => {
    if (filteredTrades.length === 0) return;
    const headers = ['Date', 'Symbol', 'Market', 'Direction', 'Status', 'Entry', 'Exit', 'Net P&L', 'Strategy'];
    const rows = filteredTrades.map(t => [
      getLocalYYYYMMDD(new Date(t.date)),
      t.symbol,
      t.market,
      t.direction,
      t.status,
      t.entryPrice.toString(),
      t.exitPrice?.toString() || '',
      t.netPnl.toString(),
      t.strategyName || 'Untagged'
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tradevault_export_${getLocalYYYYMMDD()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="space-y-4 page-enter">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-tv-lg font-bold text-primary font-ui">
            Trades Log
          </h2>
          <p className="text-tv-sm text-secondary">
            View, search, and inspect synced and manual trade executions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className={`h-[14px] w-[14px] ${isSyncing ? 'animate-spin' : ''}`} />}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing…' : 'Sync Now'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download className="h-[14px] w-[14px]" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-[14px] w-[14px]" />}
            onClick={() => {
              setTradeToEdit(null);
              setIsFormOpen(true);
            }}
          >
            Add Trade
          </Button>
        </div>
      </div>

      {/* Live Syncing Banner */}
      {isSyncing && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-tv-md bg-accent/10 border border-accent/20 animate-in slide-in-from-top-2 fade-in duration-300">
          <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
          <span className="text-tv-sm text-accent-light font-medium">
            Syncing trades{syncingBrokerNames.length > 0 ? ` from ${syncingBrokerNames.join(', ')}` : ''}…
          </span>
        </div>
      )}

      {/* Sync error banner */}
      {lastSyncError && !isSyncing && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-tv-md bg-red-500/10 border border-red-500/20 animate-in fade-in duration-300">
          <span className="text-tv-sm text-red-400 font-medium">
            Sync error: {lastSyncError}
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        marketFilter={marketFilter}
        onMarketChange={setMarketFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
      />

      {/* Trade Count + Last Synced */}
      <div className="flex items-center justify-between text-tv-sm text-secondary font-ui pl-1">
        <span>
          {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} match your filters
        </span>
        {lastSyncedAt && (
          <span className="text-tv-xs text-muted">
            Last synced: {getLastSyncedText()}
          </span>
        )}
      </div>

      {/* Table / Grid Container */}
      <div className="border border-tv-border rounded-tv-lg bg-surface/40 overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[100px_1fr_70px_90px_80px_80px_90px_56px_24px] items-center h-[36px] px-4 border-b border-tv-border bg-base/30 select-none">
          <span className="label-section">Date</span>
          <span className="label-section">Symbol</span>
          <span className="label-section">Market</span>
          <span className="label-section">Strategy</span>
          <span className="label-section">Entry</span>
          <span className="label-section">Exit</span>
          <span className="label-section">Net P&L</span>
          <span className="label-section">Disc</span>
          <span className="label-section"></span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-tv-border">
          {filteredTrades.length === 0 ? (
            <div className="py-12 text-center text-secondary font-ui text-tv-sm bg-[#060b1e]/10">
              {loading
                ? 'Loading trades…'
                : 'No trades match your active filters. Try searching for a different ticker.'}
            </div>
          ) : (
            Array.from(
              new Set(filteredTrades.map(t => getLocalYYYYMMDD(new Date(t.date))))
            )
              .sort((a, b) => b.localeCompare(a))
              .map(dateKey => {
              const dayTrades = filteredTrades.filter(t => getLocalYYYYMMDD(new Date(t.date)) === dateKey);
              const dayPnl = dayTrades.reduce((sum, t) => sum + t.netPnl, 0);
              const isProfit = dayPnl >= 0;
              
              return (
                <div key={dateKey} className="flex flex-col">
                  {/* Day Header */}
                  <div 
                    className="px-4 py-2 bg-base/50 border-b border-tv-border flex justify-between items-center text-tv-sm font-ui text-secondary cursor-pointer hover:bg-base/70 transition-colors"
                    onClick={() => {
                      setExpandedDates(prev => {
                        const next = new Set(prev);
                        if (next.has(dateKey)) next.delete(dateKey);
                        else next.add(dateKey);
                        return next;
                      });
                    }}
                  >
                    <div className="flex items-center gap-2">
                       <span>{formatDateFull(dayTrades[0].date)}</span>
                       <span className="text-tv-xs text-muted">({dayTrades.length} trades)</span>
                    </div>
                    <span className={`font-mono font-medium ${isProfit ? 'text-profit' : 'text-loss'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(dayPnl)}
                    </span>
                  </div>
                  {/* Trades for this day */}
                  {expandedDates.has(dateKey) && (
                    <div className="divide-y divide-tv-border">
                      {dayTrades.map((trade) => (
                        <TradeRow
                          key={trade.id}
                          trade={trade}
                          onClick={() => setSelectedTrade(trade)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      </div>

      {/* Trade Detail Modal */}
      <TradeModal
        trade={selectedTrade}
        isOpen={selectedTrade !== null}
        onClose={() => setSelectedTrade(null)}
        onEdit={(trade) => {
          setSelectedTrade(null);
          setTradeToEdit(trade);
          setIsFormOpen(true);
        }}
        onDelete={(id) => {
          if (confirm('Are you sure you want to delete this trade?')) {
            deleteTrade(id);
            setSelectedTrade(null);
          }
        }}
      />

      {/* Trade Form Modal */}
      <TradeFormModal
        isOpen={isFormOpen}
        initialData={tradeToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setTradeToEdit(null);
        }}
        onSave={async (data) => {
          if (tradeToEdit) {
            await updateTrade(tradeToEdit.id, data);
          } else {
            await addTrade(data);
          }
        }}
      />
    </>
  );
}
