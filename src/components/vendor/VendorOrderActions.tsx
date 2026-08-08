"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Check, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface VendorOrderActionsProps {
  orderId: string;
  status: string;
  buyerId: string;
  onStatusChange?: (newStatus: string) => void;
}

export function VendorOrderActions({ orderId, status: initialStatus, buyerId, onStatusChange }: VendorOrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(initialStatus);

  const executeAction = async (url: string, newStatus: string, body?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to update order status");
      setCurrentStatus(newStatus);
      if (onStatusChange) onStatusChange(newStatus);
      toast.success("Order updated successfully!");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Action failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = () => executeAction(`/api/vendor/orders/${orderId}/confirm`, "confirmed");

  const markPreparing = () => executeAction(
    `/api/vendor/orders/${orderId}/ship`, "preparing", { status: "preparing" }
  );

  const shipOrder = () => {
    executeAction(`/api/vendor/orders/${orderId}/ship`, "out_for_delivery", {
      status: "out_for_delivery"
    });
  };

  const markDelivered = () => {
    executeAction(`/api/vendor/orders/${orderId}/deliver`, "delivered");
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {currentStatus === "pending" && (
          <Button onClick={confirmOrder} disabled={loading}
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            <Check className="mr-2 h-4 w-4" />
            {loading ? "Confirming..." : "Confirm Order"}
          </Button>
        )}
        {currentStatus === "confirmed" && (
          <Button onClick={markPreparing} disabled={loading}
            className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700">
            <Truck className="mr-2 h-4 w-4" />
            {loading ? "Updating..." : "Mark as Preparing"}
          </Button>
        )}
        {currentStatus === "preparing" && (
          <Button onClick={shipOrder} disabled={loading}
            className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">
            <Truck className="mr-2 h-4 w-4" />
            {loading ? "Updating..." : "Out for Delivery"}
          </Button>
        )}
        {currentStatus === "out_for_delivery" && (
          <Button onClick={markDelivered} disabled={loading}
            className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {loading ? "Marking..." : "Mark as Delivered"}
          </Button>
        )}
        <Button
          onClick={() => router.push(`/messages?with=${buyerId}`)}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <MessageCircle className="mr-2 h-4 w-4" /> Message Buyer
        </Button>
      </div>
      {currentStatus === "delivered" && (
        <p className="text-sm text-emerald-600 font-medium">✓ Order completed</p>
      )}
      {currentStatus === "cancelled" && (
        <p className="text-sm text-rose-600 font-medium">✗ Order cancelled</p>
      )}
    </div>
  );
}
