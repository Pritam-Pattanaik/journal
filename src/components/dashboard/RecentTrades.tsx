import React from 'react';
import { Link } from 'react-router-dom';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { ArrowRight } from 'lucide-react';
import { Table, TableBody, TableRow, TableCell } from '../ui/Table';

interface RecentTradesProps {
  trades: Trade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
          Recent Trades
        </span>
        <Link
          to="/app/trades"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          View All
          <ArrowRight size={12} strokeWidth={2} />
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        {recentTrades.length === 0 ? (
          <div className="flex items-center justify-center min-h-[160px] text-sm text-tertiary">
            No recent trades recorded
          </div>
        ) : (
          <Table>
            <TableBody>
              {recentTrades.map((trade) => {
                const isProfit = trade.netPnl >= 0;
                return (
                  <TableRow key={trade.id} className="hover:bg-surface-2 group">
                    <TableCell className="w-[80px] text-xs text-tertiary py-3">
                      {formatDate(trade.date)}
                    </TableCell>
                    <TableCell className="font-medium text-primary py-3">
                      {trade.symbol}
                    </TableCell>
                    <TableCell className="py-3 hidden sm:table-cell">
                      <Badge variant="primary">{trade.market}</Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-medium tabular-nums py-3", isProfit ? 'text-success' : 'text-danger')}>
                      {isProfit ? '+' : ''}{formatCurrency(trade.netPnl)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
