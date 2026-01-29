"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const orderId = searchParams.get("orderId");
  const upiId = searchParams.get("upiId");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "failed">("pending");
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      router.push("/campus");
      return;
    }

    // Check payment status
    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/canteen/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderData(data);
          if (data.status === "completed") {
            setPaymentStatus("success");
          } else if (data.status === "failed") {
            setPaymentStatus("failed");
          } else {
            // Keep checking if still pending
            setTimeout(checkPaymentStatus, 3000);
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    };

    checkPaymentStatus();
  }, [orderId, router]);

  const handleConfirmPayment = async () => {
    if (!orderId) return;

    // Check payment status from Razorpay
    try {
      const response = await fetch(`/api/canteen/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrderData(data);
        
        if (data.status === "completed" || data.paymentVerified) {
          setPaymentStatus("success");
        } else if (data.status === "failed") {
          setPaymentStatus("failed");
        } else {
          // Keep checking
          setTimeout(() => {
            handleConfirmPayment();
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  if (paymentStatus === "pending") {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
          <div className="max-w-md mx-auto">
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
                <p className="text-[#D4D4D8] mb-6">
                  Please complete the payment in your UPI app
                </p>
                <div className="space-y-4">
                  <div className="text-left bg-[#161616] p-4 rounded-lg">
                    <p className="text-sm text-[#D4D4D8] mb-1">Order ID</p>
                    <p className="text-white font-mono">{orderId?.substring(0, 8)}</p>
                  </div>
                  {orderData && (
                    <div className="text-left bg-[#161616] p-4 rounded-lg">
                      <p className="text-sm text-[#D4D4D8] mb-1">Amount</p>
                      <p className="text-white font-semibold">₹{orderData.total?.toFixed(2)}</p>
                    </div>
                  )}
                  <Button
                    onClick={handleConfirmPayment}
                    variant="neon"
                    className="w-full"
                  >
                    I&apos;ve Completed Payment
                  </Button>
                  <Button
                    onClick={() => router.push("/campus")}
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (paymentStatus === "success" && orderData) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card variant="glass">
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                  <p className="text-[#D4D4D8] mb-6">
                    Your order has been confirmed
                  </p>
                  <div className="space-y-4 mb-6">
                    <div className="text-left bg-[#161616] p-4 rounded-lg">
                      <p className="text-sm text-[#D4D4D8] mb-1">Order ID</p>
                      <p className="text-white font-mono">{orderId?.substring(0, 8)}</p>
                    </div>
                    <div className="text-left bg-[#161616] p-4 rounded-lg">
                      <p className="text-sm text-[#D4D4D8] mb-1">Amount Paid</p>
                      <p className="text-white font-semibold">₹{orderData.total?.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => router.push(`/campus/canteen/receipt/${orderId}`)}
                      variant="neon"
                      className="flex-1"
                    >
                      View Receipt
                    </Button>
                    <Button
                      onClick={() => router.push("/campus")}
                      variant="outline"
                      className="flex-1"
                    >
                      Back to Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
        <div className="max-w-md mx-auto">
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Payment Failed</h2>
              <p className="text-[#D4D4D8] mb-6">
                There was an issue processing your payment
              </p>
              <Button
                onClick={() => router.push("/campus")}
                variant="neon"
                className="w-full"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <ProtectedRoute>
      <PaymentPageContent />
    </ProtectedRoute>
  );
}
