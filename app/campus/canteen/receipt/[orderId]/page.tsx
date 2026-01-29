"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainNav } from "@/components/navigation/main-nav";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { Download, ArrowLeft, Printer, Receipt } from "lucide-react";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

function ReceiptPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.orderId as string;
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/canteen/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrderData(data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const downloadReceipt = () => {
    if (!orderData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("CampusIQ Canteen", pageWidth / 2, yPos, { align: "center" });
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Receipt", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Order Details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order ID: ${orderId.substring(0, 8)}`, margin, yPos);
    yPos += 7;

    const orderDate = orderData.createdAt
      ? new Date(orderData.createdAt).toLocaleString("en-IN")
      : new Date().toLocaleString("en-IN");
    doc.text(`Date: ${orderDate}`, margin, yPos);
    yPos += 7;

    doc.text(`Customer: ${user?.email || "Guest"}`, margin, yPos);
    yPos += 10;

    // Items
    doc.setFontSize(12);
    doc.text("Items:", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    orderData.items?.forEach((item: any) => {
      const itemText = `${item.name} x${item.quantity}`;
      const priceText = `₹${(item.price * item.quantity).toFixed(2)}`;
      doc.text(itemText, margin, yPos);
      doc.text(priceText, pageWidth - margin, yPos, { align: "right" });
      yPos += 7;
    });

    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;

    // Total
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ₹${orderData.total?.toFixed(2)}`, margin, yPos);
    doc.text(`₹${orderData.total?.toFixed(2)}`, pageWidth - margin, yPos, { align: "right" });
    yPos += 10;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your order!", pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
    doc.text("CampusIQ - MPSTME", pageWidth / 2, yPos, { align: "center" });

    doc.save(`receipt-${orderId.substring(0, 8)}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
          <div className="max-w-2xl mx-auto">
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <p className="text-white">Loading receipt...</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <MainNav />
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-20">
          <div className="max-w-2xl mx-auto">
            <Card variant="glass">
              <CardContent className="p-12 text-center">
                <p className="text-white mb-4">Order not found</p>
                <Button onClick={() => router.push("/campus")} variant="neon">
                  Back to Menu
                </Button>
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
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-4">
              <Button
                onClick={() => router.push("/campus/canteen/orders")}
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              <Button
                onClick={() => router.push("/campus/canteen/orders")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                All Orders
              </Button>
            </div>

            <Card variant="glass" className="print:bg-white print:text-black">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white print:text-black text-2xl">
                      CampusIQ Canteen
                    </CardTitle>
                    <p className="text-[#D4D4D8] print:text-gray-600 mt-1">Receipt</p>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button onClick={downloadReceipt} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={printReceipt} variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#D4D4D8] print:text-gray-600">Order ID</p>
                    <p className="text-white print:text-black font-mono font-semibold">
                      {orderId.substring(0, 8)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#D4D4D8] print:text-gray-600">Date</p>
                    <p className="text-white print:text-black">
                      {orderData.createdAt
                        ? new Date(orderData.createdAt).toLocaleString("en-IN")
                        : "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#D4D4D8] print:text-gray-600">Customer</p>
                    <p className="text-white print:text-black">{user?.email || "Guest"}</p>
                  </div>
                </div>

                <div className="border-t border-[#222222] print:border-gray-300 pt-4">
                  <h3 className="text-white print:text-black font-semibold mb-3">Items</h3>
                  <div className="space-y-2">
                    {orderData.items?.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-[#161616] print:bg-gray-50 rounded"
                      >
                        <div>
                          <p className="text-white print:text-black font-medium">{item.name}</p>
                          <p className="text-sm text-[#D4D4D8] print:text-gray-600">
                            {item.category} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-blue-400 print:text-blue-600 font-semibold">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#222222] print:border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white print:text-black">Total</span>
                    <span className="text-2xl font-bold text-white print:text-black">
                      ₹{orderData.total?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-[#222222] print:border-gray-300">
                  <p className="text-sm text-[#D4D4D8] print:text-gray-600">
                    Thank you for your order!
                  </p>
                  <p className="text-xs text-[#888888] print:text-gray-500 mt-1">
                    CampusIQ - MPSTME
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <ProtectedRoute>
      <ReceiptPageContent />
    </ProtectedRoute>
  );
}
