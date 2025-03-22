export async function fetchPythPrices(priceIds: string[]) {
  const url = new URL("https://hermes.pyth.network/v2/updates/price/latest");
  priceIds.forEach((id) => url.searchParams.append("ids[]", id));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch Pyth prices");

  const json = await res.json();
  return json.parsed as {
    id: string;
    price: { price: string; expo: number };
  }[];
}
