// /hooks/chat/detectSupportResistance.ts

/**
 * Detects significant support and resistance levels from high-resolution price data.
 * Resistance = local peak with volume spike (potential sell zone)
 * Support = local low with volume spike (potential buy zone)
 */

export interface Level {
  price: number;
  timestamp: number;
}

export interface SupportResistanceResult {
  resistanceLevels: number[];
  supportLevels: number[];
}

export function detectSupportResistance(
  prices: number[][],
  volumes: number[][],
  lookback: number = 12,
  volumeMultiplier: number = 1.5
): SupportResistanceResult {
  const resistanceLevels: Level[] = [];
  const supportLevels: Level[] = [];

  const avgVolume = volumes.reduce((sum, [, v]) => sum + v, 0) / volumes.length;

  for (let i = lookback; i < prices.length - lookback; i++) {
    const [timestamp, price] = prices[i];
    const window = prices
      .slice(i - lookback, i + lookback + 1)
      .map(([, p]) => p);
    const [_, volume] = volumes.find(([t]) => t === timestamp) || [
      timestamp,
      0,
    ];

    const isLocalMax = price === Math.max(...window);
    const isLocalMin = price === Math.min(...window);
    const hasVolumeSpike = volume > avgVolume * volumeMultiplier;

    if (isLocalMax && hasVolumeSpike) {
      resistanceLevels.push({ price, timestamp });
    }
    if (isLocalMin && hasVolumeSpike) {
      supportLevels.push({ price, timestamp });
    }
  }

  // Deduplicate levels within ~2% range
  const dedupe = (levels: Level[]) => {
    const sorted = levels.sort((a, b) => b.price - a.price);
    const unique: number[] = [];
    for (const level of sorted) {
      if (!unique.some((p) => Math.abs(p - level.price) / p < 0.02)) {
        unique.push(level.price);
      }
    }
    return unique;
  };

  return {
    resistanceLevels: dedupe(resistanceLevels),
    supportLevels: dedupe(supportLevels),
  };
}
