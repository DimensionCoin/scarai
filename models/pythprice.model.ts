import mongoose from "mongoose";

const PythPricesSchema = new mongoose.Schema({
  key: { type: String, default: "latest", unique: true },
  prices: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.PythPrices ||
  mongoose.model("PythPrices", PythPricesSchema);
