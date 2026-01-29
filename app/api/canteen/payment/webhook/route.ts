import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const { event: eventType, payload } = event;

    // Handle payment success event
    if (eventType === "payment.captured" || eventType === "payment.authorized") {
      const payment = payload.payment?.entity || payload.payment;
      const orderId = payment.notes?.orderId;

      if (orderId) {
        const adminDb = await getAdminDb();
        const orderDoc = await adminDb.collection("canteenOrders").doc(orderId).get();

        if (orderDoc.exists) {
          await adminDb.collection("canteenOrders").doc(orderId).update({
            status: "completed",
            razorpayPaymentId: payment.id,
            paymentVerified: true,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Handle payment failure event
    if (eventType === "payment.failed") {
      const payment = payload.payment?.entity || payload.payment;
      const orderId = payment.notes?.orderId;

      if (orderId) {
        const adminDb = await getAdminDb();
        await adminDb.collection("canteenOrders").doc(orderId).update({
          status: "failed",
          razorpayPaymentId: payment.id,
          paymentFailedReason: payment.error_description || "Payment failed",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
