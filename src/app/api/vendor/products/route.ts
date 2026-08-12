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
    minimum_order,
    tags,
    stock_quantity,
    sku,
    is_active,
    images,
  } = body;

  if (
    !name ||
    !category_id ||
    !price ||
    minimum_order == null ||
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
        minimum_order,
        tags: Array.isArray(tags) ? tags : [],
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
