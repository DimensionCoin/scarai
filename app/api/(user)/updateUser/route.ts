import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/db";
import User from "@/models/user.model";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    await connect();
    const {
      clerkId,
      firstName,
      lastName,
      email,
      subscriptionTier,
      newPassword,
    }: {
      clerkId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      subscriptionTier?: string;
      newPassword?: string;
    } = await req.json();

    if (!clerkId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    console.log(`Updating user with Clerk ID: ${clerkId}`);

    // Update MongoDB User
    const updateFields: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      subscriptionTier: string;
    }> = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (email) updateFields.email = email;
    if (subscriptionTier) updateFields.subscriptionTier = subscriptionTier;

    const updatedUser = await User.findOneAndUpdate({ clerkId }, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update Clerk user name if provided.
    if (firstName || lastName) {
      const clerk = await clerkClient(); // Await the clerk client first.
      await clerk.users.updateUser(clerkId, { firstName, lastName });
      console.log(`Clerk user updated with name for ${clerkId}`);
    }

    // Update password in Clerk if provided.
    if (newPassword) {
      console.log(`Attempting to update password for user: ${clerkId}`);
      const passwordResponse = await fetch(
        `https://api.clerk.dev/v1/users/${clerkId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
          body: JSON.stringify({ password: newPassword }),
        }
      );
      if (!passwordResponse.ok) {
        let errorData: { errors?: { long_message: string }[] } | null = null;
        try {
          errorData = await passwordResponse.json();
        } catch {
          console.error("Clerk password update failed: Empty response");
        }
        console.error(
          "Clerk password update failed:",
          errorData || passwordResponse.statusText
        );
        return NextResponse.json(
          {
            error:
              errorData?.errors?.[0]?.long_message ||
              "Failed to update password",
          },
          { status: passwordResponse.status }
        );
      }
      console.log(`Password updated successfully for user: ${clerkId}`);
    }

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
