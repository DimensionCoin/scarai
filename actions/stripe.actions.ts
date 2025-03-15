"use server";

import { stripe } from "@/lib/stripe";
import User from "@/models/user.model";
import { connect } from "@/db";

type Props = {
  userId: string;
  email: string;
  priceId: string;
};

export const subscribe = async ({ userId, email, priceId }: Props) => {
  if (!userId || !email || !priceId) {
    throw new Error("Missing required params");
  }

  try {
    await connect();

    // 🔹 Retrieve or create a Stripe customer
    const existingCustomer = await stripe.customers.list({ email, limit: 1 });
    let customerId =
      existingCustomer.data.length > 0 ? existingCustomer.data[0]?.id : null;

    if (!customerId) {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }

    // 🔹 Store `customerId` in MongoDB **before creating the session**
    await User.findOneAndUpdate(
      { clerkId: userId },
      { customerId },
      { new: true }
    );

    // 🔹 Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, customerId }, // ✅ Ensure metadata contains userId & customerId
      mode: "subscription",
      billing_address_collection: "required",
      customer_update: { name: "auto", address: "auto" },
      success_url: `${process.env.NEXT_PUBLIC_URL}/payments/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/payments/cancel`,
    });

    return session.url;
  } catch (error) {
    console.error("❌ Stripe Subscription Error:", error);
    throw new Error("Failed to create subscription");
  }
};
