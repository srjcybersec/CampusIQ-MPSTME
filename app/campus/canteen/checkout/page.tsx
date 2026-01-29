"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/hooks/use-cart";
import { useAuth } from "@/lib/auth/context";
import { Minus, Plus, X, CreditCard, ArrowLeft, Receipt } from "lucide-react";
import { motion } from "framer-motion";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function CheckoutPageContent() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [upiId, setUpiId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!upiId.trim()) {
      setError("Please enter your UPI ID");
      return;
    }

    // Validate UPI ID format (basic validation)
    const upiPattern = /^[\w.-]+@[\w]+$/;
    if (!upiPattern.test(upiId.trim())) {
      setError("Please enter a valid UPI ID (e.g., yourname@paytm)");
      return;
    }

    if (!window.Razorpay) {
      setError("Payment gateway is loading. Please wait a moment and try again.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Create order in Firestore
      const orderData = {
        userId: user?.uid,
        items: items,
        total: total,
        upiId: upiId.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const orderResponse = await fetch("/api/canteen/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const { orderId } = await orderResponse.json();

      // Create Razorpay order
      const paymentResponse = await fetch("/api/canteen/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount: total,
          userId: user?.uid,
          items: items,
          upiId: upiId.trim(),
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error("Failed to create payment order");
      }

      const paymentData = await paymentResponse.json();

      // Initialize Razorpay checkout
      const options = {
        key: paymentData.key,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "CampusIQ Canteen",
        description: `Order #${orderId.substring(0, 8)}`,
        order_id: paymentData.razorpayOrderId,
        prefill: {
          contact: user?.phoneNumber || "",
          email: user?.email || "",
          name: user?.displayName || user?.email?.split("@")[0] || "",
        },
        notes: {
          orderId,
          userId: user?.uid,
          upiId: upiId.trim(),
        },
        handler: async function (response: any) {
          // Verify payment on server
          const verifyResponse = await fetch("/api/canteen/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            }),
          });

          if (verifyResponse.ok) {
            clearCart();
            router.push(`/campus/canteen/receipt/${orderId}`);
          } else {
            setError("Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        theme: {
          color: "#7C7CFF",
        },
        method: {
          upi: true,
        },
        prefill_upi: upiId.trim(),
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment initiation failed");
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
          <Card variant="glass" className="max-w-md mx-auto">
            <CardContent className="p-12 text-center">
              <p className="text-white mb-4">Your cart is empty</p>
              <Button onClick={() => router.push("/campus")} variant="neon">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log("Razorpay SDK loaded");
        }}
      />
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => router.push("/campus")}
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <Button
                onClick={() => router.push("/campus/canteen/orders")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                My Orders
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
            <p className="text-[#D4D4D8]">Review your order and proceed to payment</p>
          </motion.div>

          <div className="space-y-6">
            {/* Order Items */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-[#161616] border border-[#222222] rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-sm text-[#D4D4D8]">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, item.quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-white w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.name, item.quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="text-blue-400 font-semibold w-20 text-right">
                        ₹{item.price * item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(item.name)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Payment Section */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Enter Your UPI ID
                  </label>
                  <Input
                    type="text"
                    placeholder="yourname@paytm / yourname@phonepe / yourname@ybl"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      setError("");
                    }}
                    className="bg-[#161616] border-[#222222] text-white placeholder:text-[#888888]"
                  />
                  {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                  )}
                  <p className="text-xs text-[#888888] mt-2">
                    A payment request will be sent to your UPI app
                  </p>
                </div>

                <div className="pt-4 border-t border-[#222222]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[#D4D4D8]">Total Amount</span>
                    <span className="text-2xl font-bold text-white">₹{total.toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing || !upiId.trim()}
                    variant="neon"
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : `Pay ₹${total.toFixed(2)}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}
