import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-calendar/client";

/**
 * GET /api/auth/google
 * Initiates Google OAuth2 flow
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get("state");
    const authUrl = getAuthUrl(state || undefined);
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating auth URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
