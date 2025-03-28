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
    aboveSma: boolean;
  } | null;
  volumeSupport?: boolean;
  volatility: number | null;
  stochRsiFlip: "bullish" | "bearish" | null;
  confidence: "low" | "medium" | "high";
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

function calculateRSI(prices: number[][]): number {
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

  const latest = rsiSeries[rsiSeries.length - 1];
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

// === MAIN EXPORT ===
export function calculateIndicators(
  prices: number[][],
  volumes?: number[][],
  currentVolume?: number,
): IndicatorsResult {
  if (prices.length < 30) {
    return {
      rsi: null,
      stochRsi: null,
      macd: null,
      sma: null,
      volumeSupport: undefined,
      volatility: null,
      stochRsiFlip: null,
      confidence: "low",
    };
  }

  const rsi = calculateRSI(prices);
  const stochRsiResult = calculateStochRSI(prices);
  const macd = calculateMACD(prices);
  const sma20 = calculateSMA(prices, 20);
  const price = prices.at(-1)?.[1] ?? 0;
  const aboveSma = sma20 !== null ? price > sma20 : false;
  const volatility = calculateVolatility(prices);

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
    sma20: sma20 ?? 0,
  });

  const stochRsiFlip = getStochRsiFlip(stochRsiResult.history);

  return {
    rsi,
    stochRsi: stochRsiResult.value,
    macd,
    sma: sma20 !== null ? { sma20, aboveSma } : null,
    volumeSupport,
    volatility,
    stochRsiFlip,
    confidence,
  };
}
