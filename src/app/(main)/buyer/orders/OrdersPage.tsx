import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OrdersPage from "./OrdersPage";

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

  const { data: vendors } = await supabase.from("users").select("id,full_name,email").in("id", vendorIds);
  const { data: items } = await supabase.from("order_items").select("order_id,product_name,product_image").in("order_id", orderIds);

  const itemsByOrder: Record<string, any[]> = (items || []).reduce((acc: any, it: any) => {
    acc[it.order_id] = acc[it.order_id] || [];
    acc[it.order_id].push({ product_name: it.product_name, product_image: it.product_image });
    return acc;
  }, {});

  const vendorsById: Record<string, any> = (vendors || []).reduce((acc: any, v: any) => {
    acc[v.id] = v;
    return acc;
  }, {});

  return (
    orderList.map((o: any) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      payment_status: o.payment_status,
      created_at: o.created_at,
      vendor: vendorsById[o.vendor_id] || { id: o.vendor_id },
      orderItems: itemsByOrder[o.id] || [],
    })) as Order[]
  );
}

export default async function OrdersPageWrapper() {
  const userId = await requireBuyerUser();
  const orders = await getOrders(userId);

  return <OrdersPage orders={orders} />;
}