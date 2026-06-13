import React from 'react';
import { Link } from 'react-router-dom';
import { Trade } from '../../types';
import { formatCurrency, formatDate } from '../../lib/analytics';
import Badge from '../ui/Badge';

interface RecentTradesProps {
  trades: Trade[];
}

export default function RecentTrades({ trades }: RecentTradesProps) {
  // Take 5 most recent trades
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="card flex-1 min-w-[320px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="label-section">Recent Trades</span>
        <Link
          to="/trades"
          className="text-tv-xs text-accent hover:text-accent-light transition-colors font-ui font-medium uppercase tracking-wider"
        >
          View All →
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {recentTrades.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted font-ui text-tv-sm min-h-[160px]">
            No recent trades recorded
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <tbody>
              {recentTrades.map((trade) => {
                const isProfit = trade.netPnl >= 0;
                
                return (
                  <tr
                    key={trade.id}
                    className="h-10 hover:bg-surface-hover transition-colors border-b border-tv-border last:border-0"
                  >
                    {/* Date Column */}
                    <td className="font-mono text-tv-xs text-secondary pl-1 pr-2 whitespace-nowrap">
                      {formatDate(trade.date)}
                    </td>

                    {/* Symbol Column */}
                    <td className="text-tv-base font-medium text-inverse px-2">
                      {trade.symbol}
                    </td>

                    {/* Market Column */}
                    <td className="px-2">
                      <Badge variant="accent">{trade.market}</Badge>
                    </td>

                    {/* P&L Column */}
                    <td
                      className={`font-mono text-tv-sm text-right pr-1 font-semibold whitespace-nowrap ${
                        isProfit ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      {isProfit ? '+' : ''}
                      {formatCurrency(trade.netPnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
