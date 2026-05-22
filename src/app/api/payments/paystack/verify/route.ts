import { NextRequest, NextResponse } from "next/server";
import { verifyPayment } from "@/lib/paystack";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Missing reference parameter" },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const paystackResponse = await verifyPayment(reference);

    if (!paystackResponse.status || !paystackResponse.data) {
      return NextResponse.json(
        {
          verified: false,
          message: paystackResponse.message || "Payment verification failed",
        },
        { status: 400 }
      );
    }

    // Extract order ID from reference
    const orderId = reference.split("_")[1];

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
    const paymentStatus = paystackResponse.data.status;
    const isPaid = paymentStatus === "success";

    await supabase.from('orders').update({
      payment_status: isPaid ? "paid" : "failed",
      status: isPaid ? "confirmed" : "pending",
    }).eq('id', orderId);

    return NextResponse.json({
      verified: isPaid,
      message: isPaid ? "Payment verified successfully" : "Payment failed",
      data: {
        reference: paystackResponse.data.reference,
        amount: paystackResponse.data.amount / 100, // Convert back to naira
        status: paystackResponse.data.status,
        paidAt: paystackResponse.data.paid_at,
      },
    });
  } catch (error) {
    console.error("Paystack verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
