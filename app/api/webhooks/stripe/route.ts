import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connect } from "@/db";
import User from "@/models/user.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: { bodyParser: false },
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

        const customerId =
          typeof fullSession.customer === "string"
            ? fullSession.customer
            : fullSession.customer?.id;

        const metadata = session.metadata as { userId: string } | null;
        const priceId = fullSession.line_items?.data?.[0]?.price?.id;

        if (!customerId || !metadata?.userId || !priceId) {
          return NextResponse.json(
            { error: "Missing required data from session" },
            { status: 400 }
          );
        }

        let tier: "basic" | "premium" | "free" = "free";
        let credits = 20;
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
          tier = "basic";
          credits = 1250;
        } else if (
          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
        ) {
          tier = "premium";
          credits = 2000;
        } else {
          return NextResponse.json(
            { error: "Unknown Price ID" },
            { status: 400 }
          );
        }

        const updatedUser = await User.findOneAndUpdate(
          { clerkId: metadata.userId },
          { subscriptionTier: tier, customerId, credits },
          { new: true }
        );

        if (!updatedUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 400 }
          );
        }

        console.log(
          `✅ User ${updatedUser.email} upgraded to ${tier} with ${credits} credits`
        );
        break;
      }

      case "invoice.payment_succeeded": {
        console.log("🔥 Processing invoice.payment_succeeded");

        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const customerId = invoice.customer as string;

        if (!priceId) {
          return NextResponse.json(
            { error: "Missing Price ID" },
            { status: 400 }
          );
        }

        let tier: "basic" | "premium" | "free" = "free";
        let credits = 20;
        if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
          tier = "basic";
          credits = 1250;
        } else if (
          priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
        ) {
          tier = "premium";
          credits = 2000;
        } else {
          return NextResponse.json(
            { error: "Unknown Price ID" },
            { status: 400 }
          );
        }

        const updatedUser = await User.findOneAndUpdate(
          { customerId },
          { subscriptionTier: tier, credits },
          { new: true }
        );

        if (!updatedUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 400 }
          );
        }

        console.log(
          `✅ User ${updatedUser.email} renewed ${tier} with ${credits} credits`
        );
        break;
      }

      case "customer.subscription.deleted": {
        console.log("🔥 Processing customer.subscription.deleted");

        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const updatedUser = await User.findOneAndUpdate(
          { customerId },
          { subscriptionTier: "free", credits: 20 },
          { new: true }
        );

        if (!updatedUser) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 400 }
          );
        }

        console.log(
          `✅ User ${updatedUser.email} downgraded to free tier with 20 credits`
        );
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`⚠️ Payment failed for invoice ${invoice.id}`);
        // Optional: log, notify user, etc.
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
