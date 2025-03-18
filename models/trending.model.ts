import mongoose, { Schema, Document } from "mongoose";

export interface ITrending extends Document {
  coin_id: string;
  name: string;
  symbol: string;
  slug: string;
  market_cap_rank: number;
  score: number;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    price: number;
    price_btc: string;
    market_cap: string;
    total_volume: string;
    sparkline: string;
    price_change_percentage_24h: number;
  };
  content: {
    title?: string | null;
    description?: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TrendingSchema = new Schema<ITrending>(
  {
    coin_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    slug: { type: String, required: true },
    market_cap_rank: { type: Number, required: true },
    score: { type: Number, required: true },
    image: {
      thumb: { type: String, required: true },
      small: { type: String, required: true },
      large: { type: String, required: true },
    },
    market_data: {
      price: { type: Number, required: true },
      price_btc: { type: String, required: true },
      market_cap: { type: String, required: true },
      total_volume: { type: String, required: true },
      sparkline: { type: String, required: true },
      price_change_percentage_24h: { type: Number, required: true },
    },
    content: {
      title: { type: String, default: null },
      description: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Trending ||
  mongoose.model<ITrending>("Trending", TrendingSchema);
