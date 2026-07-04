/**
 * Maps Dhan exchangeSegment values to TradeVault market categories.
 * Must match the frontend Trade type: 'NSE' | 'BSE' | 'F&O' | 'MCX' | 'Crypto'
 */
function mapExchangeSegmentToMarket(segment: string): string {
  const segmentMap: Record<string, string> = {
    'NSE_EQ': 'NSE',
    'BSE_EQ': 'BSE',
    'NSE_FNO': 'F&O',
    'BSE_FNO': 'F&O',
    'MCX_COMM': 'MCX',
    'NSE_CURRENCY': 'F&O',
    'BSE_CURRENCY': 'F&O',
    'IDX_I': 'NSE',
  };
  return segmentMap[segment] || segment || 'NSE';
}

/**
 * Maps Dhan instrument field + exchangeSegment to TradeVault instrumentType.
 * Must match the frontend Trade type: 'EQ' | 'CE' | 'PE' | 'FUT' | 'CRYPTO'
 */
function mapInstrumentType(instrument: string | null | undefined, exchangeSegment: string, drvOptionType: string | null | undefined): string {
  // For derivatives, check option type first
  if (drvOptionType) {
    const opt = drvOptionType.toUpperCase();
    if (opt === 'CALL') return 'CE';
    if (opt === 'PUT') return 'PE';
  }

  // Check instrument field
  if (instrument) {
    const lower = instrument.toLowerCase();
    if (lower === 'equity') return 'EQ';
    if (lower === 'derivatives') {
      if (exchangeSegment?.includes('FNO')) return 'FUT';
      return 'FUT';
    }
  }

  // Fallback from exchangeSegment
  if (exchangeSegment?.includes('EQ')) return 'EQ';
  if (exchangeSegment?.includes('FNO')) return 'FUT';
  if (exchangeSegment?.includes('CURRENCY')) return 'FUT';
  if (exchangeSegment?.includes('COMM')) return 'FUT';
  return 'EQ';
}

/**
 * Parses a Dhan time string into a valid Date object.
 * Dhan returns times like "2021-03-10 11:20:06" or "2026-07-02T11:14:43" or "NA".
 */
function parseDhanTime(timeStr: string | null | undefined): Date {
  if (!timeStr || timeStr === 'NA') return new Date();
  // Handle both "2021-03-10 11:20:06" and "2026-07-02T11:14:43" formats
  let isoStr = timeStr;
  if (timeStr.includes(' ') && !timeStr.includes('T')) {
    isoStr = timeStr.replace(' ', 'T');
  }
  // Append IST offset if no timezone info present
  if (!isoStr.includes('+') && !isoStr.includes('Z')) {
    isoStr += '+05:30';
  }
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Extracts the trading date (YYYY-MM-DD) from a Dhan time string.
 * Used to group intraday executions into daily trades.
 */
function extractTradeDate(timeStr: string | null | undefined): string {
  if (!timeStr || timeStr === 'NA') return new Date().toISOString().split('T')[0];
  // Handle both "2021-03-10 11:20:06" and "2026-07-02T11:14:43" formats
  if (timeStr.includes('T')) return timeStr.split('T')[0];
  if (timeStr.includes(' ')) return timeStr.split(' ')[0];
  return timeStr;
}

export async function syncDhanTrades(
  clientId: string,
  accessToken: string,
  userId: string,
  existingOpenTrades: any[] = [],
  lastSyncedAt: Date | null = null
) {
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  try {
    let allTrades: any[] = [];
    
    // Determine the overall start date
    // Always fetch at least 90 days for a comprehensive history
    let overallFromDate = new Date();
    overallFromDate.setDate(overallFromDate.getDate() - 90);
    
    const overallToDate = new Date();
    
    // Process in 30-day chunks to respect API limits
    let currentChunkStart = new Date(overallFromDate);
    
    while (currentChunkStart < overallToDate) {
      let currentChunkEnd = new Date(currentChunkStart);
      currentChunkEnd.setDate(currentChunkEnd.getDate() + 30);
      if (currentChunkEnd > overallToDate) {
        currentChunkEnd = overallToDate;
      }
      
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const url = `https://api.dhan.co/v2/trades/${formatDate(currentChunkStart)}/${formatDate(currentChunkEnd)}/${page}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'access-token': accessToken,
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Dhan API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        // Dhan API returns an array directly (no wrapper object)
        const tradesList = Array.isArray(data) ? data : (data.data || []);

        if (!Array.isArray(tradesList) || tradesList.length === 0) {
          hasMore = false;
        } else {
          allTrades = allTrades.concat(tradesList);
          page++;
        }
      }
      
      // Move to the next chunk
      currentChunkStart = new Date(currentChunkEnd);
      currentChunkStart.setDate(currentChunkStart.getDate() + 1);
    }

    // Deduplicate raw executions by orderId (unique per execution)
    // Note: exchangeTradeId can be 0 for all trades, so it's NOT a reliable unique key
    const uniqueExecutions = new Map<string, any>();
    for (const t of allTrades) {
      const uniqueKey = t.orderId || `${t.exchangeTime}_${t.securityId}_${t.tradedPrice}_${t.tradedQuantity}`;
      if (!uniqueExecutions.has(uniqueKey)) {
        uniqueExecutions.set(uniqueKey, t);
      }
    }
    allTrades = Array.from(uniqueExecutions.values());

    // Sort all fetched raw trades chronologically
    allTrades.sort((a, b) => {
      const timeA = parseDhanTime(a.exchangeTime || a.createTime || a.updateTime).getTime();
      const timeB = parseDhanTime(b.exchangeTime || b.createTime || b.updateTime).getTime();
      return timeA - timeB;
    });

    console.log(`[Dhan Sync] Fetched ${allTrades.length} unique raw executions across 90 days`);

    let latestTradeTime: Date | null = null;
    if (allTrades.length > 0) {
      const lastTrade = allTrades[allTrades.length - 1];
      latestTradeTime = parseDhanTime(lastTrade.exchangeTime || lastTrade.createTime || lastTrade.updateTime);
    }

    // --- Per-Day Position Aggregator ---
    // Group executions by date + symbol to create individual day-trades.
    // This ensures each day's trades for a symbol result in a separate trade record,
    // rather than collapsing all 90 days of the same symbol into one giant position.
    
    interface DaySymbolKey { date: string; symbol: string; }
    
    const tradesToInsert: any[] = [];
    const tradesToUpdate: any[] = [];

    // Group raw executions by trading date
    const executionsByDate = new Map<string, any[]>();
    for (const rawTrade of allTrades) {
      const tradeDate = extractTradeDate(rawTrade.exchangeTime || rawTrade.createTime || rawTrade.updateTime);
      if (!executionsByDate.has(tradeDate)) {
        executionsByDate.set(tradeDate, []);
      }
      executionsByDate.get(tradeDate)!.push(rawTrade);
    }

    // Process each day independently
    for (const [tradeDate, dayExecutions] of executionsByDate) {
      const openPositions: Record<string, any> = {};

      for (const rawTrade of dayExecutions) {
        // Build symbol key: use customSymbol (Dhan's reliable field), fallback to securityId
        const symbol = rawTrade.customSymbol || rawTrade.tradingSymbol || `SID:${rawTrade.securityId || 'UNKNOWN'}`;
        const txType = (rawTrade.transactionType || '').toUpperCase();
        const tradePrice = parseFloat(rawTrade.tradedPrice || 0);
        const tradeQty = parseInt(rawTrade.tradedQuantity || 0, 10);
        const exchangeSegment = rawTrade.exchangeSegment || '';

        let parsedBrokerage = parseFloat(rawTrade.brokerageCharges || 0);
        
        // Inject Rs 20 brokerage if Dhan API returns 0 for F&O, Currency, Commodity
        if (parsedBrokerage === 0 && (
          exchangeSegment.includes('FNO') ||
          exchangeSegment.includes('COMM') ||
          exchangeSegment.includes('CURRENCY')
        )) {
          parsedBrokerage = 20;
        }

        const tradeCharges = (
          parseFloat(rawTrade.sebiTax || 0) +
          parseFloat(rawTrade.stt || 0) +
          parsedBrokerage +
          parseFloat(rawTrade.serviceTax || 0) +
          parseFloat(rawTrade.exchangeTransactionCharges || 0) +
          parseFloat(rawTrade.stampDuty || 0)
        );

        let pos = openPositions[symbol];

        if (!pos) {
          // Open a new position for this day+symbol
          pos = {
            userId,
            broker: 'dhan',
            brokerTradeId: rawTrade.orderId || null,
            date: parseDhanTime(rawTrade.exchangeTime || rawTrade.createTime || rawTrade.updateTime),
            symbol,
            market: mapExchangeSegmentToMarket(exchangeSegment),
            instrumentType: mapInstrumentType(rawTrade.instrument, exchangeSegment, rawTrade.drvOptionType),
            direction: txType === 'SELL' ? 'SHORT' : 'LONG',
            entryPrice: tradePrice,
            quantity: tradeQty,
            currentQty: tradeQty,
            exitPrice: 0,
            exitQty: 0,
            realizedPnl: 0,
            charges: tradeCharges,
            status: 'OPEN',
          };
          openPositions[symbol] = pos;
        } else {
          // Position exists for this day+symbol, apply execution
          pos.charges += tradeCharges;

          const isSameDirection = (pos.direction === 'LONG' && txType === 'BUY') || (pos.direction === 'SHORT' && txType === 'SELL');

          if (isSameDirection) {
            // Scale In
            const newTotalQty = pos.currentQty + tradeQty;
            pos.entryPrice = ((pos.entryPrice * pos.currentQty) + (tradePrice * tradeQty)) / newTotalQty;
            pos.quantity += tradeQty;
            pos.currentQty = newTotalQty;
          } else {
            // Scale Out / Close
            const closeQty = Math.min(pos.currentQty, tradeQty);
            
            // Update average exit price
            const totalExitValue = (pos.exitPrice * pos.exitQty) + (tradePrice * closeQty);
            pos.exitQty += closeQty;
            pos.exitPrice = totalExitValue / pos.exitQty;

            // Add to Realized PnL
            const pnlMultiplier = pos.direction === 'LONG' ? 1 : -1;
            const tradePnl = (tradePrice - pos.entryPrice) * closeQty * pnlMultiplier;
            pos.realizedPnl += tradePnl;

            pos.currentQty -= closeQty;
            
            const remainingQty = tradeQty - closeQty;

            if (pos.currentQty === 0) {
              // Position Fully Closed
              const net = pos.realizedPnl - pos.charges;
              pos.status = net > 0 ? 'WIN' : (net < 0 ? 'LOSS' : 'BREAKEVEN');
              tradesToInsert.push(pos);
              delete openPositions[symbol];

              // If execution flipped direction, open a new position
              if (remainingQty > 0) {
                const newPos = {
                  userId,
                  broker: 'dhan',
                  brokerTradeId: rawTrade.orderId || null,
                  date: parseDhanTime(rawTrade.exchangeTime || rawTrade.createTime || rawTrade.updateTime),
                  symbol,
                  market: mapExchangeSegmentToMarket(exchangeSegment),
                  instrumentType: mapInstrumentType(rawTrade.instrument, exchangeSegment, rawTrade.drvOptionType),
                  direction: txType === 'SELL' ? 'SHORT' : 'LONG',
                  entryPrice: tradePrice,
                  quantity: remainingQty,
                  currentQty: remainingQty,
                  exitPrice: 0,
                  exitQty: 0,
                  realizedPnl: 0,
                  charges: 0,
                  status: 'OPEN',
                };
                openPositions[symbol] = newPos;
              }
            }
          }
        }
      }

      // Collect any positions still open at end of day
      for (const symbol in openPositions) {
        const pos = openPositions[symbol];
        // Mark unclosed intraday positions as OPEN
        tradesToInsert.push(pos);
      }
    }

    console.log(`[Dhan Sync] Produced ${tradesToInsert.length} trades to insert`);

    // Prepare final objects for database schema mapping
    const mapToSchema = (p: any) => ({
      userId: p.userId,
      broker: p.broker,
      brokerTradeId: p.brokerTradeId,
      date: p.date,
      symbol: p.symbol,
      market: p.market,
      instrumentType: p.instrumentType,
      direction: p.direction,
      entryPrice: p.entryPrice.toString(),
      exitPrice: p.exitPrice > 0 ? p.exitPrice.toString() : null,
      quantity: p.quantity.toString(),
      pnl: p.realizedPnl !== 0 ? p.realizedPnl.toFixed(4) : null,
      charges: p.charges > 0 ? p.charges.toFixed(4) : null,
      netPnl: (p.realizedPnl - p.charges).toFixed(4),
      status: p.status,
      source: 'broker_sync',
      ...(p.dbId ? { dbId: p.dbId } : {})
    });

    return {
      tradesToInsert: tradesToInsert.map(mapToSchema),
      tradesToUpdate: tradesToUpdate.map(mapToSchema),
      latestTradeTime,
    };
  } catch (err: any) {
    console.error('Failed to sync Dhan trades:', err);
    throw err;
  }
}
