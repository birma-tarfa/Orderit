import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { orderId, email, amount } = await request.json();

    if (!orderId || !email || !amount)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const supabase = createSupabaseServerClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, total, status")
      .eq("id", orderId)
      .single();

    if (error || !order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const reference = `order_${orderId}_${Date.now()}`;

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        metadata: { orderId },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/verify?gateway=paystack&reference=${reference}&orderId=${orderId}`,
      }),
    });

    const data = await response.json();

    console.error("Paystack response:", JSON.stringify(data));
    if (!data.status)
      return NextResponse.json({ error: data.message }, { status: 400 });

    await supabase
      .from("orders")
      .update({ payment_reference: reference, payment_method: "paystack" })
      .eq("id", orderId);

    return NextResponse.json({ authorization_url: data.data.authorization_url, reference });
  } catch (error) {
    console.error("Paystack initialize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
