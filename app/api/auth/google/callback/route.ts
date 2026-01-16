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

    if (error) {
      return NextResponse.redirect(
        new URL(`/schedule?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/schedule?error=no_code", request.url)
      );
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
    return NextResponse.redirect(
      new URL(`/schedule?${params.toString()}`, request.url)
    );
  } catch (error: any) {
    console.error("Error in OAuth callback:", error);
    return NextResponse.redirect(
      new URL(`/schedule?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
