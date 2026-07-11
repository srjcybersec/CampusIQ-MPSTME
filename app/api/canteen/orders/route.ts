import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestUserId = searchParams.get("userId");

    // Verify authentication and get userId
    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, requestUserId);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.READ, userId);
    if (rateLimitResponse) return rateLimitResponse;

    // Fetch user's orders
    // Note: We fetch without orderBy to avoid composite index requirement, then sort client-side
    const adminDb = await getAdminDb();
    const ordersSnapshot = await adminDb
      .collection("canteenOrders")
      .where("userId", "==", userId)
      .get();

    const orders = ordersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || null,
      };
    }) as Array<{
      id: string;
      createdAt?: string | null;
      [key: string]: any;
    }>;

    // Sort by creation date (newest first) - client-side
    orders.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime; // Descending order (newest first)
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error.message },
      { status: 500 }
    );
  }
}
