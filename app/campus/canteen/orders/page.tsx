"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { ArrowLeft, Receipt, Clock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Order {
  id: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  total: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  upiId?: string;
}

function OrdersPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.uid) return;

      try {
        const response = await fetch(`/api/canteen/orders?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched orders:", data); // Debug log
          setOrders(Array.isArray(data) ? data : []);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error response:", errorData);
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.uid]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
          <div className="max-w-4xl mx-auto">
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <p className="text-white">Loading orders...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <MainNav />
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <Button
              onClick={() => router.push("/campus")}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Menu
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">Order History</h1>
            <p className="text-[#D4D4D8]">View all your previous orders</p>
          </motion.div>

          {orders.length === 0 ? (
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <Receipt className="w-16 h-16 text-[#888888] mx-auto mb-4" />
                <p className="text-white mb-2">No orders yet</p>
                <p className="text-sm text-[#D4D4D8] mb-6">
                  Start ordering from the canteen menu
                </p>
                <Button onClick={() => router.push("/campus")} variant="neon">
                  Browse Menu
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card variant="glass" className="hover:border-[#333333] transition-colors">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(order.status)}
                            <span className={`font-semibold capitalize ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-[#D4D4D8]">
                            Order ID: <span className="font-mono text-white">{order.id.substring(0, 8)}</span>
                          </p>
                          <p className="text-sm text-[#D4D4D8]">
                            {new Date(order.createdAt).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">₹{order.total.toFixed(2)}</p>
                          {order.status === "completed" && (
                            <Button
                              onClick={() => router.push(`/campus/canteen/receipt/${order.id}`)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              View Receipt
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-[#222222] pt-4">
                        <p className="text-sm text-[#D4D4D8] mb-2">Items:</p>
                        <div className="space-y-1">
                          {order.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-white">
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-blue-400">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}
