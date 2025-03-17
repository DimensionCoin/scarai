import { NextResponse } from "next/server";
import Article from "@/models/article.model";
import { connect } from "@/db";

export async function GET(request: Request) {
  try {
    console.log("📡 Received request:", request.url);

    // Connect to MongoDB
    await connect();

    const url = new URL(request.url);
    // If the query parameter "latest" is set to "true", then fetch the latest article
    const isLatest = url.searchParams.get("latest") === "true";

    if (isLatest) {
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

    // Otherwise, fetch all articles
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
