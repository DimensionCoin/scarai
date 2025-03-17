// app/api/(data)/exchange/route.ts
import { NextResponse } from "next/server";
import { connect } from "@/db";
import ExchangeModel from "@/models/exchange.model";

interface Exchange {
  id: string;
  name: string;
  description: string;
  url: string;
  image?: string;
  trust_score: number | null;
  trust_score_rank: number | null;
  trade_volume_24h_btc: number;
}

export async function GET() {
  try {
    await connect();
    const exchangeDocs = await ExchangeModel.find()
      .sort({ trust_score_rank: 1 })
      .lean();

    const exchanges: Exchange[] = exchangeDocs.map((exchange) => ({
      id: exchange.id,
      name: exchange.name,
      description: exchange.description,
      url: exchange.url,
      image: exchange.image,
      trust_score: exchange.trust_score,
      trust_score_rank: exchange.trust_score_rank,
      trade_volume_24h_btc: exchange.trade_volume_24h_btc,
    }));

    return NextResponse.json({ data: exchanges });
  } catch (error) {
    console.error("❌ Error fetching exchanges:", error);
    return NextResponse.json(
      { error: "Failed to fetch exchanges" },
      { status: 500 }
    );
  }
}
