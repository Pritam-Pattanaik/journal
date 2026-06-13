export async function syncDhanTrades(clientId: string, apiKey: string, userId: string) {
  // Dhan API requires From Date and To Date
  // Fetching last 30 days
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 30);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  try {
    let allTrades: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.dhan.co/v2/trades/${formatDate(fromDate)}/${formatDate(toDate)}/${page}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'access-token': apiKey,
          'client-id': clientId,
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

    // Map Dhan trades to our TradeVault schema
    return allTrades.map((t: any) => {
      const isSell = (t.transactionType || '').toLowerCase() === 'sell';
      
      return {
        userId,
        symbol: t.tradingSymbol || t.symbol || 'UNKNOWN',
        type: isSell ? 'short' : 'long',
        entryDate: t.createTime || t.exchangeTime || new Date().toISOString(),
        entryPrice: parseFloat(t.tradedPrice || t.price || '0').toString(),
        quantity: parseFloat(t.tradedQuantity || t.quantity || '0').toString(),
        status: 'closed', // Dhan individual trades don't natively have open/close context
        pnl: '0',
        notes: `Imported from Dhan API (Order ID: ${t.orderId || 'N/A'})`
      };
    });
  } catch (err: any) {
    console.error('Failed to sync Dhan trades:', err);
    throw err;
  }
}
