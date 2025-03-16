import mongoose, { Schema, Document, Model } from "mongoose";

// Mongoose-specific interface
export interface ICrypto extends Document {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  image: string;
  createdAt: Date;
  updatedAt: Date;
}

// Plain interface for serialized data
export interface ICryptoPlain {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_7d?: number;
  createdAt: string;
  updatedAt: string;
}

const CryptoSchema: Schema<ICrypto> = new Schema(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    current_price: { type: Number, required: true },
    market_cap: { type: Number, required: true },
    total_volume: { type: Number, required: true },
    price_change_percentage_24h: { type: Number, required: true },
    price_change_percentage_7d: { type: Number, required: false },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const Crypto: Model<ICrypto> =
  mongoose.models.Crypto || mongoose.model<ICrypto>("Crypto", CryptoSchema);

export default Crypto;
