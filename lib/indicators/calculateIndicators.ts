export type IndicatorsResult = {
  rsi: number | null;
  stochRsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    isRising: boolean;
    crossover: "bullish" | "bearish" | null;
  } | null;
  sma: {
    sma20: number;
    sma50: number;
    sma200: number;
    aboveSma20: boolean;
    aboveSma50: boolean;
    aboveSma200: boolean;
  } | null;
  fibLevels: { [key: string]: number } | null;
  trendBias: "uptrend" | "downtrend" | "sideways" | null;
  rangePosition: number | null;
  volumeSupport?: boolean;
  volatility: number | null;
  stochRsiFlip: "bullish" | "bearish" | null;
  confidence: "low" | "medium" | "high";
  candlePattern: string | null;
  vwap: number | null;
  momentum: number | null;
  isBreakout: boolean;
  isVolumeSpike: boolean;
  trendDuration: number;
  rangeState: "expanding" | "contracting" | "stable";
};

function calculateSMA(prices: number[][], period: number): number | null {
  const recent = prices.slice(-period).map(([, price]) => price);
  return recent.length
    ? recent.reduce((a, b) => a + b, 0) / recent.length
    : null;
}

function calculateEMA(prices: number[], period: number): number[] {
  const k = 2 / (period + 1);
  return prices.reduce((emas: number[], price, i) => {
    emas.push(i === 0 ? price : price * k + emas[i - 1] * (1 - k));
    return emas;
  }, []);
}

function calculateMACD(prices: number[][]): IndicatorsResult["macd"] {
  const closePrices = prices.map(([, price]) => price);
  const recent = closePrices.slice(-35);
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

export function calculateRSI(prices: number[][]): number {
  const changes = prices
    .slice(-15)
    .map(([, p], i, arr) => (i > 0 ? p - arr[i - 1][1] : 0));
  const gains = changes.filter((c) => c > 0).reduce((a, b) => a + b, 0) / 14;
  const losses =
    changes.filter((c) => c < 0).reduce((a, b) => a + Math.abs(b), 0) / 14;
  const rsi = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
  return Math.min(100, Math.max(0, rsi));
}

function calculateStochRSI(prices: number[][]): {
  value: number;
  history: number[];
} {
  const close = prices.map(([, price]) => price);
  const rsiPeriod = 14;

  const rsiSeries = close
    .slice(-rsiPeriod - 20)
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
    .filter((v): v is number => v !== null);

  const latest = rsiSeries.at(-1)!;
  const lowest = Math.min(...rsiSeries);
  const highest = Math.max(...rsiSeries);

  return {
    value: ((latest - lowest) / (highest - lowest)) * 100,
    history: rsiSeries,
  };
}

function getStochRsiFlip(history: number[]): "bullish" | "bearish" | null {
  const prev = history.at(-2);
  const curr = history.at(-1);
  if (prev !== undefined && curr !== undefined) {
    if (prev < 20 && curr > 20) return "bullish";
    if (prev > 80 && curr < 80) return "bearish";
  }
  return null;
}

function isVolumeSupportingMove(
  currentVolume: number,
  volumes: number[][]
): boolean {
  const avgVolume =
    volumes.map(([, v]) => v).reduce((a, b) => a + b, 0) / volumes.length;
  return currentVolume > avgVolume;
}

function calculateVolatility(prices: number[][]): number {
  const close = prices.map(([, price]) => price).slice(-14);
  const high = Math.max(...close);
  const low = Math.min(...close);
  return ((high - low) / low) * 100;
}

function getConfidenceScore({
  rsi,
  macd,
  stochRsi,
  volumeSupport,
  price,
  sma20,
}: {
  rsi: number;
  macd: IndicatorsResult["macd"];
  stochRsi: number;
  volumeSupport?: boolean;
  price: number;
  sma20: number;
}): IndicatorsResult["confidence"] {
  let score = 0;
  if (macd) {
    if (macd.histogram > 0) score += 1;
    if (macd.crossover === "bullish") score += 2;
  }
  if (rsi > 50 && rsi < 70) score += 1;
  if (stochRsi > 50) score += 1;
  if (volumeSupport) score += 1;
  if (price > sma20) score += 1;

  return score >= 5 ? "high" : score >= 3 ? "medium" : "low";
}

function calculateFibLevels(prices: number[][]): { [key: string]: number } {
  const highs = prices.map(([, price]) => price);
  const high = Math.max(...highs);
  const low = Math.min(...highs);
  const diff = high - low;

  return {
    "0%": high,
    "23.6%": high - 0.236 * diff,
    "38.2%": high - 0.382 * diff,
    "50%": high - 0.5 * diff,
    "61.8%": high - 0.618 * diff,
    "78.6%": high - 0.786 * diff,
    "100%": low,
  };
}

function calculateTrendBias(
  sma50: number,
  sma200: number
): IndicatorsResult["trendBias"] {
  if (sma50 > sma200) return "uptrend";
  if (sma50 < sma200) return "downtrend";
  return "sideways";
}

function calculateRangePosition(prices: number[][]): number | null {
  const price = prices.at(-1)?.[1] ?? null;
  const values = prices.map(([, price]) => price);
  const high = Math.max(...values);
  const low = Math.min(...values);
  return price !== null ? ((price - low) / (high - low)) * 100 : null;
}

function detectCandlePattern(prices: number[][]): string | null {
  if (prices.length < 2) return null;
  const [, prevClose] = prices.at(-2)!;
  const [, currClose] = prices.at(-1)!;

  const range = Math.abs(currClose - prevClose);

  if (range < 0.001) return "Doji";
  if (currClose > prevClose) return "Bullish Close";
  if (currClose < prevClose) return "Bearish Close";

  return null;
}


function calculateVWAP(prices: number[][], volumes: number[][]): number | null {
  if (!volumes?.length || prices.length !== volumes.length) return null;

  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i][1];
    const volume = volumes[i][1];
    cumulativePV += price * volume;
    cumulativeVolume += volume;
  }

  return cumulativeVolume > 0 ? cumulativePV / cumulativeVolume : null;
}

function calculateMomentum(prices: number[][]): number | null {
  if (prices.length < 10) return null;
  const close = prices.map(([, price]) => price);
  return close[close.length - 1] - close[close.length - 10];
}

function detectBreakout(prices: number[][]): boolean {
  if (prices.length < 20) return false;
  const recentClose = prices.at(-1)![1];
  const pastHigh = Math.max(...prices.slice(-20).map(([, p]) => p));
  const pastLow = Math.min(...prices.slice(-20).map(([, p]) => p));
  return recentClose > pastHigh * 1.01 || recentClose < pastLow * 0.99;
}

function detectVolumeSpike(volumes: number[][]): boolean {
  if (volumes.length < 20) return false;
  const recent = volumes.at(-1)![1];
  const avg = volumes.slice(-20, -1).reduce((sum, [, v]) => sum + v, 0) / 19;
  return recent > avg * 1.5;
}

function calculateTrendDuration(prices: number[][]): number {
  let duration = 0;
  for (let i = prices.length - 2; i >= 0; i--) {
    if (prices[i][1] < prices[i + 1][1]) duration++;
    else break;
  }
  return duration;
}

function calculateRangeState(
  prices: number[][]
): "expanding" | "contracting" | "stable" {
  const ranges = prices
    .slice(-30)
    .map((_, i, arr) => {
      if (i < 5 || i + 5 >= arr.length) return null;
      const window = arr.slice(i - 5, i + 5).map(([, p]) => p);
      const range = Math.max(...window) - Math.min(...window);
      return range;
    })
    .filter((r): r is number => r !== null);

  const firstHalf = ranges.slice(0, Math.floor(ranges.length / 2));
  const secondHalf = ranges.slice(Math.floor(ranges.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (avgSecond > avgFirst * 1.2) return "expanding";
  if (avgSecond < avgFirst * 0.8) return "contracting";
  return "stable";
}


// === MAIN EXPORT ===
export function calculateIndicators(
  prices: number[][],
  volumes?: number[][],
  currentVolume?: number
): IndicatorsResult {
  if (prices.length < 30) {
    return {
      rsi: null,
      stochRsi: null,
      macd: null,
      sma: null,
      fibLevels: null,
      trendBias: null,
      rangePosition: null,
      volumeSupport: undefined,
      volatility: null,
      stochRsiFlip: null,
      confidence: "low",
      candlePattern: null,
      vwap: null,
      momentum: null,
      isBreakout: false,
      isVolumeSpike: false,
      trendDuration: 0,
      rangeState: "stable",
    };
  }


  const rsi = calculateRSI(prices);
  const stochRsiResult = calculateStochRSI(prices);
  const macd = calculateMACD(prices);
  const sma20 = calculateSMA(prices, 20) ?? 0;
  const sma50 = calculateSMA(prices, 50) ?? 0;
  const sma200 = calculateSMA(prices, 200) ?? 0;
  const price = prices.at(-1)?.[1] ?? 0;
  const aboveSma20 = price > sma20;
  const aboveSma50 = price > sma50;
  const aboveSma200 = price > sma200;

  const volatility = calculateVolatility(prices);
  const fibLevels = calculateFibLevels(prices);
  const trendBias = calculateTrendBias(sma50, sma200);
  const rangePosition = calculateRangePosition(prices);

  const vwap = volumes ? calculateVWAP(prices, volumes) : null;
  const momentum = calculateMomentum(prices);
  const isBreakout = detectBreakout(prices);
  const isVolumeSpike = volumes ? detectVolumeSpike(volumes) : false;
  const trendDuration = calculateTrendDuration(prices);
  const rangeState = calculateRangeState(prices);


  const volumeSupport =
    volumes && currentVolume
      ? isVolumeSupportingMove(currentVolume, volumes)
      : undefined;

  const confidence = getConfidenceScore({
    rsi,
    macd,
    stochRsi: stochRsiResult.value,
    volumeSupport,
    price,
    sma20,
  });

  const stochRsiFlip = getStochRsiFlip(stochRsiResult.history);
  const candlePattern = detectCandlePattern(prices);

  return {
    rsi,
    stochRsi: stochRsiResult.value,
    macd,
    sma: {
      sma20,
      sma50,
      sma200,
      aboveSma20,
      aboveSma50,
      aboveSma200,
    },
    fibLevels,
    trendBias,
    rangePosition,
    volumeSupport,
    volatility,
    stochRsiFlip,
    confidence,
    candlePattern,
    vwap,
    momentum,
    isBreakout,
    isVolumeSpike,
    trendDuration,
    rangeState,
  };

}
