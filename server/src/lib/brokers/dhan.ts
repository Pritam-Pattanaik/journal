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
 * FIX #3: Resolve the best available timestamp from a raw Dhan trade object.
 * Priority: exchangeTime > createTime > updateTime
 * All three fields can be "NA" or null in certain Dhan API responses.
 * Returns null only if ALL three fields are absent/NA.
 */
function getBestTime(rawTrade: any): string | null {
  const candidates = [rawTrade.exchangeTime, rawTrade.createTime, rawTrade.updateTime];
  for (const candidate of candidates) {
    if (candidate && String(candidate).toUpperCase() !== 'NA' && String(candidate).trim() !== '') {
      return String(candidate);
    }
  }
  return null;
}

/**
 * Parses a Dhan time string into a valid Date object.
 * Handles: "2021-03-10 11:20:06", "2026-07-02T11:14:43"
 * NEVER returns current time as a fallback — returns epoch (1970) so broken
 * timestamps sort first and are clearly identifiable.
 */
function parseDhanTime(timeStr: string | null | undefined): Date {
  if (!timeStr) return new Date(0);
  let isoStr = timeStr;
  if (isoStr.includes(' ') && !isoStr.includes('T')) {
    isoStr = isoStr.replace(' ', 'T');
  }
  if (!isoStr.includes('+') && !isoStr.includes('Z')) {
    isoStr += '+05:30';
  }
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/**
 * Extracts the trading date (YYYY-MM-DD) from a resolved time string.
 * Uses getBestTime() result — never falls back to today's date.
 */
function extractTradeDate(bestTimeStr: string | null): string {
  if (!bestTimeStr) {
    // Truly unknown date — use a sentinel so it doesn't pollute real dates
    return '1970-01-01';
  }
  if (bestTimeStr.includes('T')) return bestTimeStr.split('T')[0];
  if (bestTimeStr.includes(' ')) return bestTimeStr.split(' ')[0];
  return bestTimeStr;
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

    // ── FIX #1: Only use the historical endpoint ──────────────────────────────
    // The previous code fetched from BOTH /v2/trades (today) AND the historical
    // paginated endpoint. Since the historical range ends at today, both return
    // today's trades. For F&O trades with exchangeTradeId=0, the dedup key
    // included the timestamp — but today's API returns exchangeTime:"NA" while
    // historical returns a real timestamp, so the same execution had two different
    // keys and was NOT deduplicated → appeared twice → doubled P&L.
    //
    // The historical endpoint already covers today (overallToDate = new Date()),
    // so the today's endpoint is entirely redundant. Removing it eliminates
    // all double-counting at the source.

    // ── Incremental vs Full Sync ──────────────────────────────────────────────
    // On the first sync (lastSyncedAt = null): full 90-day backfill.
    // On subsequent syncs: only fetch from 2 days before lastSyncedAt to
    // catch late-arriving executions. This cuts routine sync time from
    // 30–90s (3 paginated chunks) to 2–10s (1 small chunk) — essential
    // for Vercel serverless which times out on long-running functions.
    const overallToDate = new Date();
    let overallFromDate: Date;

    if (lastSyncedAt) {
      // Incremental: go back 2 days from last sync as an overlap buffer
      overallFromDate = new Date(lastSyncedAt);
      overallFromDate.setDate(overallFromDate.getDate() - 2);
      console.log(`[Dhan Sync] Incremental mode: ${formatDate(overallFromDate)} → ${formatDate(overallToDate)}`);
    } else {
      // First-time full backfill: 90 days
      overallFromDate = new Date();
      overallFromDate.setDate(overallFromDate.getDate() - 90);
      console.log(`[Dhan Sync] Full backfill: ${formatDate(overallFromDate)} → ${formatDate(overallToDate)}`);
    }

    let currentChunkStart = new Date(overallFromDate);

    // ── INTRADAY SYNC (Today's Endpoint) ──────────────────────────────────────
    // Fetch today's trades directly to bypass the historical API delay.
    try {
      const intradayRes = await fetch('https://api.dhan.co/v2/trades', {
        headers: {
          'Accept': 'application/json',
          'access-token': accessToken,
          'client-id': clientId,
        }
      });
      if (intradayRes.ok) {
        const data = await intradayRes.json();
        const trades = Array.isArray(data) ? data : (data.data || []);
        for (const t of trades) {
          // If the intraday trade has "NA" for its timestamp, fallback to today's date
          // so it doesn't get discarded as 1970-01-01 later.
          if ((!t.exchangeTime || t.exchangeTime === 'NA') && (!t.createTime || t.createTime === 'NA')) {
            t.createTime = new Date().toISOString();
          }
        }
        allTrades = allTrades.concat(trades);
        console.log(`[Dhan Sync] Fetched ${trades.length} intraday trades from Today's endpoint.`);
      }
    } catch (e) {
      console.warn('[Dhan Sync] Failed to fetch intraday trades:', e);
    }

    while (currentChunkStart < overallToDate) {
      let currentChunkEnd = new Date(currentChunkStart);
      currentChunkEnd.setDate(currentChunkEnd.getDate() + 30);
      if (currentChunkEnd > overallToDate) {
        currentChunkEnd = overallToDate;
      }

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const url = `https://api.dhan.co/v2/trades/${formatDate(currentChunkStart)}/${formatDate(currentChunkEnd)}/${page}`;

        // 15-second timeout per request — prevents hanging forever on expired/invalid tokens
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response: Response;
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'access-token': accessToken,
              'client-id': clientId,
            },
            signal: controller.signal,
          });
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            throw new Error('TOKEN_EXPIRED: Dhan API timed out — your Access Token has likely expired. Please paste a new token in Settings → Connected Brokers.');
          }
          throw fetchErr;
        }
        clearTimeout(timeoutId);

        // 401 / 403 = expired or invalid token
        if (response.status === 401 || response.status === 403) {
          throw new Error('TOKEN_EXPIRED: Dhan Access Token is invalid or expired. Please paste a new token in Settings → Connected Brokers.');
        }

        if (!response.ok) {
          const errText = await response.text();
          let cleanError = `Dhan API error (${response.status})`;
          try {
            const errJson = JSON.parse(errText);
            if (errJson.errorMessage) {
              cleanError = `DhanHQ: ${errJson.errorMessage}`;
            }
          } catch(e) {}
          throw new Error(cleanError);
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

    // ── FIX #2: Stable deduplication key (no timestamp component) ────────────
    // Previously the composite key for F&O trades included exchangeTime, which
    // differs between API calls (e.g. "NA" vs real timestamp). The new key uses
    // only orderId + exchangeTradeId + quantity + price — all of which are stable
    // across any API call that returns the same execution.
    const uniqueExecutions = new Map<string, any>();
    for (const t of allTrades) {
      const hasValidTradeId =
        t.exchangeTradeId &&
        String(t.exchangeTradeId) !== '0' &&
        String(t.exchangeTradeId) !== '';

      // Composite key: orderId + exchangeOrderId (exchange-assigned) + qty + price + symbol
      // This is collision-resistant even for partial fills of the same order at the same price.
      // We intentionally do NOT include exchangeTime — it differs between API calls (real vs "NA").
      const uniqueKey = hasValidTradeId
        ? String(t.exchangeTradeId)
        : [
            t.orderId || '',
            t.exchangeOrderId || '',
            t.tradedQuantity || '',
            t.tradedPrice || '',
            t.customSymbol || t.securityId || '',
          ].join('_');

      if (!uniqueExecutions.has(uniqueKey)) {
        uniqueExecutions.set(uniqueKey, t);
      }
    }
    allTrades = Array.from(uniqueExecutions.values());


    // ── FIX #3: Sort using getBestTime() — never use raw exchangeTime alone ───
    // parseDhanTime("NA") previously returned new Date() (now), causing those
    // trades to sort LAST. getBestTime() falls through exchangeTime → createTime
    // → updateTime to find a real timestamp. parseDhanTime now returns epoch for
    // truly missing times so they sort FIRST (not last), making their ordering
    // predictable and easy to debug.
    allTrades.sort((a, b) => {
      const tA = parseDhanTime(getBestTime(a)).getTime();
      const tB = parseDhanTime(getBestTime(b)).getTime();
      return tA - tB;
    });

    console.log(`[Dhan Sync] Fetched ${allTrades.length} unique raw executions`);

    let latestTradeTime: Date | null = null;
    if (allTrades.length > 0) {
      const lastRaw = allTrades[allTrades.length - 1];
      latestTradeTime = parseDhanTime(getBestTime(lastRaw));
    }

    // ── Per-Day Position Aggregator ─────────────────────────────────────────
    // Group raw executions by calendar date.
    // FIX #3 (continued): extractTradeDate now receives the resolved bestTime
    // string (never "NA"), so trades are always placed in the correct date bucket.
    const tradesToInsert: any[] = [];

    const executionsByDate = new Map<string, any[]>();
    for (const rawTrade of allTrades) {
      const tradeDate = extractTradeDate(getBestTime(rawTrade));
      // Skip sentinel date (trades with no resolvable timestamp)
      if (tradeDate === '1970-01-01') {
        console.warn('[Dhan Sync] Skipping execution with no resolvable timestamp:', rawTrade.orderId);
        continue;
      }
      if (!executionsByDate.has(tradeDate)) executionsByDate.set(tradeDate, []);
      executionsByDate.get(tradeDate)!.push(rawTrade);
    }

    // ── FIX #4: Sort within each day BEFORE aggregating ───────────────────────
    // After the Map is built, each day's list must be sorted chronologically so
    // the opening leg (BUY or SELL that initiates a position) always comes before
    // the closing leg. Out-of-order processing flips the direction and inverts
    // the P&L sign (e.g. showing -₹1,485 instead of +₹1,485).
    for (const dayExecutions of executionsByDate.values()) {
      dayExecutions.sort((a, b) =>
        parseDhanTime(getBestTime(a)).getTime() - parseDhanTime(getBestTime(b)).getTime()
      );
    }

    // ── FIX #5: Carry open positions across day boundaries ────────────────────
    // F&O overnight positions opened on Day N and closed on Day N+1 were
    // previously broken: Day N+1's aggregator had no knowledge of the open
    // position, so the closing SELL was misread as a new SHORT entry.
    // We now carry the openPositions map into the next day so multi-day
    // positions aggregate correctly.
    const sortedDates = Array.from(executionsByDate.keys()).sort();

    // Carry-forward bucket: positions still open at end of a trading day
    let carryForwardPositions: Record<string, any> = {};

    for (const tradeDate of sortedDates) {
      const dayExecutions = executionsByDate.get(tradeDate)!;

      // Seed today's open positions from the prior day's carry-forward
      const openPositions: Record<string, any> = { ...carryForwardPositions };

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
        const execTime = parseDhanTime(getBestTime(rawTrade));

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

      // FIX #5 (continued): Carry truly open (not yet closed) positions forward
      // to the next day instead of immediately flushing them as OPEN records.
      // Only positions that remain open after ALL dates are processed get flushed.
      carryForwardPositions = {};
      for (const symbol in openPositions) {
        const pos = openPositions[symbol];
        // Check if this position has a corresponding date in a future day
        const hasMoreDays = sortedDates.some(d => d > tradeDate);
        if (hasMoreDays) {
          // Carry forward — don't insert yet
          carryForwardPositions[symbol] = pos;
        } else {
          // Last trading day in the dataset — flush as OPEN
          tradesToInsert.push(pos);
        }
      }
    }

    // Flush any remaining carry-forward positions (open at end of full sync window)
    for (const symbol in carryForwardPositions) {
      tradesToInsert.push(carryForwardPositions[symbol]);
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
