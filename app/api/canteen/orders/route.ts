import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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
