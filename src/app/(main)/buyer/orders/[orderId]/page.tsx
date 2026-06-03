import { createSupabaseServerClient } from "@/lib/supabase/server";
import DeliveryCodeBox from "@/components/buyer/DeliveryCodeBox";

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select(`id, buyer_id, vendor_id, status, subtotal, delivery_fee, total, payment_method, payment_status, delivery_address, created_at, delivery_code`)
    .eq("id", params.orderId)
    .eq("buyer_id", userId)
    .single();

  if (error || !order) return <div className="p-6">Order not found.</div>;

  const showCode = ["out_for_delivery", "confirmed", "preparing"].includes(order.status || "");

  const address = typeof order.delivery_address === "string"
    ? order.delivery_address
    : order.delivery_address?.address || JSON.stringify(order.delivery_address, null, 2);

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Order Details</h1>
            <p className="mt-2 text-sm text-slate-600">Order ID: {order.id}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-slate-500">Order date</p>
            <p className="mt-2 text-slate-900">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Delivery address</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-900">{address}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="mt-2 text-slate-900">{order.status}</p>
          </div>
        </div>

        {showCode && (
          <div>
            <DeliveryCodeBox code={order.delivery_code ?? null} />
            <p className="mt-3 text-xs text-rose-600">Do not share this code until your order arrives.</p>
          </div>
        )}
      </div>
    </div>
  );
}