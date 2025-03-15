import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { createUser } from "@/actions/user.actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET to .env.local");
  }

  try {
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error: Missing Svix headers", { status: 400 });
    }

    const body = await req.text();
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Invalid webhook signature", { status: 400 });
    }

    const id = evt.data.id as string;
    const eventType = evt.type;

    if (eventType === "user.created") {
      const { email_addresses, first_name, last_name, created_at } = evt.data;

      const email = email_addresses?.[0]?.email_address || null;
      if (!email) {
        return NextResponse.json(
          { error: "No email provided" },
          { status: 400 }
        );
      }

      const user = {
        clerkId: id,
        email,
        firstName: first_name || "",
        lastName: last_name || "",
        createdAt: new Date(created_at),
        subscriptionTier: "free",
        customerId: "",
        credits: 20,
      };

      console.log("User data before saving:", user);

      const newUser = await createUser(user);
      console.log("New user in DB:", newUser);

      if (newUser) {
        const clerk = await clerkClient();
        await clerk.users.updateUser(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        });
      }

      return NextResponse.json({ message: "New user created", user: newUser });
    }

    console.log(`Webhook received: ${id} - ${eventType}`);
    return new Response("", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
