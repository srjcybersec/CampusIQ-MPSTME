import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, userId, items, upiId } = body;

    if (!orderId || !amount || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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

    // Initialize Razorpay only when needed (at runtime, not build time)
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: orderId.substring(0, 8),
      notes: {
        orderId,
        userId,
        upiId: upiId || "",
        items: JSON.stringify(items),
        merchantUpiId: "shivanshjindal2005-1@oksbi", // Merchant UPI ID for reference
      },
    });

    // Update order with Razorpay order ID
    const adminDb = await getAdminDb();
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
        key: process.env.RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
