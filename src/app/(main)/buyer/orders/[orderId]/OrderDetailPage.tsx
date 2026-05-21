import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import OrderDetailPage from "./page";

interface OrderDetail {
  id: string;
  buyer_id: string;
  vendor_id: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_reference?: string;
  payment_status: string;
  delivery_address: any;
  created_at: string;
  vendor: {
    id: string;
    full_name?: string;
    email: string;
    shop_name?: string;
  };
  orderItems: {
    id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
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

async function getOrderDetail(orderId: string, userId: string): Promise<OrderDetail | null> {
  const supabase = createSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      buyer_id,
      vendor_id,
      status,
      subtotal,
      delivery_fee,
      total,
      payment_method,
      payment_reference,
      payment_status,
      delivery_address,
      created_at,
      vendor:users!VendorOrders(id, full_name, email, vendorProfile:vendor_profiles(shop_name)),
      orderItems:order_items(
        id,
        product_id,
        quantity,
        price_at_purchase,
        product_name,
        product_image
      )
    `)
    .eq("id", orderId)
    .eq("buyer_id", userId)
    .single();

  if (error || !order) {
    console.error("Error fetching order:", error);
    return null;
  }

  // Transform the vendor data
  const vendorProfile = order.vendor.vendorProfile;
  const transformedOrder = {
    ...order,
    vendor: {
      id: order.vendor.id,
      full_name: order.vendor.full_name,
      email: order.vendor.email,
      shop_name: vendorProfile?.shop_name,
    },
  };

  return transformedOrder as OrderDetail;
}

export default async function OrderDetailPageWrapper({
  params,
}: {
  params: { orderId: string };
}) {
  const userId = await requireBuyerUser();
  const order = await getOrderDetail(params.orderId, userId);

  return <OrderDetailPage order={order} />;
}