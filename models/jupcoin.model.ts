import mongoose, { Schema, Document, Model } from "mongoose";

// Define TypeScript interface for JupCoin
export interface IJupCoin extends Document {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags: string[];
  daily_volume?: number;
  created_at: Date;
  freeze_authority?: string | null;
  mint_authority?: string | null;
  permanent_delegate?: string | null;
  minted_at?: Date;
  extensions?: {
    coingeckoId?: string;
  };
}

// Define Mongoose Schema
const JupCoinSchema: Schema<IJupCoin> = new Schema(
  {
    address: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true },
    logoURI: { type: String },
    tags: [{ type: String }],
    daily_volume: { type: Number },
    created_at: { type: Date, required: true },
    freeze_authority: { type: String, default: null },
    mint_authority: { type: String, default: null },
    permanent_delegate: { type: String, default: null },
    minted_at: { type: Date },
    extensions: {
      coingeckoId: { type: String },
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

// Export the model (Singleton pattern to prevent duplicate model issues)
const JupCoin: Model<IJupCoin> =
  mongoose.models.JupCoin || mongoose.model<IJupCoin>("JupCoin", JupCoinSchema);

export default JupCoin;
