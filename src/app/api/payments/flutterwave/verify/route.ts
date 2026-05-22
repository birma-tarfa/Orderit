import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/flutterwave";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing transaction_id parameter" },
        { status: 400 }
      );
    }

    // Verify payment with Flutterwave
    const flutterwaveResponse = await verifyPayment(transactionId);

    if (flutterwaveResponse.status !== "success" || !flutterwaveResponse.data) {
      return NextResponse.json(
        {
          verified: false,
          message: flutterwaveResponse.message || "Payment verification failed",
        },
        { status: 400 }
      );
    }

    // Extract order ID from transaction reference
    const txRef = flutterwaveResponse.data.tx_ref;
    const orderId = txRef.split("_")[1];

    const supabase = createSupabaseServerClient();

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order based on payment status
    const paymentStatus = flutterwaveResponse.data.status;
    const isPaid = paymentStatus === "successful";

    await supabase.from('orders').update({
      payment_status: isPaid ? "paid" : "failed",
      status: isPaid ? "confirmed" : "pending",
    }).eq('id', orderId);

    return NextResponse.json({
      verified: isPaid,
      message: isPaid ? "Payment verified successfully" : "Payment failed",
      data: {
        transactionId: flutterwaveResponse.data.id,
        reference: flutterwaveResponse.data.tx_ref,
        amount: flutterwaveResponse.data.amount,
        status: flutterwaveResponse.data.status,
        createdAt: flutterwaveResponse.data.created_at,
      },
    });
  } catch (error) {
    console.error("Flutterwave verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
