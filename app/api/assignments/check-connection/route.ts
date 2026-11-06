import { NextRequest, NextResponse } from "next/server";
import { getMicrosoftTokens } from "@/lib/firebase/assignments";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

/**
 * GET /api/assignments/check-connection
 * Checks if user has connected Microsoft account
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, searchParams.get("userId"));
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    try {
      const tokens = await getMicrosoftTokens(userId);
      return NextResponse.json({
        connected: !!tokens,
      });
    } catch (tokenError: any) {
      // If permission denied, user just doesn't have tokens - not an error
      if (tokenError.code === 'permission-denied') {
        return NextResponse.json({
          connected: false,
        });
      }
      throw tokenError;
    }
  } catch (error: any) {
    console.error("Error checking connection:", error);
    // Return false instead of error for better UX
    return NextResponse.json({
      connected: false,
    });
  }
}
