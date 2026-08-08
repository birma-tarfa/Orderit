"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VendorOrderActions } from "@/components/vendor/VendorOrderActions";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { statusLabel, statusColor } from "@/lib/order-status";

interface OrderItemRow {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  product_image?: string;
}

interface VendorOrderDetail {
  id: string;
  buyer_id: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  delivery_address: any;
  created_at: string;
  buyer_name: string;
  order_items: OrderItemRow[];
}

export default function VendorOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id;
  const [order, setOrder] = useState<VendorOrderDetail | null>(null);
  const [riderName, setRiderName] = useState("");
  const [riderPhone, setRiderPhone] = useState("");
  const [savingRider, setSavingRider] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        router.push("/vendor/orders");
        return;
      }

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

      // Resolve vendor profile id for this user
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

      const { data, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          buyer_id,
          status,
          subtotal,
          delivery_fee,
          total,
          payment_method,
          payment_status,
          delivery_address,
          created_at
        `)
        .eq("id", orderId)
        .eq("vendor_id", vendorId)
        .single();

      if (orderError || !data) {
        setError("Unable to load order details.");
        setLoading(false);
        return;
      }

      // Fetch buyer details separately
      const { data: buyer, error: buyerError } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", data.buyer_id)
        .single();

      // Fetch order items separately
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("id,product_name,quantity,price_at_purchase,product_image")
        .eq("order_id", orderId);

      setOrder({
        id: data.id,
        buyer_id: data.buyer_id,
        status: data.status,
        subtotal: Number(data.subtotal || 0),
        delivery_fee: Number(data.delivery_fee || 0),
        total: Number(data.total || 0),
        payment_method: data.payment_method,
        payment_status: data.payment_status,
        delivery_address: data.delivery_address,
        created_at: data.created_at,
        buyer_name: buyer?.full_name || "Buyer",
        order_items: (items || []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_at_purchase: Number(item.price_at_purchase || 0),
          product_image: item.product_image,
        })),
      });

      setLoading(false);
    };

    loadOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent border-[#1a7a4a]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">
          <p className="text-lg font-semibold">Unable to load order details.</p>
          <p className="mt-2 text-sm">Please return to the order list and try again.</p>
          <button
            type="button"
            onClick={() => router.push("/vendor/orders")}
            className="mt-6 rounded-full bg-[#1a7a4a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#166033]"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const address = typeof order.delivery_address === "string"
    ? order.delivery_address
    : order.delivery_address?.address || JSON.stringify(order.delivery_address, null, 2);

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Order Details</h1>
          <p className="mt-2 text-sm text-slate-600">Review the order, buyer details, and move it along the workflow.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/vendor/orders")}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Back to Orders
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Order ID</p>
                <p className="mt-2 text-base text-slate-900">{order.id}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${statusColor(order.status)}`}>
                {statusLabel(order.status)}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Buyer</p>
                <p className="mt-2 text-slate-900">{order.buyer_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Order date</p>
                <p className="mt-2 text-slate-900">{new Date(order.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Delivery address</p>
                <p className="mt-2 whitespace-pre-wrap text-slate-900">{address}</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Items</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 text-slate-900">{item.product_name}</td>
                      <td className="px-4 py-4 text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-4 text-slate-900">₦{item.price_at_purchase.toLocaleString()}</td>
                      <td className="px-4 py-4 text-slate-900">₦{(item.price_at_purchase * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery fee</span>
                <span>₦{order.delivery_fee.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          <OrderTimeline status={order.status as any} />
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Order actions</h2>
            <p className="mt-2 text-sm text-slate-600">Update this order as it progresses through your kitchen and delivery.</p>
            <div className="mt-6">
              <VendorOrderActions
                orderId={order.id}
                status={order.status}
                buyerId={order.buyer_id}
                onStatusChange={(newStatus) => setOrder({ ...order, status: newStatus })}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Assign Dispatch Rider</h2>
            <p className="mt-2 text-sm text-slate-600">Provide the rider's name and phone for this order.</p>
            <div className="mt-4 space-y-3">
              <input value={riderName} onChange={(e) => setRiderName(e.target.value)} placeholder="Rider name" className="w-full rounded-md border border-slate-200 px-3 py-2" />
              <input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="Rider phone" className="w-full rounded-md border border-slate-200 px-3 py-2" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={async () => {
                  if (!riderName && !riderPhone) return;
                  setSavingRider(true);
                  try {
                    const res = await fetch(`/api/vendor/orders/${order.id}/assign-rider`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: riderName, phone: riderPhone }),
                    });
                    const payload = await res.json();
                    if (!res.ok) throw new Error(payload.error || "Failed to save");
                    // success
                    setRiderName(""); setRiderPhone("");
                    router.refresh();
                    alert("Rider assigned");
                  } catch (err) {
                    console.error(err);
                    alert(err instanceof Error ? err.message : "Failed to assign rider");
                  } finally { setSavingRider(false); }
                }} className="rounded-full bg-emerald-600 px-4 py-2 text-white">{savingRider ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Payment & delivery</h2>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Payment method</span>
                <span>{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment status</span>
                <span>{order.payment_status}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
