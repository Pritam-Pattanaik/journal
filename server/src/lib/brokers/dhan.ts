import { assignDisciplineScores, PersonalRules } from '../ai/disciplineScorer';

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
function mapInstrumentType(
  instrument: string | null | undefined,
  exchangeSegment: string,
  drvOptionType: string | null | undefined
): string {
  if (drvOptionType) {
    const opt = drvOptionType.toUpperCase();
    if (opt === 'CALL') return 'CE';
    if (opt === 'PUT') return 'PE';
  }
  if (instrument) {
    const lower = instrument.toLowerCase();
    if (lower === 'equity') return 'EQ';
    if (lower === 'derivatives') return 'FUT';
  }
  if (exchangeSegment?.includes('EQ')) return 'EQ';
  if (exchangeSegment?.includes('FNO')) return 'FUT';
  if (exchangeSegment?.includes('CURRENCY')) return 'FUT';
  if (exchangeSegment?.includes('COMM')) return 'FUT';
  return 'EQ';
}

/**
 * Parses a Dhan time string into a valid Date object.
 * Handles: "2021-03-10 11:20:06", "2026-07-02T11:14:43", "NA"
 */
function parseDhanTime(timeStr: string | null | undefined): Date {
  if (!timeStr || timeStr === 'NA') return new Date();
  let isoStr = timeStr;
  if (timeStr.includes(' ') && !timeStr.includes('T')) {
    isoStr = timeStr.replace(' ', 'T');
  }
  if (!isoStr.includes('+') && !isoStr.includes('Z')) {
    isoStr += '+05:30';
  }
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Extracts the trading date (YYYY-MM-DD) from a Dhan time string.
 */
function extractTradeDate(timeStr: string | null | undefined): string {
  if (!timeStr || timeStr === 'NA') return new Date().toISOString().split('T')[0];
  if (timeStr.includes('T')) return timeStr.split('T')[0];
  if (timeStr.includes(' ')) return timeStr.split(' ')[0];
  return timeStr;
}

export async function syncDhanTrades(
  clientId: string,
  accessToken: string,
  userId: string,
  existingOpenTrades: any[] = [],
  lastSyncedAt: Date | null = null,
  personalRules?: PersonalRules | null
) {
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  try {
    let allTrades: any[] = [];

    // Always fetch last 90 days in 30-day chunks to get full history
    let overallFromDate = new Date();
    overallFromDate.setDate(overallFromDate.getDate() - 90);
    const overallToDate = new Date();

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
        const tradesList = Array.isArray(data) ? data : (data.data || []);

        if (!Array.isArray(tradesList) || tradesList.length === 0) {
          hasMore = false;
        } else {
          allTrades = allTrades.concat(tradesList);
          page++;
        }
      }

      currentChunkStart = new Date(currentChunkEnd);
      currentChunkStart.setDate(currentChunkStart.getDate() + 1);
    }

    // Deduplicate by orderId (exchangeTradeId is unreliable — always 0 for F&O)
    const uniqueExecutions = new Map<string, any>();
    for (const t of allTrades) {
      const uniqueKey =
        t.orderId ||
        `${t.exchangeTime}_${t.securityId}_${t.tradedPrice}_${t.tradedQuantity}`;
      if (!uniqueExecutions.has(uniqueKey)) {
        uniqueExecutions.set(uniqueKey, t);
      }
    }
    allTrades = Array.from(uniqueExecutions.values());

    // Sort chronologically
    allTrades.sort((a, b) => {
      const tA = parseDhanTime(a.exchangeTime || a.createTime || a.updateTime).getTime();
      const tB = parseDhanTime(b.exchangeTime || b.createTime || b.updateTime).getTime();
      return tA - tB;
    });

    console.log(`[Dhan Sync] Fetched ${allTrades.length} unique raw executions`);

    let latestTradeTime: Date | null = null;
    if (allTrades.length > 0) {
      const lastRaw = allTrades[allTrades.length - 1];
      latestTradeTime = parseDhanTime(
        lastRaw.exchangeTime || lastRaw.createTime || lastRaw.updateTime
      );
    }

    // ── Per-Day Position Aggregator ─────────────────────────────────────────
    // Group raw executions by calendar date so each day's trades are independent.
    const tradesToInsert: any[] = [];

    const executionsByDate = new Map<string, any[]>();
    for (const rawTrade of allTrades) {
      const tradeDate = extractTradeDate(
        rawTrade.exchangeTime || rawTrade.createTime || rawTrade.updateTime
      );
      if (!executionsByDate.has(tradeDate)) executionsByDate.set(tradeDate, []);
      executionsByDate.get(tradeDate)!.push(rawTrade);
    }

    for (const [_tradeDate, dayExecutions] of executionsByDate) {
      // Per-day open positions keyed by symbol
      const openPositions: Record<string, any> = {};

      for (const rawTrade of dayExecutions) {
        // Prefer customSymbol (Dhan's reliable field). tradingSymbol is often null.
        const symbol =
          rawTrade.customSymbol ||
          rawTrade.tradingSymbol ||
          `SID:${rawTrade.securityId || 'UNKNOWN'}`;
        const txType = (rawTrade.transactionType || '').toUpperCase();
        const tradePrice = parseFloat(rawTrade.tradedPrice || 0);
        const tradeQty = parseInt(rawTrade.tradedQuantity || 0, 10);
        const exchangeSegment = rawTrade.exchangeSegment || '';
        const execTime = parseDhanTime(
          rawTrade.exchangeTime || rawTrade.createTime || rawTrade.updateTime
        );

        let parsedBrokerage = parseFloat(rawTrade.brokerageCharges || 0);
        // Inject ₹20 flat brokerage for F&O/COMM/CURRENCY where API returns 0
        if (
          parsedBrokerage === 0 &&
          (exchangeSegment.includes('FNO') ||
            exchangeSegment.includes('COMM') ||
            exchangeSegment.includes('CURRENCY'))
        ) {
          parsedBrokerage = 20;
        }

        const tradeCharges =
          parseFloat(rawTrade.sebiTax || 0) +
          parseFloat(rawTrade.stt || 0) +
          parsedBrokerage +
          parseFloat(rawTrade.serviceTax || 0) +
          parseFloat(rawTrade.exchangeTransactionCharges || 0) +
          parseFloat(rawTrade.stampDuty || 0);

        let pos = openPositions[symbol];

        if (!pos) {
          // Open a new position for this day+symbol
          pos = {
            userId,
            broker: 'dhan',
            brokerTradeId: rawTrade.orderId || null,
            date: execTime,           // entry time
            exitTime: null,           // filled when position closes
            symbol,
            market: mapExchangeSegmentToMarket(exchangeSegment),
            instrumentType: mapInstrumentType(
              rawTrade.instrument,
              exchangeSegment,
              rawTrade.drvOptionType
            ),
            direction: txType === 'SELL' ? 'SHORT' : 'LONG',
            entryPrice: tradePrice,
            quantity: tradeQty,
            currentQty: tradeQty,
            exitPrice: 0,
            exitQty: 0,
            realizedPnl: 0,
            charges: tradeCharges,
            status: 'OPEN',
            disciplineScore: null,
          };
          openPositions[symbol] = pos;
        } else {
          pos.charges += tradeCharges;
          const isSameDirection =
            (pos.direction === 'LONG' && txType === 'BUY') ||
            (pos.direction === 'SHORT' && txType === 'SELL');

          if (isSameDirection) {
            // Scale In — update avg entry price
            const newTotalQty = pos.currentQty + tradeQty;
            pos.entryPrice =
              (pos.entryPrice * pos.currentQty + tradePrice * tradeQty) /
              newTotalQty;
            pos.quantity += tradeQty;
            pos.currentQty = newTotalQty;
          } else {
            // Scale Out / Close
            const closeQty = Math.min(pos.currentQty, tradeQty);

            // Weighted average exit price
            const totalExitValue = pos.exitPrice * pos.exitQty + tradePrice * closeQty;
            pos.exitQty += closeQty;
            pos.exitPrice = totalExitValue / pos.exitQty;

            // Realized P&L
            const pnlMultiplier = pos.direction === 'LONG' ? 1 : -1;
            pos.realizedPnl +=
              (tradePrice - pos.entryPrice) * closeQty * pnlMultiplier;

            pos.currentQty -= closeQty;
            // ✅ Track exit time for discipline scorer
            pos.exitTime = execTime;

            const remainingQty = tradeQty - closeQty;

            if (pos.currentQty === 0) {
              // Position fully closed
              const net = pos.realizedPnl - pos.charges;
              pos.status = net > 0 ? 'WIN' : net < 0 ? 'LOSS' : 'BREAKEVEN';
              tradesToInsert.push(pos);
              delete openPositions[symbol];

              // If execution flipped direction, open a new position
              if (remainingQty > 0) {
                openPositions[symbol] = {
                  userId,
                  broker: 'dhan',
                  brokerTradeId: rawTrade.orderId || null,
                  date: execTime,
                  exitTime: null,
                  symbol,
                  market: mapExchangeSegmentToMarket(exchangeSegment),
                  instrumentType: mapInstrumentType(
                    rawTrade.instrument,
                    exchangeSegment,
                    rawTrade.drvOptionType
                  ),
                  direction: txType === 'SELL' ? 'SHORT' : 'LONG',
                  entryPrice: tradePrice,
                  quantity: remainingQty,
                  currentQty: remainingQty,
                  exitPrice: 0,
                  exitQty: 0,
                  realizedPnl: 0,
                  charges: 0,
                  status: 'OPEN',
                  disciplineScore: null,
                };
              }
            }
          }
        }
      }

      // Collect remaining open positions at end of day
      for (const symbol in openPositions) {
        tradesToInsert.push(openPositions[symbol]);
      }
    }

    console.log(`[Dhan Sync] Built ${tradesToInsert.length} position records`);

    // ── Discipline Scoring Pass ────────────────────────────────────────────
    // Layer 1: Universal behavioral signals (always)
    // Layer 2: Personal rule compliance (if user has configured rules)
    assignDisciplineScores(tradesToInsert, personalRules ?? null);

    console.log(
      `[Dhan Sync] Discipline scores assigned. Sample:`,
      tradesToInsert.slice(0, 3).map(t => ({
        symbol: t.symbol,
        status: t.status,
        score: t.disciplineScore,
      }))
    );

    // ── Schema Mapping ─────────────────────────────────────────────────────
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
      disciplineScore: p.disciplineScore ?? null,
      source: 'broker_sync',
      ...(p.dbId ? { dbId: p.dbId } : {}),
    });

    return {
      tradesToInsert: tradesToInsert.map(mapToSchema),
      tradesToUpdate: [] as any[],
      latestTradeTime,
    };
  } catch (err: any) {
    console.error('Failed to sync Dhan trades:', err);
    throw err;
  }
}
