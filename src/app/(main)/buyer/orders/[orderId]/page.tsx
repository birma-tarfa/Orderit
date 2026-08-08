import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { statusLabel, statusColor } from "@/lib/order-status";

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const { data: order, error } = await supabase
    .from("orders")
    .select(`id, buyer_id, vendor_id, status, subtotal, delivery_fee, total, payment_method, payment_status, delivery_address, created_at, dispatch_rider_name, dispatch_rider_phone, vendor:vendor_profiles(shop_name), order_items(id, product_name, quantity, price_at_purchase, product_image)`)
    .eq("id", params.orderId)
    .eq("buyer_id", userId)
    .single();

  if (error || !order) return <div className="p-6">Order not found.</div>;

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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Order Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-2 text-sm font-semibold ${statusColor(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-500">Order Date</p>
                <p className="mt-2 text-slate-900">{new Date(order.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  {(order.order_items || []).map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-200">
                      <td className="px-4 py-4 text-slate-900">{item.product_name}</td>
                      <td className="px-4 py-4 text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-4 text-slate-900">₦{Number(item.price_at_purchase).toLocaleString()}</td>
                      <td className="px-4 py-4 text-slate-900">₦{(Number(item.price_at_purchase) * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>₦{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery fee</span>
                <span>₦{Number(order.delivery_fee).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">₦{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Delivery Address</h2>
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{address}</p>
          </div>

          {order.dispatch_rider_name && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Your Delivery Rider</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Name</span>
                  <span>{order.dispatch_rider_name}</span>
                </div>
                {order.dispatch_rider_phone && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Phone</span>
                    <a className="text-blue-600 hover:text-blue-700" href={`tel:${order.dispatch_rider_phone}`}>
                      {order.dispatch_rider_phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <OrderTimeline status={order.status as any} />
        </div>
      </div>
    </div>
  );
}