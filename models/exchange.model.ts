// models/exchange.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// Define TypeScript interface for exchange
export interface IExchange extends Document {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  description: string;
  url: string;
  image?: string;
  has_trading_incentive: boolean | null;
  trust_score: number | null;
  trust_score_rank: number | null;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define Mongoose Schema
const ExchangeSchema: Schema<IExchange> = new Schema(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    year_established: { type: Number, default: null },
    country: { type: String, default: null },
    description: { type: String, default: "" },
    url: { type: String, required: true },
    image: { type: String, required: false }, // Optional
    has_trading_incentive: { type: Boolean, default: null },
    trust_score: { type: Number, default: null }, // Optional per previous fix
    trust_score_rank: { type: Number, default: null }, // Optional
    trade_volume_24h_btc: { type: Number, default: 0 }, // Default to 0
    trade_volume_24h_btc_normalized: { type: Number, default: 0 }, // Default to 0
  },
  { timestamps: true } // Auto-adds `createdAt` and `updatedAt`
);

// Export the model (Singleton pattern to prevent duplicate model issues)
const Exchange: Model<IExchange> =
  mongoose.models.Exchange ||
  mongoose.model<IExchange>("Exchange", ExchangeSchema);

export default Exchange;
