import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference)
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });

    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success")
      return NextResponse.json({ success: false, error: "Payment not successful" }, { status: 400 });

    const orderId = paystackData.data.metadata?.orderId;
    if (!orderId)
      return NextResponse.json({ success: false, error: "Order ID not found" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", orderId);

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
