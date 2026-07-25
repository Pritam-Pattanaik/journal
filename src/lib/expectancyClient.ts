import { Trade } from '../types';
import type { ExpectancyMetrics, WorkerRequest, WorkerResponse } from '../workers/expectancyWorker';

let workerInstance: Worker | null = null;

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('../workers/expectancyWorker.ts', import.meta.url), {
      type: 'module',
    });
  }
  return workerInstance;
}

/**
 * Architectural Client interface for asynchronous Quantitative Expectancy & Sorting evaluations
 * via dedicated CPU background Web Workers.
 */
export const ExpectancyClient = {
  analyze(trades: Trade[]): Promise<ExpectancyMetrics> {
    return new Promise((resolve) => {
      const worker = getWorker();
      const handler = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'ANALYZE_RESULT' && event.data.metrics) {
          worker.removeEventListener('message', handler);
          resolve(event.data.metrics);
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'ANALYZE', trades } as WorkerRequest);
    });
  },

  sort(trades: Trade[], sortKey: string, direction: 'asc' | 'desc'): Promise<Trade[]> {
    return new Promise((resolve) => {
      const worker = getWorker();
      const handler = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'SORT_RESULT' && event.data.sortedTrades) {
          worker.removeEventListener('message', handler);
          resolve(event.data.sortedTrades);
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'SORT', trades, sortKey, direction } as WorkerRequest);
    });
  },

  terminate() {
    if (workerInstance) {
      workerInstance.terminate();
      workerInstance = null;
    }
  }
};
