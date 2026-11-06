import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Require a valid token — orders contain personal data (items, UPI id).
    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    const adminDb = await getAdminDb();
    const orderDoc = await adminDb.collection("canteenOrders").doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const data = orderDoc.data()!;

    // Ownership check — prevents reading someone else's order by guessing its id
    if (data.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { id: orderDoc.id, ...data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
