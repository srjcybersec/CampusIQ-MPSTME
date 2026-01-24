import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/microsoft-graph/client";

/**
 * GET /api/auth/microsoft/callback
 * Handles Microsoft OAuth2 callback and stores tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state"); // Can contain user ID

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/resources/assignments?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/resources/assignments?error=no_code", request.url)
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
      expiresAt: tokens.expires_at.toString(),
    });

    // Redirect back to assignments page
    return NextResponse.redirect(
      new URL(`/resources/assignments?${params.toString()}`, request.url)
    );
  } catch (error: any) {
    console.error("Error in Microsoft OAuth callback:", error);
    return NextResponse.redirect(
      new URL(
        `/resources/assignments?error=${encodeURIComponent(error.message)}`,
        request.url
      )
    );
  }
}
