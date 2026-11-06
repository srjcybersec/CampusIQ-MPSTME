import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { getAuthenticatedUserId } from "@/lib/middleware/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/middleware/rate-limit";
import { validateOrderItems, validateAmount } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: requestUserId, items, total, upiId } = body;

    // Validate required fields
    if (!items || total === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: items and total are required" },
        { status: 400 }
      );
    }

    // Validate order items
    const itemsValidation = validateOrderItems(items);
    if (!itemsValidation.valid) {
      return NextResponse.json(
        { error: itemsValidation.error },
        { status: 400 }
      );
    }

    // Validate amount
    const amountValidation = validateAmount(total);
    if (!amountValidation.valid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      );
    }

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
    const rateLimitResponse = applyRateLimit(request, RATE_LIMITS.DEFAULT, userId);
    if (rateLimitResponse) return rateLimitResponse;

    // Recompute the total server-side from the line items so a tampered
    // client total (e.g. 0 for expensive items) can't be trusted.
    const computedTotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + Number(item.price) * Number(item.quantity),
      0
    );
    const roundedTotal = Math.round(computedTotal * 100) / 100;

    if (Math.abs(roundedTotal - Number(total)) > 0.01) {
      return NextResponse.json(
        { error: "Order total does not match items" },
        { status: 400 }
      );
    }

    // Orders are always created server-side as unpaid. Clients cannot set
    // status/paymentVerified — those are only set after signature verification.
    const adminDb = await getAdminDb();
    const orderRef = await adminDb.collection("canteenOrders").add({
      userId,
      items,
      total: roundedTotal,
      upiId: upiId || null,
      status: "pending",
      paymentVerified: false,
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
