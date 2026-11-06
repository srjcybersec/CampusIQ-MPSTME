import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.PAYMENT);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { orderId, userId: requestUserId, upiId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Require a valid Firebase ID token
    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request, requestUserId);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials not configured" },
        { status: 500 }
      );
    }

    // Load the order server-side. The payable amount comes from the stored
    // order total — NEVER from the client — so a user cannot pay less than the
    // order is worth by tampering with the request.
    const adminDb = await getAdminDb();
    const orderSnap = await adminDb.collection("canteenOrders").doc(orderId).get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderSnap.data()!;

    if (order.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status === "completed" || order.paymentVerified === true) {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 });
    }

    const serverAmount = Number(order.total);
    if (!Number.isFinite(serverAmount) || serverAmount <= 0 || serverAmount > 100000) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(serverAmount * 100), // paise
      currency: "INR",
      receipt: orderId.substring(0, 40),
      notes: {
        orderId,
        userId,
        upiId: upiId || "",
      },
    });

    await adminDb.collection("canteenOrders").doc(orderId).update({
      razorpayOrderId: razorpayOrder.id,
      razorpayOrderStatus: "created",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: keyId, // publishable key id only — never the secret
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
