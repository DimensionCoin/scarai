"use server";

import User from "@/models/user.model";
import { connect } from "@/db";

/**
 * Create a new user in the database.
 */
export async function createUser(user: any) {
  try {
    await connect();
    const userData = {
      ...user,
      credits: user.credits ?? 20,
    };
    const newUser = await User.create(userData);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw new Error("Error creating user");
  }
}

/**
 * Fetch a user by Clerk ID.
 */
export async function getUser(userId: string) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });
    return user ? JSON.parse(JSON.stringify(user)) : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("Error fetching user");
  }
}

/**
 * Deduct credits from a user and optionally log usage.
 */
export async function deductCredits(
  userId: string,
  amount: number = 1,
  log?: {
    type: "coin" | "oracle" | "backtest";
    coin?: string;
    message?: string;
  }
) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });

    if (!user) throw new Error("User not found");
    if (user.credits < amount) throw new Error("Not enough credits");

    user.credits -= amount;
    await user.save();

    if (log) {
      await logCreditUsage({
        userId,
        type: log.type,
        coin: log.coin,
        message: log.message,
        creditsUsed: amount,
      });
    }

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error deducting credits:", error);
    throw new Error("Error deducting credits");
  }
}

/**
 * Add credits to a user.
 */
export async function addCredits(userId: string, amount: number) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });

    if (!user) throw new Error("User not found");

    user.credits += amount;
    await user.save();

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error adding credits:", error);
    throw new Error("Error adding credits");
  }
}

/**
 * Check if the user has enough credits for an API request.
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number = 1
) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });

    if (!user) throw new Error("User not found");

    return user.credits >= requiredCredits;
  } catch (error) {
    console.error("Error checking credits:", error);
    throw new Error("Error checking credits");
  }
}

/**
 * Fetch a user's top 3 selected coins.
 */
export async function getUserTopCoins(userId: string) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });
    if (user && !user.topCoins) {
      user.topCoins = [];
      await user.save();
    }
    return user?.topCoins || [];
  } catch (error) {
    console.error("Error fetching user's top coins:", error);
    throw new Error("Error fetching user's top coins");
  }
}

/**
 * Update a user's top 3 selected coins.
 */
export async function updateUserTopCoins(userId: string, topCoins: string[]) {
  try {
    if (topCoins.length > 3) {
      throw new Error("Only 3 coins can be selected");
    }

    await connect();
    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { topCoins },
      { new: true }
    );

    if (!user) throw new Error("User not found");

    return user.topCoins;
  } catch (error) {
    console.error("Error updating user's top coins:", error);
    throw new Error("Error updating user's top coins");
  }
}

/**
 * Log credit usage in the user's creditHistory array.
 */
export async function logCreditUsage({
  userId,
  type,
  coin,
  message,
  creditsUsed,
}: {
  userId: string;
  type: "coin" | "oracle" | "backtest";
  coin?: string;
  message?: string;
  creditsUsed: number;
}) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    if (!Array.isArray(user.creditHistory)) {
      user.creditHistory = [];
    }

    user.creditHistory.unshift({
      type,
      coin,
      message,
      creditsUsed,
      timestamp: new Date(),
    });

    if (user.creditHistory.length > 50) {
      user.creditHistory = user.creditHistory.slice(0, 50);
    }

    await user.save();
  } catch (error) {
    console.error("Error logging credit usage:", error);
    throw new Error("Failed to log credit usage");
  }
}
