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
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

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
      id,
      total,
      status,
      payment_status,
      created_at,
      vendor:users!VendorOrders(id, full_name, email),
      orderItems:order_items(product_name, product_image)
    `)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return [];
  }

  return orders || [];
}

export default async function OrdersPageWrapper() {
  const userId = await requireBuyerUser();
  const orders = await getOrders(userId);

  return <OrdersPage orders={orders} />;
}