import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, items, total, upiId, status } = body;

    if (!userId || !items || !total) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create order document
    const adminDb = await getAdminDb();
    const orderRef = await adminDb.collection("canteenOrders").add({
      userId,
      items,
      total,
      upiId: upiId || null,
      status: status || "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { orderId: orderRef.id, success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
