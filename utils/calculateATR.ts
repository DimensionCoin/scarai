/**
 * Calculate Average True Range (ATR) for a given set of price data
 *
 * @param high Array of high prices
 * @param low Array of low prices
 * @param close Array of closing prices
 * @param period ATR period (typically 14)
 * @returns Array of ATR values
 */
export function calculateATR(
  high: number[],
  low: number[],
  close: number[],
  period = 14
): number[] {
  if (high.length !== low.length || high.length !== close.length) {
    throw new Error("Input arrays must have the same length");
  }

  if (high.length < period + 1) {
    return [0];
  }

  // Calculate True Range series
  const trueRanges: number[] = [];

  for (let i = 1; i < high.length; i++) {
    const previousClose = close[i - 1];

    // True Range is the greatest of:
    // 1. Current High - Current Low
    // 2. |Current High - Previous Close|
    // 3. |Current Low - Previous Close|
    const tr1 = high[i] - low[i];
    const tr2 = Math.abs(high[i] - previousClose);
    const tr3 = Math.abs(low[i] - previousClose);

    const trueRange = Math.max(tr1, tr2, tr3);
    trueRanges.push(trueRange);
  }

  // Calculate first ATR as simple average of first 'period' true ranges
  const firstATR =
    trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

  // Calculate subsequent ATRs using the smoothing formula
  const atrValues: number[] = [firstATR];

  for (let i = period; i < trueRanges.length; i++) {
    const previousATR = atrValues[atrValues.length - 1];
    const currentATR = (previousATR * (period - 1) + trueRanges[i]) / period;
    atrValues.push(currentATR);
  }

  // Pad the beginning with the first calculated ATR value
  const paddedATR = Array(period).fill(atrValues[0]).concat(atrValues.slice(1));

  return paddedATR;
}

