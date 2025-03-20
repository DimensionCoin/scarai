import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    createdAt: { type: Date, required: true, default: Date.now },
    subscriptionTier: {
      type: String,
      enum: ["free", "basic", "premium"],
      default: "free",
    },
    customerId: { type: String, default: "" },
    credits: { type: Number, required: true, default: 20 },
    topCoins: { type: [String], default: [] }, // Store the top 3 coin IDs
  },
  { timestamps: true }
);

const User = models?.User || model("User", UserSchema);

export default User;
