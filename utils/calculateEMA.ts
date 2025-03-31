export function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [];

  prices.forEach((price, i) => {
    if (i === 0) {
      ema.push(price); // seed first EMA with first price
    } else {
      const prev = ema[i - 1];
      const next = price * k + prev * (1 - k);
      ema.push(next);
    }
  });

  return ema;
}
