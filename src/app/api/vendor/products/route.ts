import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || !user || user.role !== "vendor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    description,
    category_id,
    price,
    compare_price,
    preparation_time,
    minimum_order,
    is_available_today,
    dietary_tags,
    spice_level,
    stock_quantity,
    sku,
    is_active,
    images,
  } = body;

  if (
    !name ||
    !category_id ||
    !price ||
    preparation_time == null ||
    minimum_order == null ||
    is_available_today == null ||
    !spice_level ||
    stock_quantity == null ||
    !Array.isArray(images)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert([
      {
        vendor_id: userId,
        name,
        description,
        category_id,
        price,
        compare_price: compare_price ?? null,
        preparation_time,
        minimum_order,
        is_available_today,
        dietary_tags: Array.isArray(dietary_tags) ? dietary_tags : [],
        spice_level,
        stock_quantity,
        sku: sku || null,
        is_active,
        images,
        rating: 0,
        review_count: 0,
      },
    ])
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json({ error: error?.message || "Unable to create product" }, { status: 500 });
  }

  return NextResponse.json({ product });
}
