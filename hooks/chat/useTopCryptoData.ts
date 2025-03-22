// /hooks/chat/useTopCryptoData.ts
import { ICryptoPlain } from "@/models/crypto.model";

export async function useTopCryptoData(): Promise<ICryptoPlain[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/top-coins`);
  if (!res.ok) throw new Error("Failed to fetch top coins");
  const json = await res.json();
  return json.data as ICryptoPlain[];
}
