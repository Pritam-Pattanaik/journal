import React, { useState, useEffect } from 'react';
import { Plus, Download, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Activity, Percent } from 'lucide-react';
import { Trade } from '../types';
import FilterBar from '../components/trade/FilterBar';
import TradeRow from '../components/trade/TradeRow';
import TradeCard from '../components/trade/TradeCard';
import TradeFormModal from '../components/trade/TradeFormModal';
import { Table, TableHeader, TableBody, TableRow as UITableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { useTradeStore } from '../stores/tradeStore';
import { useBrokerStore } from '../stores/brokerStore';
import { formatCurrency } from '../lib/analytics';
import { notify } from '../lib/notify';
import { getLocalYYYYMMDD } from '../lib/dateUtils';
import StatCard from '../components/dashboard/StatCard';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export default function Trades() {
  const { trades, loading, fetchTrades, addTrade, updateTrade, deleteTrade } = useTradeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);

  const { isSyncing, lastSyncedAt, lastSyncError, syncingBrokers } = useBrokerStore();
  const syncAll = useBrokerStore(state => state.syncAll);

  useEffect(() => {
    if (trades.length === 0 && !loading) {
      fetchTrades();
    }
  }, []);

  const handleSync = async () => {
    if (isSyncing) return;
    await syncAll();
  };

  const syncingBrokerNames = Object.entries(syncingBrokers)
    .filter(([, active]) => active)
    .map(([broker]) => broker);

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

  const filteredTrades = trades
    .filter(trade => {
      const matchesSearch = trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            trade.strategyName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMarket = marketFilter === 'All' || trade.market === marketFilter;
      const matchesStatus = statusFilter === 'All' || trade.status === statusFilter;

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
    .sort((a, b) => {
      const dateA = a.isCarryForward && a.exitTime ? new Date(a.exitTime) : new Date(a.date);
      const dateB = b.isCarryForward && b.exitTime ? new Date(b.exitTime) : new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

  // Calculate Metrics for Header
  const totalTrades = filteredTrades.length;
  const netPnl = filteredTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const winningTrades = filteredTrades.filter(t => t.netPnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const handleExportCsv = () => {
    if (filteredTrades.length === 0) return;
    const headers = ['Date', 'Symbol', 'Market', 'Direction', 'Status', 'Entry', 'Exit', 'Net P&L', 'Strategy'];
    const rows = filteredTrades.map(t => [
      getLocalYYYYMMDD(new Date(t.date)),
      t.symbol, t.market, t.direction, t.status,
      t.entryPrice.toString(),
      t.exitPrice?.toString() || '',
      t.netPnl.toString(),
      t.strategyName || 'Untagged',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tradevault_export_${getLocalYYYYMMDD()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGroupDate = (trade: Trade): string => {
    if (trade.isCarryForward && trade.exitTime) {
      return getLocalYYYYMMDD(new Date(trade.exitTime));
    }
    return getLocalYYYYMMDD(new Date(trade.date));
  };

  const formatGroupDateFull = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const groupedDateKeys = Array.from(new Set(filteredTrades.map(t => getGroupDate(t))))
    .sort((a, b) => b.localeCompare(a));

  return (
    <>
      <div className="space-y-8 page-enter font-ui pb-20 max-w-[1400px] mx-auto">
        
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Trade Workspace</h1>
            <p className="text-sm text-secondary mt-1">Search, filter, and review your market executions.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleSync} disabled={isSyncing} className="shadow-sm">
              <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCsv} className="shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setTradeToEdit(null); setIsFormOpen(true); }} className="shadow-sm font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Log Trade
            </Button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Filtered Net P&L"
            value={formatCurrency(netPnl)}
            subLabel="Total across active filters"
            icon={netPnl >= 0 ? ArrowUpRight : ArrowDownRight}
            colorType="pnl"
            rawValue={netPnl}
          />
          <StatCard
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subLabel={`${winningTrades} wins out of ${totalTrades} trades`}
            icon={Percent}
            colorType="winrate"
            rawValue={winRate}
          />
          <StatCard
            label="Total Executions"
            value={totalTrades.toString()}
            subLabel="Matching current filters"
            icon={Activity}
            colorType="default"
            rawValue={totalTrades}
          />
        </div>

        {/* Status Banners */}
        {isSyncing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <span className="text-sm font-bold text-accent">
              Syncing trades{syncingBrokerNames.length > 0 ? ` from ${syncingBrokerNames.join(', ')}` : ''}…
            </span>
          </motion.div>
        )}

        {lastSyncError && !isSyncing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-danger/10 border border-danger/20">
            <span className="text-sm font-bold text-danger">Sync error: {lastSyncError}</span>
          </motion.div>
        )}

        {/* Filters */}
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

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-secondary">
          <span>{totalTrades} executions found</span>
          {lastSyncedAt && <span>Last synced: {getLastSyncedText()}</span>}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-surface-0 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <UITableRow className="hover:bg-transparent border-b border-black/10 dark:border-white/10">
                <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Asset</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Context</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Strategy</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Entry</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Exit</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Net P&L</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Rating</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </UITableRow>
            </TableHeader>
            <TableBody>
              {filteredTrades.length === 0 ? (
                <UITableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mb-4 text-tertiary shadow-inner">
                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Activity className="w-8 h-8 opacity-50" />}
                      </div>
                      <h3 className="text-lg font-bold text-primary mb-2 tracking-tight">
                        {loading ? 'Loading Executions...' : 'No trades found'}
                      </h3>
                      <p className="text-sm text-secondary max-w-sm mx-auto">
                        {loading 
                          ? 'Please wait while we sync your data.' 
                          : 'No executions match your current workspace filters. Adjust your search criteria.'}
                      </p>
                    </div>
                  </TableCell>
                </UITableRow>
              ) : (
                groupedDateKeys.map(dateKey => {
                  const dayTrades = filteredTrades.filter(t => getGroupDate(t) === dateKey);
                  return (
                    <React.Fragment key={dateKey}>
                      <UITableRow className="bg-black/5 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/10 dark:border-white/10">
                        <TableCell colSpan={9} className="py-2.5">
                          <span className="text-xs font-bold uppercase tracking-widest text-secondary">
                            {formatGroupDateFull(dateKey)}
                          </span>
                        </TableCell>
                      </UITableRow>
                      
                      {dayTrades.map(trade => (
                        <TradeRow
                          key={trade.id}
                          trade={trade}
                          onEdit={(t) => { setTradeToEdit(t); setIsFormOpen(true); }}
                        />
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-2">
           {filteredTrades.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center glass-panel rounded-2xl border-dashed">
               <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center mb-4 text-tertiary shadow-inner">
                 {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Activity className="w-8 h-8 opacity-50" />}
               </div>
               <h3 className="text-lg font-bold text-primary mb-2 tracking-tight">
                 {loading ? 'Loading Executions...' : 'No trades found'}
               </h3>
               <p className="text-sm text-secondary max-w-sm mx-auto">
                 {loading 
                   ? 'Please wait while we sync your data.' 
                   : 'No executions match your current workspace filters.'}
               </p>
             </div>
           ) : (
             groupedDateKeys.map(dateKey => {
                const dayTrades = filteredTrades.filter(t => getGroupDate(t) === dateKey);
                return (
                  <div key={dateKey} className="mb-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-tertiary mb-3 pl-2">
                      {formatGroupDateFull(dateKey)}
                    </h3>
                    <div className="space-y-3">
                      {dayTrades.map(trade => (
                        <TradeCard 
                          key={trade.id} 
                          trade={trade} 
                          onEdit={(t) => { setTradeToEdit(t); setIsFormOpen(true); }}
                        />
                      ))}
                    </div>
                  </div>
                )
             })
           )}
        </div>

      </div>

      {/* Trade Form Modal (Edit or Add) */}
      <TradeFormModal
        isOpen={isFormOpen}
        initialData={tradeToEdit}
        onClose={() => { setIsFormOpen(false); setTradeToEdit(null); }}
        onSave={async data => {
          if (tradeToEdit) {
            await updateTrade(tradeToEdit.id, data);
            notify.success('Trade updated successfully.');
          } else {
            await addTrade(data);
            notify.success('Trade logged successfully.');
          }
        }}
      />
    </>
  );
}
