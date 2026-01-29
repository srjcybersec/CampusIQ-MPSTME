import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/google-calendar/client";

// Note: For production, store tokens securely (encrypted in database)
// For now, we'll return tokens to client to store in Firestore client-side

/**
 * GET /api/auth/google/callback
 * Handles OAuth2 callback and stores tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state"); // Can contain user ID

    // Get the origin from headers (works for both localhost and production)
    const origin = request.headers.get("origin") || 
                   request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
                   request.nextUrl.origin ||
                   (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");

    const baseUrl = origin.replace(/\/$/, ""); // Remove trailing slash

    if (error) {
      const redirectUrl = `${baseUrl}/schedule?error=${encodeURIComponent(error)}`;
      console.log("Redirecting to:", redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code) {
      const redirectUrl = `${baseUrl}/schedule?error=no_code`;
      console.log("Redirecting to:", redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Extract user ID from state
    const userId = state || "default-user";

    // Store tokens temporarily in URL params (client will store in Firestore)
    // In production, use encrypted storage or Firebase Admin SDK
    const params = new URLSearchParams({
      connected: "true",
      userId: userId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiryDate: tokens.expiry_date?.toString() || "",
    });

    // Redirect back to schedule page
    const redirectUrl = `${baseUrl}/schedule?${params.toString()}`;
    console.log("Redirecting to:", redirectUrl);
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Error in OAuth callback:", error);
    const origin = request.headers.get("origin") || 
                   request.headers.get("referer")?.split("/").slice(0, 3).join("/") ||
                   request.nextUrl.origin ||
                   (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    const baseUrl = origin.replace(/\/$/, "");
    const redirectUrl = `${baseUrl}/schedule?error=${encodeURIComponent(error.message)}`;
    console.log("Error redirecting to:", redirectUrl);
    return NextResponse.redirect(redirectUrl);
  }
}
