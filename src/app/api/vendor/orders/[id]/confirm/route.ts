import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createOrderNotification } from "@/lib/order-notifications";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve vendor profile for current user
  const { data: vp, error: vpError } = await supabase
    .from("vendor_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (vpError || !vp) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

  const vendorProfileId = vp.id;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,buyer_id,vendor_id,status")
    .eq("id", params.id)
    .eq("vendor_id", vendorProfileId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
  }

  if (order.status !== "pending") {
    return NextResponse.json({ error: "Only pending orders can be confirmed" }, { status: 400 });
  }

  const { error } = await supabase.from("orders").update({ status: "confirmed" }).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await createOrderNotification(order.buyer_id, "Order confirmed", `Your order ${order.id.slice(0, 8)} has been confirmed.`, order.id);
  return NextResponse.json({ success: true });
}
