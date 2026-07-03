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
 * Dhan returns times like "2021-03-10 11:20:06" or "NA".
 */
function parseDhanTime(timeStr: string | null | undefined): Date {
  if (!timeStr || timeStr === 'NA') return new Date();
  // Replace space with 'T' for ISO parsing and assume IST (UTC+05:30)
  const isoStr = timeStr.replace(' ', 'T') + '+05:30';
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function syncDhanTrades(
  clientId: string,
  accessToken: string,
  userId: string,
  existingOpenTrades: any[] = [],
  lastSyncedAt: Date | null = null
) {
  // Dhan Trade History API requires From Date and To Date
  // Fetching last 30 days
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  try {
    let allTrades: any[] = [];
    let page = 0; // Dhan API pagination starts at 0
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.dhan.co/v2/trades/${formatDate(fromDate)}/${formatDate(toDate)}/${page}`;
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
      const tradesList = data.data || data;

      if (!Array.isArray(tradesList)) {
        console.warn('Dhan API returned non-array data:', data);
        break;
      }

      if (tradesList.length === 0) {
        hasMore = false;
      } else {
        allTrades = allTrades.concat(tradesList);
        page++;
      }
    }

    // Sort all fetched raw trades chronologically
    allTrades.sort((a, b) => {
      const timeA = parseDhanTime(a.exchangeTime || a.createTime || a.updateTime).getTime();
      const timeB = parseDhanTime(b.exchangeTime || b.createTime || b.updateTime).getTime();
      return timeA - timeB;
    });

    // Deduplicate: Filter out executions we have already processed
    if (lastSyncedAt) {
      const cutoffTime = lastSyncedAt.getTime();
      allTrades = allTrades.filter(t => {
        const tradeTime = parseDhanTime(t.exchangeTime || t.createTime || t.updateTime).getTime();
        return tradeTime > cutoffTime;
      });
    }

    let latestTradeTime: Date | null = null;
    if (allTrades.length > 0) {
      const lastTrade = allTrades[allTrades.length - 1];
      latestTradeTime = parseDhanTime(lastTrade.exchangeTime || lastTrade.createTime || lastTrade.updateTime);
    }

    // --- Position Aggregator ---
    const openPositions: Record<string, any> = {};
    const tradesToInsert: any[] = [];
    const tradesToUpdate: any[] = [];

    // 1. Seed with existing OPEN positions from DB
    for (const t of existingOpenTrades) {
      openPositions[t.symbol] = {
        dbId: t.id,
        userId: t.userId,
        broker: t.broker,
        brokerTradeId: t.brokerTradeId,
        date: new Date(t.date),
        symbol: t.symbol,
        market: t.market,
        instrumentType: t.instrumentType,
        direction: t.direction,
        entryPrice: parseFloat(t.entryPrice || '0'),
        quantity: parseFloat(t.quantity || '0'),
        currentQty: parseFloat(t.quantity || '0'), // Assuming DB quantity is current open qty for fully OPEN trades
        exitPrice: parseFloat(t.exitPrice || '0'),
        exitQty: 0, // Since we only get total exit price so far, track new exits
        realizedPnl: parseFloat(t.pnl || '0'),
        charges: parseFloat(t.charges || '0'),
        status: 'OPEN',
        isModified: false,
      };
    }

    // 2. Process chronological raw executions
    for (const rawTrade of allTrades) {
      const symbol = rawTrade.tradingSymbol || rawTrade.customSymbol || `SID:${rawTrade.securityId}` || 'UNKNOWN';
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
        // Open a new position
        pos = {
          userId,
          broker: 'dhan',
          brokerTradeId: rawTrade.exchangeTradeId || rawTrade.orderId || null,
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
          isModified: true,
        };
        openPositions[symbol] = pos;
      } else {
        // Position exists, apply execution
        pos.isModified = true;
        pos.charges += tradeCharges;

        const isSameDirection = (pos.direction === 'LONG' && txType === 'BUY') || (pos.direction === 'SHORT' && txType === 'SELL');

        if (isSameDirection) {
          // Scale In
          const newTotalQty = pos.currentQty + tradeQty;
          pos.entryPrice = ((pos.entryPrice * pos.currentQty) + (tradePrice * tradeQty)) / newTotalQty;
          pos.quantity += tradeQty; // Increase max position size (for DB)
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
            
            // Archive closed position
            if (pos.dbId) {
              tradesToUpdate.push(pos);
            } else {
              tradesToInsert.push(pos);
            }
            delete openPositions[symbol];

            // If execution flipped direction, open a new position
            if (remainingQty > 0) {
              const newPos = {
                userId,
                broker: 'dhan',
                brokerTradeId: rawTrade.exchangeTradeId || rawTrade.orderId || null,
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
                isModified: true,
              };
              openPositions[symbol] = newPos;
            }
          }
        }
      }
    }

    // 3. Collect remaining open positions that were modified
    for (const symbol in openPositions) {
      const pos = openPositions[symbol];
      if (pos.isModified) {
        if (pos.dbId) {
          tradesToUpdate.push(pos);
        } else {
          tradesToInsert.push(pos);
        }
      }
    }

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
