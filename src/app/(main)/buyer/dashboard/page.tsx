import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, CreditCard, Clock, CheckCircle } from "lucide-react";

interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  vendor: {
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
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", userId)
    .single();

  if (error || !user || user.role !== "buyer") {
    redirect("/marketplace");
  }

  return { userId, user };
}

async function getBuyerStats(userId: string): Promise<BuyerStats> {
  const supabase = createSupabaseServerClient();

  // Get total orders and spent
  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, status")
    .eq("buyer_id", userId);

  if (error) {
    console.error("Error fetching orders:", error);
    return { totalOrders: 0, totalSpent: 0, pendingOrders: 0, deliveredOrders: 0 };
  }

  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
  const pendingOrders = orders?.filter(order => ["pending", "confirmed", "shipped"].includes(order.status)).length || 0;
  const deliveredOrders = orders?.filter(order => order.status === "delivered").length || 0;

  return { totalOrders, totalSpent, pendingOrders, deliveredOrders };
}

async function getRecentOrders(userId: string): Promise<RecentOrder[]> {
  const supabase = createSupabaseServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id,
      total,
      status,
      payment_status,
      created_at,
      vendor:users!VendorOrders(full_name, email),
      orderItems:order_items(product_name, product_image)
    `)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching recent orders:", error);
    return [];
  }

  return orders || [];
}

function formatCurrency(value: number) {
  return `₦${value.toLocaleString()}`;
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

export default async function BuyerDashboard() {
  const { userId, user } = await requireBuyerUser();
  const [stats, recentOrders] = await Promise.all([
    getBuyerStats(userId),
    getRecentOrders(userId),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
          Welcome back, {user.full_name || "Buyer"}! 👋
        </h1>
        <p className="mt-2 text-slate-600">
          Track your orders, manage your profile, and continue shopping.
        </p>
        <div className="mt-6">
          <Link href="/marketplace">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
        />
        <StatsCard
          title="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={<CreditCard className="w-5 h-5 text-green-600" />}
        />
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders.toString()}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatsCard
          title="Delivered Orders"
          value={stats.deliveredOrders.toString()}
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Recent Orders */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Orders</h2>
            <p className="mt-1 text-sm text-slate-600">Your latest order activity</p>
          </div>
          <Link href="/buyer/orders">
            <Button variant="outline">View All Orders</Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
            <p className="text-slate-600 mb-4">Start shopping to see your orders here.</p>
            <Link href="/marketplace">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {order.orderItems.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="w-12 h-12 bg-slate-100 rounded-lg border-2 border-white overflow-hidden flex-shrink-0"
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg border-2 border-white flex items-center justify-center text-xs font-medium text-slate-600">
                        +{order.orderItems.length - 3}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">
                      Order #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-sm text-slate-600">
                      {order.vendor.full_name || order.vendor.email}
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(Number(order.total))}
                  </div>
                  <Badge className={getStatusClass(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}