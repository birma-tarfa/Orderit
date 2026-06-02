"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface VendorOrderRow {
  id: string;
  buyer_id: string;
  buyer_name: string;
  items_count: number;
  total: number;
  status: string;
  created_at: string;
}

const tabs = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const statusFilterMap: Record<string, string[] | null> = {
  all: null,
  pending: ["pending"],
  confirmed: ["confirmed"],
  preparing: ["preparing"],
  out_for_delivery: ["out_for_delivery"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

const getStatusLabel = (status: string) => {
  if (status === "shipped" || status === "out_for_delivery") return "Out for Delivery";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function VendorOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<VendorOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord || userRecord.role !== "vendor") {
      router.push("/marketplace");
      return;
    }

    // Fetch vendor profile id for this user
    const { data: vp, error: vpError } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (vpError || !vp) {
      router.push("/marketplace");
      return;
    }

    const vendorId = vp.id;

    const { data, error: ordersError } = await supabase
      .from("orders")
      .select("id,buyer_id,total,status,created_at")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      setError(ordersError.message);
      setLoading(false);
      return;
    }

    const orderList = data || [];
    const orderIds = orderList.map((o: any) => o.id);
    const buyerIds = Array.from(new Set(orderList.map((o: any) => o.buyer_id).filter(Boolean)));

    const { data: buyers } = buyerIds.length
      ? await supabase.from("users").select("id,full_name").in("id", buyerIds)
      : { data: [] };

    const { data: items } = orderIds.length
      ? await supabase.from("order_items").select("order_id").in("order_id", orderIds)
      : { data: [] };

    const itemsCountByOrder: Record<string, number> = (items || []).reduce((acc: any, it: any) => {
      acc[it.order_id] = (acc[it.order_id] || 0) + 1;
      return acc;
    }, {});

    const buyersById: Record<string, any> = (buyers || []).reduce((acc: any, b: any) => {
      acc[b.id] = b;
      return acc;
    }, {});

    setOrders(
      orderList.map((order: any) => ({
        id: order.id,
        buyer_id: order.buyer_id,
        buyer_name: buyersById[order.buyer_id]?.full_name || "Unknown buyer",
        items_count: itemsCountByOrder[order.id] || 0,
        total: Number(order.total || 0),
        status: order.status,
        created_at: order.created_at,
      }))
    );

    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [router]);

  const performOrderAction = async (orderId: string, action: "confirm" | "ship" | "deliver" | "cancel") => {
    try {
      setLoading(true);
      const options: any = { method: "POST", credentials: "same-origin" };
      if (action === "ship") {
        // default to preparing from list view
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify({ status: "preparing" });
      }

      const resp = await fetch(`/api/vendor/orders/${orderId}/${action}`, options);

      if (!resp.ok) {
        const payload = await resp.json().catch(() => ({}));
        setError(payload.error || `Failed to ${action} order`);
      } else {
        await loadOrders();
      }
    } catch (err) {
      setError((err as Error).message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const filter = statusFilterMap[activeTab];

    if (!filter) {
      return orders;
    }

    return orders.filter((order) => filter.includes(order.status));
  }, [activeTab, orders]);

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent border-[#1a7a4a]" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Vendor Orders</h1>
          <p className="mt-2 text-sm text-slate-600">Review all orders and update status as they progress.</p>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-[#1a7a4a] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600">
          <p className="text-xl font-semibold text-slate-900">No orders here yet.</p>
          <p className="mt-2">
            {activeTab === "preparing"
              ? "Preparing orders are not available in this workflow yet."
              : "No orders match this stage."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-4">Order ID</th>
                <th className="px-4 py-4">Buyer</th>
                <th className="px-4 py-4">Items</th>
                <th className="px-4 py-4">Total ₦</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-900">{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-4 text-slate-900">{order.buyer_name}</td>
                  <td className="px-4 py-4 text-slate-900">{order.items_count}</td>
                  <td className="px-4 py-4 text-slate-900">₦{order.total.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColors[order.status] ?? "bg-slate-100 text-slate-800"}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/vendor/orders/${order.id}`)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      View
                    </button>
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => performOrderAction(order.id, "confirm")}
                        className="rounded-full bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Confirm
                      </button>
                    )}
                    {order.status === "confirmed" && (
                      <button
                        type="button"
                        onClick={() => performOrderAction(order.id, "ship")}
                        className="rounded-full bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
                      >
                        Mark as Preparing
                      </button>
                    )}
                                    {(order.status === "out_for_delivery" || order.status === "shipped") && (
                      <button
                        type="button"
                        onClick={() => performOrderAction(order.id, "deliver")}
                        className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Deliver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => performOrderAction(order.id, "cancel")}
                      className="rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
