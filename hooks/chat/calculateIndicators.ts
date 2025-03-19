// Simplified indicator calculations (daily data; adjust for 4-hour if API supports)
function calculateSMA(prices: number[][], period: number): number {
  const recent = prices.slice(-period).map(([, price]) => price);
  return recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
}

function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  return prices.reduce((emas: number[], price, i) => {
    emas.push(i === 0 ? price : price * k + emas[i - 1] * (1 - k));
    return emas;
  }, []);
}

function calculateMACD(prices: number[][]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const closePrices = prices.map(([, price]) => price);
  const ema12 = calculateEMA(closePrices.slice(-26), 12);
  const ema26 = calculateEMA(closePrices.slice(-26), 26);
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  const signalLine = calculateEMA(closePrices.slice(-9), 9)[8];
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

function calculateRSI(prices: number[][]): number {
  const changes = prices
    .slice(-15)
    .map(([, p], i, arr) => (i > 0 ? p - arr[i - 1][1] : 0));
  const gains =
    changes.map((c) => (c > 0 ? c : 0)).reduce((a, b) => a + b, 0) / 14;
  const losses =
    changes.map((c) => (c < 0 ? -c : 0)).reduce((a, b) => a + b, 0) / 14;
  return losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
}

export function calculateIndicators(prices: number[][]) {
  if (prices.length < 26) return { rsi: null, macd: null, sma: null }; // Minimum for MACD
  return {
    rsi: calculateRSI(prices),
    macd: calculateMACD(prices),
    sma: { sma20: calculateSMA(prices, 20) },
  };
}
