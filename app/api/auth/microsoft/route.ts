import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftAuthUrl } from "@/lib/microsoft-graph/client";

/**
 * GET /api/auth/microsoft
 * Initiates Microsoft OAuth2 flow
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get("state");
    const authUrl = getMicrosoftAuthUrl(state || undefined);
    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating Microsoft auth URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}
