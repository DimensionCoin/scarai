import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/api/webhooks/clerk",
  "/api/updateUser",
  "/api/webhooks/stripe",
  "/api/coin-data",
  "/api/trading-analysis",
  "/api/analyze",
  "/api/chat",
  "/api/jupapi",
  "/api/top-coins",
  "/api/trending",
  "/api/coinlist",
  "/api/fetchjup",
  "/api/articles(.*)",
  "/api/articles",
  "/api/articles/latest",
  "/api/articles/[id]",
  "/api/test-user",
  "/api/trading-prediction",
  "/api/exchange",
  "/api/chat",
  "/api/displaycoins",
  "/api/pythprices",
  "/api/cron/resetFreeCredits",
]);

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 🔍 Check if request is hitting a /coin/[slug] route
  if (pathname.startsWith("/coin/")) {
    const ua = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const vercelId = request.headers.get("x-vercel-id") || "none";

    console.log("🧭 /coin/* page accessed");
    console.log("→ Path:", pathname);
    console.log("→ IP:", ip);
    console.log("→ User-Agent:", ua);
    console.log("→ Vercel ID:", vercelId);
  }

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
