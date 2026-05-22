import { NextRequest, NextResponse } from "next/server";
import { initializePayment } from "@/lib/flutterwave";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, email, amount, customerName, customerPhone } = body;

    // Validate inputs
    if (!orderId || !email || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, email, amount" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Verify order exists and get buyer info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, buyer(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate unique transaction reference
    const txRef = `flutterwave_${orderId}_${Date.now()}`;

    // Initialize Flutterwave payment
    const flutterwaveResponse = await initializePayment(
      email,
      amount,
      txRef,
      {
        name: customerName || order.buyer.full_name || "Customer",
        phone: customerPhone || order.buyer.phone || "",
      },
      {
        orderId,
        buyerId: order.buyer_id,
      }
    );

    if (flutterwaveResponse.status !== "success" || !flutterwaveResponse.data) {
      return NextResponse.json(
        { error: flutterwaveResponse.message || "Failed to initialize payment" },
        { status: 400 }
      );
    }

    // Update order with payment reference
    await supabase.from('orders').update({
      payment_method: "flutterwave",
      payment_reference: txRef,
      payment_status: "pending",
    }).eq('id', orderId);

    return NextResponse.json({
      status: true,
      data: {
        link: flutterwaveResponse.data.link,
      },
    });
  } catch (error) {
    console.error("Flutterwave initialize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
