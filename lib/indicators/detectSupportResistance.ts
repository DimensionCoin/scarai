// ./lib/indicators/detectSupportResistance.ts

export function detectSupportResistance(
  prices: number[][],
  volumes: number[][]
): {
  supportLevels: number[];
  resistanceLevels: number[];
  weakSupport?: number[];
  weakResistance?: number[];
} {
  const pricePoints = prices.map(([, price]) => price);
  const volumeMap = new Map<number, { total: number; count: number }>();

  const recentWindow = 7 * 24 * 60 * 60 * 1000; // last 7 days in ms
  const now = prices.at(-1)?.[0] ?? Date.now();
  const recentCutoff = now - recentWindow;

  const strongThreshold = 0.02; // 2% threshold for strong clusters

  for (let i = 0; i < prices.length; i++) {
    const [timestamp, price] = prices[i];
    const volume = volumes[i]?.[1] ?? 0;

    const rounded = parseFloat(price.toFixed(2));
    const bucket = [...volumeMap.keys()].find(
      (key) => Math.abs(key - rounded) / key < strongThreshold
    );

    const recentBias = timestamp >= recentCutoff ? 1.2 : 1;

    if (bucket !== undefined) {
      const existing = volumeMap.get(bucket)!;
      existing.total += volume * recentBias;
      existing.count += 1;
    } else {
      volumeMap.set(rounded, {
        total: volume * recentBias,
        count: 1,
      });
    }
  }

  const sorted = [...volumeMap.entries()]
    .map(([price, { total, count }]) => ({
      price,
      avgVolume: total / count,
    }))
    .sort((a, b) => b.avgVolume - a.avgVolume);

  const maxPrice = Math.max(...pricePoints);
  const minPrice = Math.min(...pricePoints);
  const midpoint = (maxPrice + minPrice) / 2;

  const strongZones = sorted.slice(0, 30).map((z) => z.price); // use more zones
  const weakZones = sorted.slice(30).map((z) => z.price); // remaining as weak

  const supportLevels = strongZones
    .filter((p) => p < midpoint)
    .sort((a, b) => b - a);
  const resistanceLevels = strongZones
    .filter((p) => p > midpoint)
    .sort((a, b) => a - b);

  const weakSupport = weakZones
    .filter((p) => p < midpoint)
    .sort((a, b) => b - a);
  const weakResistance = weakZones
    .filter((p) => p > midpoint)
    .sort((a, b) => a - b);

  return {
    supportLevels,
    resistanceLevels,
    weakSupport,
    weakResistance,
  };
}
