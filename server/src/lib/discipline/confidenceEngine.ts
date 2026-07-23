export function calculateConfidence(tradeCount: number): number {
  if (tradeCount === 0) return 40.0;
  if (tradeCount < 10) return 50.0 + (tradeCount * 2);
  if (tradeCount < 50) return 70.0 + ((tradeCount - 10) * 0.5);
  if (tradeCount < 100) return 90.0 + ((tradeCount - 50) * 0.1);
  return Math.min(99.0, 95.0 + ((tradeCount - 100) * 0.01));
}
