import React, { useState, useEffect } from 'react';
import { Plus, Download, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, Activity, Percent, Trash2, ArrowUpDown, ArrowDown, ArrowUp } from 'lucide-react';
import { Trade } from '../types';
import FilterBar from '../components/trade/FilterBar';
import TradeRow from '../components/trade/TradeRow';
import TradeCard from '../components/trade/TradeCard';
import TradeFormModal from '../components/trade/TradeFormModal';
import TradeCalendarView from '../components/trade/TradeCalendarView';
import DailyTradeAccordion from '../components/trade/DailyTradeAccordion';
import { Button } from '../components/ui/Button';
import { useTradeStore } from '../stores/tradeStore';
import { useBrokerStore } from '../stores/brokerStore';
import { formatCurrency } from '../lib/analytics';
import { notify } from '../lib/notify';
import { getLocalYYYYMMDD } from '../lib/dateUtils';
import StatCard from '../components/dashboard/StatCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';

export default function Trades() {
  const { trades, loading, fetchTrades, addTrade, updateTrade, deleteTrade } = useTradeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const { isSyncing, lastSyncedAt, lastSyncError, syncingBrokers } = useBrokerStore();
  const syncAll = useBrokerStore(state => state.syncAll);

  useEffect(() => {
    if (trades.length === 0 && !loading) {
      fetchTrades();
    }
  }, [trades.length, loading, fetchTrades]);

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
      let valA: any = a[sortConfig.key as keyof Trade] || 0;
      let valB: any = b[sortConfig.key as keyof Trade] || 0;

      if (sortConfig.key === 'date') {
        valA = a.isCarryForward && a.exitTime ? new Date(a.exitTime).getTime() : new Date(a.date).getTime();
        valB = b.isCarryForward && b.exitTime ? new Date(b.exitTime).getTime() : new Date(b.date).getTime();
      } else if (sortConfig.key === 'symbol' || sortConfig.key === 'status') {
        valA = (a[sortConfig.key as keyof Trade] as string)?.toLowerCase() || '';
        valB = (b[sortConfig.key as keyof Trade] as string)?.toLowerCase() || '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate Metrics for Header
  const totalTrades = filteredTrades.length;
  const grossPnl = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const netPnl = filteredTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const winningTrades = filteredTrades.filter(t => t.netPnl > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const exportCsvData = (dataToExport: Trade[]) => {
    if (dataToExport.length === 0) return;
    const headers = ['Date', 'Symbol', 'Market', 'Direction', 'Status', 'Entry', 'Exit', 'Net P&L', 'Discipline Score', 'Strategy'];
    const rows = dataToExport.map(t => [
      getLocalYYYYMMDD(new Date(t.date)),
      t.symbol, t.market, t.direction, t.status,
      t.entryPrice.toString(),
      t.exitPrice?.toString() || '',
      t.netPnl.toString(),
      t.disciplineScore?.toString() || '',
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

  const handleExportCsv = () => {
    exportCsvData(filteredTrades);
  };

  const handleExportSelected = () => {
    const dataToExport = trades.filter(t => selectedTrades.has(t.id));
    exportCsvData(dataToExport);
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTrades.size} selected trades?`)) return;
    for (const id of Array.from(selectedTrades)) {
      await deleteTrade(id);
    }
    setSelectedTrades(new Set());
    notify.success('Selected trades deleted successfully.');
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 inline text-primary" />
      : <ArrowDown className="w-3 h-3 ml-1 inline text-primary" />;
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
      <div className="space-y-6 pt-4 pb-20 max-w-[1400px] mx-auto relative">
        
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary tracking-tight">Trade Workspace</h1>
            <p className="text-sm text-secondary mt-1">Search, filter, and review your market executions.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {lastSyncError && !isSyncing && (
              <span className="text-[10px] uppercase tracking-widest font-bold text-danger bg-danger/10 px-3 py-1.5 rounded-lg border border-danger/20">
                Sync Error
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={handleSync} disabled={isSyncing} className="shadow-sm font-semibold border-border-subtle hover:bg-surface-2">
              <RefreshCw className={cn("w-4 h-4 mr-2", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCsv} className="shadow-sm font-semibold border-border-subtle hover:bg-surface-2">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <div className="w-px h-6 bg-border-subtle mx-1 hidden sm:block" />
            <Button variant="primary" size="sm" onClick={() => { setTradeToEdit(null); setIsFormOpen(true); }} className="shadow-sm font-bold shadow-accent/20">
              <Plus className="w-4 h-4 mr-2" />
              Log Trade
            </Button>
          </div>
        </div>

        {/* Floating Action Bar */}
        <AnimatePresence>
          {selectedTrades.size > 0 && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-surface px-6 py-3 rounded-full border border-border shadow-xl shadow-black/10 dark:shadow-black/40"
            >
              <span className="text-sm font-semibold text-primary">{selectedTrades.size} selected</span>
              <div className="w-px h-4 bg-border" />
              <Button variant="secondary" size="sm" onClick={handleExportSelected} className="h-8">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteSelected} className="h-8 bg-danger/10 text-danger hover:bg-danger/20 border-danger/20">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Desktop View Toggle */}
        <div className="hidden md:flex justify-end mb-4">
          <div className="flex items-center gap-1 p-1 bg-surface-1/50 rounded-full border border-border-subtle shadow-sm">
            <button 
              onClick={() => setViewMode('table')}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", viewMode === 'table' ? "bg-surface-2 text-primary shadow-sm border border-border-subtle" : "text-tertiary hover:text-secondary hover:bg-surface-1")}
            >
              Table View
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", viewMode === 'calendar' ? "bg-surface-2 text-primary shadow-sm border border-border-subtle" : "text-tertiary hover:text-secondary hover:bg-surface-1")}
            >
              Calendar View
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="hidden md:block">
            <TradeCalendarView 
              trades={filteredTrades} 
              onDayClick={(dateStr) => {
                // Assuming dateStr is in YYYY-MM-DD
                // To filter to a specific day, we would need to add support for exact date string matching.
                // For now, we will simply switch to table view. A custom date filter can be added.
                setViewMode('table');
              }} 
            />
          </div>
        )}

        {/* Desktop Table View */}
        <div className={cn("hidden md:block space-y-4 relative", viewMode === 'calendar' && "md:hidden")}>
          {filteredTrades.length === 0 ? (
            <div className="card hover:bg-transparent">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-4 text-tertiary">
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
            </div>
          ) : (
            groupedDateKeys.map((dateKey, index) => {
              const dayTrades = filteredTrades.filter(t => getGroupDate(t) === dateKey);
              const allDaySelected = dayTrades.every(t => selectedTrades.has(t.id));
              const isFirst = index === 0;

              return (
                <DailyTradeAccordion
                  key={dateKey}
                  dateKey={dateKey}
                  trades={dayTrades}
                  isInitiallyExpanded={isFirst}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  allSelected={allDaySelected && dayTrades.length > 0}
                  onSelectAll={(checked) => {
                    const next = new Set(selectedTrades);
                    if (checked) {
                      dayTrades.forEach(t => next.add(t.id));
                    } else {
                      dayTrades.forEach(t => next.delete(t.id));
                    }
                    setSelectedTrades(next);
                  }}
                >
                  {dayTrades.map(trade => (
                    <TradeRow
                      key={trade.id}
                      trade={trade}
                      onEdit={(t) => { setTradeToEdit(t); setIsFormOpen(true); }}
                      onUpdateTrade={updateTrade}
                      isSelected={selectedTrades.has(trade.id)}
                      onToggleSelect={() => {
                        const next = new Set(selectedTrades);
                        if (next.has(trade.id)) next.delete(trade.id);
                        else next.add(trade.id);
                        setSelectedTrades(next);
                      }}
                    />
                  ))}
                </DailyTradeAccordion>
              );
            })
          )}
          {/* Table Footer / Pagination */}
          <div className="flex items-center justify-center p-4">
            <span className="text-xs font-semibold text-tertiary">
              Showing all {filteredTrades.length} executions
            </span>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden space-y-2">
           {filteredTrades.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-16 px-4 text-center card rounded-2xl border-dashed">
               <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-border flex items-center justify-center mb-4 text-tertiary">
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
                          onDelete={async (id) => {
                            if(confirm('Delete this trade?')) {
                              await deleteTrade(id);
                              notify.success('Trade deleted');
                            }
                          }}
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
