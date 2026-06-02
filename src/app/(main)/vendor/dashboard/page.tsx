"use client"

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
};

type ProductLowStock = {
  id: string;
  name: string;
  stock_quantity: number;
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<ProductLowStock[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "vendor") {
      router.push("/marketplace");
      return;
    }

    const supabase = createClient();

    const fetchData = async () => {
      try {
        // get vendor profile by user_id
        const { data: vpData, error: vpError } = await supabase
          .from("vendor_profiles")
          .select("id,shop_name,rating,user_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (vpError) {
          console.error("vendor profile error", vpError);
        }

        const vendorId = vpData?.id;
        setVendorProfile(vpData || null);
        setAverageRating(vpData?.rating ?? null);

        if (!vendorId) {
          setLoading(false);
          return;
        }

        // Total revenue & orders
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id,total,status,created_at")
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false });

        if (ordersError) console.error("orders fetch error", ordersError);

        const revenue = (ordersData || []).reduce(
          (acc: number, o: any) => acc + (o.total || 0),
          0
        );
        setTotalRevenue(revenue);
        setTotalOrders((ordersData || []).length);

        // recent 5 orders
        const recent = (ordersData || []).slice(0, 5).map((o: any) => ({
          id: o.id,
          total: o.total,
          status: o.status,
          created_at: o.created_at,
        }));
        setRecentOrders(recent);

        // active products count
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id")
          .eq("vendor_id", vendorId)
          .eq("is_active", true);
        if (productsError) console.error("products fetch error", productsError);
        setActiveProducts((productsData || []).length);

        // low stock
        const { data: lowData, error: lowError } = await supabase
          .from("products")
          .select("id,name,stock_quantity")
          .eq("vendor_id", vendorId)
          .lte("stock_quantity", 5)
          .order("stock_quantity", { ascending: true });
        if (lowError) console.error("low stock fetch error", lowError);
        setLowStock(lowData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  const statusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-200 text-yellow-800";
      case "confirmed":
        return "bg-blue-200 text-blue-800";
      case "shipped":
      case "out_for_delivery":
        return "bg-purple-200 text-purple-800";
      case "delivered":
        return "bg-green-200 text-green-800";
      case "cancelled":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="animate-spin h-10 w-10 text-[#1a7a4a]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
      </div>
    );
  }

  const vendorName = vendorProfile?.shop_name || user?.full_name || "Vendor";
  const vendorId = vendorProfile?.id || profile?.id || user?.id;

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a7a4a]">
          Welcome back, {vendorName}
        </h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-xl font-semibold">₦{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-xl font-semibold">{totalOrders}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Active Products</div>
          <div className="text-xl font-semibold">{activeProducts}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Average Rating</div>
          <div className="text-xl font-semibold">{averageRating ?? "—"}</div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => router.push("/vendor/products/new")}
            className="py-3 px-4 rounded bg-[#1a7a4a] text-white hover:opacity-90"
          >
            Add Product
          </button>
          <button
            onClick={() => router.push("/vendor/orders")}
            className="py-3 px-4 rounded bg-[#1a7a4a] text-white hover:opacity-90"
          >
            View Orders
          </button>
          <button
            onClick={() => router.push("/vendor/inventory")}
            className="py-3 px-4 rounded bg-[#1a7a4a] text-white hover:opacity-90"
          >
            Manage Inventory
          </button>
          <button
            onClick={() => router.push(`/vendor/${vendorId}/store`)}
            className="py-3 px-4 rounded bg-[#1a7a4a] text-white hover:opacity-90"
          >
            View My Store
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-medium mb-3">Recent Orders</h2>
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600 border-b">
                <th className="p-3">Order ID</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No recent orders
                  </td>
                </tr>
              )}
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-3">{o.id.slice(0, 8)}</td>
                  <td className="p-3">₦{(o.total || 0).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${statusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3">{new Date(o.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Low Stock Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {lowStock.length === 0 && (
            <div className="p-4 text-gray-500">No low stock products.</div>
          )}
          {lowStock.map((p) => (
            <div key={p.id} className="p-4 bg-orange-50 border-l-4 border-orange-400 rounded">
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-orange-700">Only {p.stock_quantity} left</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
