import { NextResponse } from "next/server";
import Article from "@/models/article.model"; // Fixed typo from article.model
import {connect} from "@/db"; // Adjusted to match your likely setup

// GET handler to fetch all articles or the latest one
export async function GET(request: Request) {
  try {
    console.log("📡 Received request:", request.url);

    // Connect to MongoDB
    await connect();

    const { pathname } = new URL(request.url);
    console.log("🔍 Pathname:", pathname);

    if (pathname === "/api/articles/latest") {
      console.log("🔎 Fetching latest article...");
      const latestArticle = await Article.findOne().sort({ createdAt: -1 });
      if (!latestArticle) {
        console.log("⚠️ No articles found in database");
        return NextResponse.json(
          { success: false, error: "No articles found" },
          { status: 404 }
        );
      }
      console.log("✅ Found latest article:", latestArticle._id);
      return NextResponse.json(
        { success: true, data: latestArticle },
        { status: 200 }
      );
    }

    // Default: Fetch all articles
    console.log("🔎 Fetching all articles...");
    const articles = await Article.find().sort({ createdAt: -1 });
    console.log("✅ Found articles:", articles.length);
    return NextResponse.json(
      { success: true, data: articles },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Error fetching articles:", errorMessage);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
