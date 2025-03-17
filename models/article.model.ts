import mongoose, { Schema, model, models } from "mongoose";

// Define the Article schema matching the Node.js project
const ArticleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, trim: true },
    influencers: [{ type: String }],
    sourceTweets: [
      {
        tweetId: { type: String },
        username: { type: String },
        timestamp: { type: Date },
      },
    ],
    coinData: [
      {
        name: { type: String },
        symbol: { type: String },
        priceChange24h: { type: Number },
        volume24h: { type: Number },
        marketCap: { type: Number },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false } // We handle createdAt manually, no need for Mongoose timestamps
);

// Prevent model redefinition during hot reload in development
const Article = models.Article || model("Article", ArticleSchema);

export default Article;
