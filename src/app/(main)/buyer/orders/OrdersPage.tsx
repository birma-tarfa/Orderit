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
    id: string;
    full_name?: string;
    email: string;
  };
  orderItems: {
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
    .select(`id,total,status,payment_status,created_at,vendor_id`)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  const orderList = orders || [];
  const vendorIds = Array.from(new Set(orderList.map((o: any) => o.vendor_id).filter(Boolean)));
  const orderIds = orderList.map((o: any) => o.id);

  const { data: vendors } = vendorIds.length
    ? await supabase.from("users").select("id,full_name,email").in("id", vendorIds)
    : { data: [] };
  const { data: items } = orderIds.length
    ? await supabase.from("order_items").select("order_id,product_name,product_image").in("order_id", orderIds)
    : { data: [] };
  const { data: vendorProfiles } = vendorIds.length
    ? await supabase.from("vendor_profiles").select("user_id,shop_name").in("user_id", vendorIds)
    : { data: [] };

  const itemsByOrder: Record<string, any[]> = (items || []).reduce((acc: any, it: any) => {
    acc[it.order_id] = acc[it.order_id] || [];
    acc[it.order_id].push({ product_name: it.product_name, product_image: it.product_image });
    return acc;
  }, {});

  const vendorsById: Record<string, any> = (vendors || []).reduce((acc: any, v: any) => {
    acc[v.id] = v;
    return acc;
  }, {});

  const profilesByUserId: Record<string, any> = (vendorProfiles || []).reduce((acc: any, p: any) => {
    acc[p.user_id] = p;
    return acc;
  }, {});

  return (
    orderList.map((o: any) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      payment_status: o.payment_status,
      created_at: o.created_at,
      vendor: {
        ...(vendorsById[o.vendor_id] || { id: o.vendor_id }),
        shop_name: profilesByUserId[o.vendor_id]?.shop_name,
      },
      orderItems: itemsByOrder[o.id] || [],
    })) as Order[]
  );
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
    case "shipped":
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
                  <td className="px-4 py-4 text-slate-900">{order.vendor.full_name || order.vendor.shop_name || order.vendor.email}</td>
                  <td className="px-4 py-4 text-slate-900">{order.orderItems.length}</td>
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
