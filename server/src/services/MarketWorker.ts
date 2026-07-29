import { EventEmitter } from 'events';

const SYMBOLS = {
  nifty: '^NSEI',
  banknifty: '^NSEBANK',
  finnifty: 'NIFTY_FIN_SERVICE.NS',
  sensex: '^BSESN',
  vix: '^INDIAVIX'
};

export interface MarketQuote {
  id: string;
  name: string;
  value: number;
  change: number;
  pct: number;
  trend: 'up' | 'down';
  status: 'OPEN' | 'CLOSED' | '24/7';
  updatedAt: number;
  sparkline: number[];
}

class MarketWorker extends EventEmitter {
  private cache: MarketQuote[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private isFetching = false;
  private readonly POLLING_INTERVAL = 5000; // 5 seconds

  constructor() {
    super();
  }

  public start() {
    if (this.intervalId) return;
    
    // Initial fetch
    this.fetchData();
    
    // Start polling
    this.intervalId = setInterval(() => this.fetchData(), this.POLLING_INTERVAL);
    console.log('MarketWorker: Started polling Yahoo Finance');
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('MarketWorker: Stopped polling');
    }
  }

  public getCache(): MarketQuote[] {
    return this.cache;
  }

  private async fetchData() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const promises = Object.entries(SYMBOLS).map(async ([key, symbol]) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
          const response = await fetch(url);
          const data = await response.json();
          
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) throw new Error('Invalid data format');

          const now = new Date();
          const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric', minute: 'numeric', weekday: 'short' } as const;
          const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
          let hour = 0, minute = 0, weekday = '';
          for (const part of parts) {
            if (part.type === 'hour') hour = parseInt(part.value, 10);
            if (part.type === 'minute') minute = parseInt(part.value, 10);
            if (part.type === 'weekday') weekday = part.value;
          }
          
          let status = 'CLOSED';
          if (weekday !== 'Sat' && weekday !== 'Sun') {
            const timeInMinutes = (hour === 24 ? 0 : hour) * 60 + minute;
            const marketOpen = 9 * 60 + 15; // 09:15 AM
            const marketClose = 15 * 60 + 30; // 03:30 PM
            if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
              status = 'OPEN';
            }
          }

          const prevClose = meta.chartPreviousClose || meta.regularMarketPreviousClose;
          const current = meta.regularMarketPrice;
          const change = current - prevClose;
          const pct = (change / prevClose) * 100;

          return {
            id: key,
            name: key === 'nifty' ? 'NIFTY 50' : 
                  key === 'banknifty' ? 'BANK NIFTY' : 
                  key === 'finnifty' ? 'FINNIFTY' : 
                  key === 'sensex' ? 'SENSEX' : 
                  'INDIA VIX',
            value: current,
            change: change,
            pct: pct,
            trend: change >= 0 ? 'up' : 'down',
            status: status as MarketQuote['status'],
            updatedAt: meta.regularMarketTime * 1000,
            sparkline: data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
          };
        } catch (err) {
          console.error(`MarketWorker: Error fetching ${symbol}:`, err);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((r): r is MarketQuote => r !== null);
      
      if (validResults.length > 0) {
        const cacheStringified = JSON.stringify(this.cache);
        const newResultsStringified = JSON.stringify(validResults);

        // Only emit if the data actually changed to prevent unnecessary SSE spam
        if (cacheStringified !== newResultsStringified) {
          this.cache = validResults;
          this.emit('update', this.cache);
        }
      }
    } catch (error) {
      console.error('MarketWorker: Error during fetch cycle:', error);
    } finally {
      this.isFetching = false;
    }
  }
}

export const marketWorker = new MarketWorker();
