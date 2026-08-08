import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { code } = await request.json();
    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: vp } = await supabase
      .from("vendor_profiles").select("id").eq("user_id", user.id).single();

    const { data: order } = await supabase
      .from("orders")
      .select("id, delivery_code, delivery_code_used, buyer_id, status")
      .eq("id", params.id)
      .eq("vendor_id", vp?.id)
      .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.delivery_code_used) return NextResponse.json({ error: "Delivery code already used" }, { status: 400 });
    if (order.delivery_code !== code) return NextResponse.json({ error: "Invalid delivery code" }, { status: 400 });

    await supabase.from("orders").update({ 
      status: "delivered", 
      delivery_code_used: true,
      payment_status: "paid"
    }).eq("id", params.id);

    // Notify buyer
    await supabase.from("notifications").insert({
      user_id: order.buyer_id,
      title: "Order Delivered!",
      body: "Your order has been delivered successfully.",
      type: "order",
      link: `/buyer/orders/${params.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-delivery error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
