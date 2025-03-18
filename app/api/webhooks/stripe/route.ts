import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connect } from "@/db";
import User from "@/models/user.model";

// Initialize Stripe with the correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});
// Stripe Webhook Secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "edge",
  streaming: false,
};

export async function POST(req: NextRequest) {
  try {
    await connect();
    console.log("✅ Connected to database");

    const rawBody = Buffer.from(await req.arrayBuffer());
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      console.error("❌ Missing Stripe signature header");
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      console.log(`✅ Received Event: ${event.type}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Stripe Webhook Signature Error:", errorMessage);
      return NextResponse.json(
        { error: `Webhook verification failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        console.log("🔥 Processing checkout.session.completed");

        const session = event.data.object as Stripe.Checkout.Session;
        const fullSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ["line_items.data.price", "customer"],
          }
        );
        console.log("🔍 Full session retrieved:", fullSession.id);

        let customerId: string | null = null;
        if (typeof fullSession.customer === "string") {
          customerId = fullSession.customer;
        } else if (fullSession.customer && "id" in fullSession.customer) {
          customerId = fullSession.customer.id;
        }
        console.log("🔍 Customer ID:", customerId);
        if (!customerId) {
          console.error("❌ Missing customer ID:", fullSession.customer);
          return NextResponse.json(
            { error: "Missing customer ID" },
            { status: 400 }
          );
        }

        const metadata = session.metadata as { userId: string } | null;
        console.log("🔍 Session metadata:", metadata);
        if (!metadata || !metadata.userId) {
          console.error("❌ Missing metadata.userId:", metadata);
          return NextResponse.json(
            { error: "Missing metadata userId" },
            { status: 400 }
          );
        }

        const priceId = fullSession.line_items?.data?.[0]?.price?.id;
        console.log("🔍 Price ID from session:", priceId);
        console.log(
          "🔍 Expected BASIC Price ID:",
          process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
        );
        console.log(
          "🔍 Expected PREMIUM Price ID:",
          process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
        );

        if (!priceId) {
          console.error("❌ Missing Price ID");
          return NextResponse.json(
            { error: "Missing Price ID" },
            { status: 400 }
          );
        }

        let newSubscriptionTier: "free" | "basic" | "premium" = "free";
        let newCredits = 20; // Default for free tier
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
          newSubscriptionTier = "basic";
          newCredits = 1250; // Basic tier gets 1250 credits
        } else if (
          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
        ) {
          newSubscriptionTier = "premium";
          newCredits = 2000; // Premium tier gets 2000 credits
        } else {
          console.error("❌ Unknown Price ID:", priceId);
          return NextResponse.json(
            { error: "Unknown Price ID" },
            { status: 400 }
          );
        }
        console.log("🔍 New subscription tier:", newSubscriptionTier);
        console.log("🔍 New credits value:", newCredits);

        const updatedUser = await User.findOneAndUpdate(
          { clerkId: metadata.userId },
          {
            subscriptionTier: newSubscriptionTier,
            customerId,
            credits: newCredits, // Set credits to the exact value
          },
          { new: true }
        );
        console.log("🔍 Updated user:", JSON.stringify(updatedUser, null, 2));

        if (!updatedUser) {
          console.error("❌ User not found for clerkId:", metadata.userId);
          return NextResponse.json(
            { error: "User not found" },
            { status: 400 }
          );
        }

        console.log(
          `✅ User upgraded to ${newSubscriptionTier} with credits set to ${newCredits}`
        );
        break;
      }

      case "invoice.payment_succeeded": {
        console.log("🔥 Processing invoice.payment_succeeded");

        const invoice = event.data.object as Stripe.Invoice;
        console.log("🔍 Invoice ID:", invoice.id);

        // Ensure this is a subscription renewal (not a one-time payment)
        if (!invoice.subscription) {
          console.log("ℹ️ Not a subscription invoice, skipping");
          break;
        }

        // Retrieve the subscription to get the price ID
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        console.log("🔍 Subscription Price ID:", priceId);

        if (!priceId) {
          console.error("❌ Missing Price ID in subscription");
          return NextResponse.json(
            { error: "Missing Price ID" },
            { status: 400 }
          );
        }

        // Map price ID to tier and credits
        let newSubscriptionTier: "free" | "basic" | "premium" = "free";
        let newCredits = 20;
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
          newSubscriptionTier = "basic";
          newCredits = 1250; // Reset to 2,500 credits for basic
        } else if (
          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
        ) {
          newSubscriptionTier = "premium";
          newCredits = 2000; // Reset to 5,000 credits for premium
        } else {
          console.error("❌ Unknown Price ID:", priceId);
          return NextResponse.json(
            { error: "Unknown Price ID" },
            { status: 400 }
          );
        }
        console.log("🔍 Renewal subscription tier:", newSubscriptionTier);
        console.log("🔍 Renewal credits value:", newCredits);

        // Find the user by customerId (since clerkId isn’t in invoice metadata)
        const updatedUser = await User.findOneAndUpdate(
          { customerId: invoice.customer },
          {
            subscriptionTier: newSubscriptionTier,
            credits: newCredits, // Reset credits to the exact value
          },
          { new: true }
        );
        console.log(
          "🔍 Updated user on renewal:",
          JSON.stringify(updatedUser, null, 2)
        );

        if (!updatedUser) {
          console.error("❌ User not found for customerId:", invoice.customer);
          return NextResponse.json(
            { error: "User not found" },
            { status: 400 }
          );
        }

        console.log(
          `✅ User renewed ${newSubscriptionTier} with credits reset to ${newCredits}`
        );
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Webhook Processing Error:", errorMessage, error);
    return NextResponse.json(
      { error: `Internal Server Error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
