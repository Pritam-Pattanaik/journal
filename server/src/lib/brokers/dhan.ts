/**
 * Maps Dhan exchangeSegment values to TradeVault market categories.
 */
function mapExchangeSegmentToMarket(segment: string): string {
  const segmentMap: Record<string, string> = {
    'NSE_EQ': 'NSE',
    'BSE_EQ': 'BSE',
    'NSE_FNO': 'NSE F&O',
    'BSE_FNO': 'BSE F&O',
    'MCX_COMM': 'MCX',
    'NSE_CURRENCY': 'NSE Currency',
    'BSE_CURRENCY': 'BSE Currency',
    'IDX_I': 'INDEX',
  };
  return segmentMap[segment] || segment || 'NSE';
}

/**
 * Maps Dhan instrument field to TradeVault instrumentType.
 */
function mapInstrumentType(instrument: string | null | undefined, exchangeSegment: string): string {
  if (instrument) {
    const lower = instrument.toLowerCase();
    if (lower === 'equity') return 'equity';
    if (lower === 'derivatives') {
      // Infer from exchangeSegment
      if (exchangeSegment?.includes('FNO')) return 'futures';
      if (exchangeSegment?.includes('CURRENCY')) return 'currency';
      if (exchangeSegment?.includes('COMM')) return 'commodity';
      return 'options';
    }
    return instrument.toLowerCase();
  }

  // Fallback: infer from exchangeSegment
  if (exchangeSegment?.includes('EQ')) return 'equity';
  if (exchangeSegment?.includes('FNO')) return 'futures';
  if (exchangeSegment?.includes('CURRENCY')) return 'currency';
  if (exchangeSegment?.includes('COMM')) return 'commodity';
  return 'equity';
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

export async function syncDhanTrades(clientId: string, accessToken: string, userId: string) {
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

    // Map Dhan trade history response to TradeVault trades table schema
    return allTrades.map((t: any) => {
      const direction = (t.transactionType || '').toUpperCase() === 'SELL' ? 'short' : 'long';
      const tradedPrice = parseFloat(t.tradedPrice || 0);
      const tradedQty = parseInt(t.tradedQuantity || 0, 10);
      const exchangeSegment = t.exchangeSegment || '';

      // Calculate total charges from the trade history breakdown
      const charges = (
        parseFloat(t.sebiTax || 0) +
        parseFloat(t.stt || 0) +
        parseFloat(t.brokerageCharges || 0) +
        parseFloat(t.serviceTax || 0) +
        parseFloat(t.exchangeTransactionCharges || 0) +
        parseFloat(t.stampDuty || 0)
      );

      return {
        userId,
        broker: 'dhan',
        brokerTradeId: t.exchangeTradeId || t.orderId || null,
        date: parseDhanTime(t.exchangeTime || t.createTime || t.updateTime),
        symbol: t.tradingSymbol || t.customSymbol || `SID:${t.securityId}` || 'UNKNOWN',
        market: mapExchangeSegmentToMarket(exchangeSegment),
        instrumentType: mapInstrumentType(t.instrument, exchangeSegment),
        direction,
        entryPrice: tradedPrice.toString(),
        exitPrice: null,
        quantity: tradedQty.toString(),
        pnl: null,
        charges: charges > 0 ? charges.toFixed(4) : null,
        netPnl: null,
        status: 'closed',
        source: 'broker_sync',
      };
    });
  } catch (err: any) {
    console.error('Failed to sync Dhan trades:', err);
    throw err;
  }
}
