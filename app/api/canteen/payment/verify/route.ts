import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.PAYMENT);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(
        { error: "Missing payment verification data" },
        { status: 400 }
      );
    }

    // Require a valid Firebase ID token
    let userId: string;
    try {
      userId = await getAuthenticatedUserId(request);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Authentication required" },
        { status: 401 }
      );
    }

    // Verify the Razorpay HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const sigBuf = Buffer.from(razorpay_signature);
    const expBuf = Buffer.from(expected);
    const signatureValid =
      sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);

    if (!signatureValid) {
      return NextResponse.json(
        { error: "Invalid payment signature", verified: false },
        { status: 400 }
      );
    }

    const adminDb = await getAdminDb();
    const orderRef = adminDb.collection("canteenOrders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderSnap.data()!;

    // Ownership check — you can only verify your own order
    if (order.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Bind the signed Razorpay order to THIS Firestore order. Without this a
    // valid signature from one (cheap) payment could be replayed to mark a
    // different order as paid.
    if (order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { error: "Payment does not match this order", verified: false },
        { status: 400 }
      );
    }

    // Idempotency — never re-complete an already paid order
    if (order.status === "completed" || order.paymentVerified === true) {
      return NextResponse.json(
        { verified: true, message: "Payment already verified" },
        { status: 200 }
      );
    }

    await orderRef.update({
      status: "completed",
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      paymentVerified: true,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { verified: true, message: "Payment verified successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment", verified: false },
      { status: 500 }
    );
  }
}
