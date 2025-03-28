export function detectSupportResistance(
  prices: number[][],
  volumes: number[][]
): {
  supportLevels: number[];
  resistanceLevels: number[];
  weakSupport: number[];
  weakResistance: number[];
} {
  const pricePoints = prices.map(([, price]) => price);
  const volumeMap = new Map<number, { total: number; count: number }>();

  const strongThreshold = 0.02; // 2% similarity for strong clustering

  for (let i = 0; i < prices.length; i++) {
    const price = prices[i][1];
    const volume = volumes[i]?.[1] ?? 0;

    const rounded = parseFloat(price.toFixed(2));
    const existingCluster = [...volumeMap.keys()].find(
      (key) => Math.abs(key - rounded) / key < strongThreshold
    );

    if (existingCluster !== undefined) {
      const data = volumeMap.get(existingCluster)!;
      data.total += volume;
      data.count += 1;
    } else {
      volumeMap.set(rounded, { total: volume, count: 1 });
    }
  }

  // Sort by average volume (high-volume zones = stronger support/resistance)
  const sorted = [...volumeMap.entries()]
    .map(([price, { total, count }]) => ({
      price,
      avgVolume: total / count,
    }))
    .sort((a, b) => b.avgVolume - a.avgVolume);

  const topZones = sorted.slice(0, 12).map((z) => z.price);
  const weakZones = sorted.slice(12, 20).map((z) => z.price);

  const maxPrice = Math.max(...pricePoints);
  const minPrice = Math.min(...pricePoints);
  const midpoint = (maxPrice + minPrice) / 2;

  const supportLevels = topZones
    .filter((p) => p < midpoint)
    .sort((a, b) => b - a)
    .slice(0, 3);

  const resistanceLevels = topZones
    .filter((p) => p > midpoint)
    .sort((a, b) => a - b)
    .slice(0, 3);

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
