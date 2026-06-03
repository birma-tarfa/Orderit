import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = body.items as OrderItemPayload[];
    const deliveryAddress = typeof body.deliveryAddress === "string" ? body.deliveryAddress.trim() : "";
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!items || !Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    if (!deliveryAddress)
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    if (!customerName)
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    if (!email)
      return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const { data: user, error: userError } = await supabase
      .from("users").select("role").eq("id", userId).single();
    if (userError || !user || user.role !== "buyer")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const productIds = items.map((item) => item.productId);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, images, vendor_id, stock_quantity")
      .in("id", productIds);

    if (productsError || !products || products.length !== productIds.length)
      return NextResponse.json({ error: "One or more cart items are invalid" }, { status: 400 });

    const vendorIds = Array.from(new Set(products.map((p) => p.vendor_id)));
    if (vendorIds.length !== 1)
      return NextResponse.json(
        { error: "All items must be from the same vendor" }, { status: 400 }
      );

    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error("Invalid product in cart");
      if (!Number.isInteger(item.quantity) || item.quantity <= 0)
        throw new Error("Quantity must be a positive integer");
      return {
        product_id: product.id,
        quantity: item.quantity,
        price_at_purchase: product.price,
        product_name: product.name,
        product_image: product.images?.[0] ?? null,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price_at_purchase) * item.quantity, 0
    );
    const deliveryFee = 1000;

    // generate a random 6-digit delivery code for buyer verification
    const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        vendor_id: vendorIds[0],
        status: "pending",
        delivery_code: deliveryCode,
        subtotal,
        delivery_fee: deliveryFee,
        total: subtotal + deliveryFee,
        payment_method: "pending",
        payment_status: "pending",
        delivery_address: { address: deliveryAddress, customerName, email },
      })
      .select("id")
      .single();

    if (orderError || !order)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError)
      return NextResponse.json({ error: "Failed to save order items" }, { status: 500 });

    return NextResponse.json({ status: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error("Order create error:", JSON.stringify(error));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
