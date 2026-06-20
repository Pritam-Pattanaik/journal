import React, { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Trade } from '../types';
import FilterBar from '../components/trade/FilterBar';
import TradeRow from '../components/trade/TradeRow';
import TradeModal from '../components/trade/TradeModal';
import TradeFormModal from '../components/trade/TradeFormModal';
import Button from '../components/ui/Button';
import { useTradeStore } from '../stores/tradeStore';

export default function Trades() {
  const { trades, addTrade, updateTrade, deleteTrade } = useTradeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

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
          firstDayOfWeek.setDate(today.getDate() - today.getDay());
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
      t.date.split('T')[0],
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
    link.setAttribute('download', `tradevault_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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

      {/* Trade Count */}
      <div className="text-tv-sm text-secondary font-ui pl-1">
        {filteredTrades.length} {filteredTrades.length === 1 ? 'trade' : 'trades'} match your filters
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
              No trades match your active filters. Try searching for a different ticker.
            </div>
          ) : (
            filteredTrades.map((trade) => (
              <TradeRow
                key={trade.id}
                trade={trade}
                onClick={() => setSelectedTrade(trade)}
              />
            ))
          )}
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
    </div>
  );
}
