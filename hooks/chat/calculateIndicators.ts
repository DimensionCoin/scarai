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
  isRising: boolean;
  crossover: "bullish" | "bearish" | null;
} {
  const closePrices = prices.map(([, price]) => price);
  const recent = closePrices.slice(-35); // extra buffer

  const ema12 = calculateEMA(recent, 12);
  const ema26 = calculateEMA(recent, 26);

  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((v, i) => v - signalLine[i]);

  const last = macdLine.length - 1;
  const prev = last - 1;

  return {
    macd: macdLine[last],
    signal: signalLine[last],
    histogram: histogram[last],
    isRising: macdLine[last] > macdLine[prev],
    crossover:
      macdLine[prev] < signalLine[prev] && macdLine[last] > signalLine[last]
        ? "bullish"
        : macdLine[prev] > signalLine[prev] && macdLine[last] < signalLine[last]
        ? "bearish"
        : null,
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

function calculateStochRSI(prices: number[][]): number {
  const close = prices.map(([, price]) => price);
  const rsiPeriod = 14;
  const rsi = close
    .slice(-rsiPeriod - 1)
    .map((_, i, arr) => {
      if (i + rsiPeriod >= arr.length) return null;
      const slice = arr.slice(i, i + rsiPeriod);
      const gains = slice
        .map((v, j) => (j > 0 && v > slice[j - 1] ? v - slice[j - 1] : 0))
        .reduce((a, b) => a + b, 0);
      const losses = slice
        .map((v, j) => (j > 0 && v < slice[j - 1] ? slice[j - 1] - v : 0))
        .reduce((a, b) => a + b, 0);
      const rs = losses === 0 ? 100 : gains / losses;
      return 100 - 100 / (1 + rs);
    })
    .filter(Boolean) as number[];

  const lowest = Math.min(...rsi);
  const highest = Math.max(...rsi);
  const latest = rsi[rsi.length - 1];
  return ((latest - lowest) / (highest - lowest)) * 100;
}

function isVolumeSupportingMove(
  currentVolume: number,
  volumes: number[][]
): boolean {
  const avgVolume =
    volumes.map(([, v]) => v).reduce((a, b) => a + b, 0) / volumes.length;
  return currentVolume > avgVolume;
}

export function calculateIndicators(
  prices: number[][],
  volumes?: number[][],
  currentVolume?: number
) {
  if (prices.length < 26) {
    return {
      rsi: null,
      stochRsi: null,
      macd: null,
      sma: null,
      volumeSupport: undefined,
    };
  }

  const rsi = calculateRSI(prices);
  const stochRsi = calculateStochRSI(prices);
  const macd = calculateMACD(prices);
  const sma20 = calculateSMA(prices, 20);

  const volumeSupport =
    volumes && currentVolume
      ? isVolumeSupportingMove(currentVolume, volumes)
      : undefined;

  return {
    rsi,
    stochRsi,
    macd,
    sma: { sma20 },
    volumeSupport,
  };
}
