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
      credits: user.credits ?? 10, // Ensure credits is always set
    };

    console.log("📢 Creating user with data:", userData); // Log user data

    const newUser = await User.create(userData);

    console.log("✅ New user created in DB:", newUser); // Log saved user

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
 * Deduct credits from a user.
 * @param {string} userId - The Clerk ID of the user.
 * @param {number} amount - The number of credits to deduct.
 */
export async function deductCredits(userId: string, amount: number = 1) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < amount) {
      throw new Error("Not enough credits");
    }

    user.credits -= amount;
    await user.save();

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    console.error("Error deducting credits:", error);
    throw new Error("Error deducting credits");
  }
}

/**
 * Add credits to a user.
 * @param {string} userId - The Clerk ID of the user.
 * @param {number} amount - The number of credits to add.
 */
export async function addCredits(userId: string, amount: number) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      throw new Error("User not found");
    }

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
 * @param {string} userId - The Clerk ID of the user.
 * @returns {boolean} - True if the user has credits, false otherwise.
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number = 1
) {
  try {
    await connect();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      throw new Error("User not found");
    }

    return user.credits >= requiredCredits;
  } catch (error) {
    console.error("Error checking credits:", error);
    throw new Error("Error checking credits");
  }
}
