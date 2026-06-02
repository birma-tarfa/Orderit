import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Order {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  vendor: {
    shop_name?: string;
    logo_url?: string;
  };
  order_items: {
    product_name: string;
    product_image?: string;
  }[];
}

async function requireBuyerUser() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !user || user.role !== "buyer") {
    redirect("/marketplace");
  }

  return userId;
}

async function getOrders(userId: string): Promise<Order[]> {
  const supabase = createSupabaseServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      vendor:vendor_profiles(shop_name, logo_url),
      order_items(id, product_name, quantity, price_at_purchase, product_image)
    `)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return (orders || []) as Order[];
}

export default async function OrdersPageWrapper() {
  const userId = await requireBuyerUser();
  const orders = await getOrders(userId);

  return <BuyerOrdersPage orders={orders} />;
}

function getStatusClass(status: string) {
  switch (status) {
    case "delivered":
      return "bg-emerald-100 text-emerald-800";
    case "out_for_delivery":
      return "bg-blue-100 text-blue-800";
    case "confirmed":
      return "bg-amber-100 text-amber-800";
    case "pending":
      return "bg-slate-100 text-slate-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function BuyerOrdersPage({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Your Orders</h1>
            <p className="mt-2 text-sm text-slate-600">Review all your orders and track their progress.</p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600">
          <p className="text-xl font-semibold text-slate-900">No orders yet</p>
          <p className="mt-2">Your completed purchases will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-4">Order</th>
                <th className="px-4 py-4">Vendor</th>
                <th className="px-4 py-4">Items</th>
                <th className="px-4 py-4">Total</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-4 text-slate-900">#{order.id.slice(0, 8)}</td>
                  <td className="px-4 py-4 text-slate-900">{order.vendor?.shop_name || 'Unknown Vendor'}</td>
                  <td className="px-4 py-4 text-slate-900">{order.order_items?.length || 0}</td>
                  <td className="px-4 py-4 text-slate-900">₦{Number(order.total).toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{new Date(order.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
