import mongoose, { Schema, Document, Model } from "mongoose";

// Define TypeScript interface for coin list
export interface ICoinList extends Document {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  updatedAt: Date;
}

// Define Mongoose Schema
const CoinListSchema: Schema<ICoinList> = new Schema(
  {
    id: { type: String, unique: true, required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: false }, // Some coins may not have images
  },
  { timestamps: true } // Auto-adds `updatedAt`
);

// Export the model (Singleton pattern to prevent duplicate model issues)
const CoinList: Model<ICoinList> =
  mongoose.models.CoinList ||
  mongoose.model<ICoinList>("CoinList", CoinListSchema);

export default CoinList;
