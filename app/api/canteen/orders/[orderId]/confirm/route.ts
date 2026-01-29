import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Verify order belongs to user
    const adminDb = await getAdminDb();
    const orderDoc = await adminDb.collection("canteenOrders").doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();
    if (orderData?.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update order status to completed
    await adminDb.collection("canteenOrders").doc(orderId).update({
      status: "completed",
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });

    // Fetch updated order
    const updatedOrderDoc = await adminDb.collection("canteenOrders").doc(orderId).get();

    return NextResponse.json(
      { id: updatedOrderDoc.id, ...updatedOrderDoc.data() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error confirming order:", error);
    return NextResponse.json(
      { error: "Failed to confirm order" },
      { status: 500 }
    );
  }
}
