import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import InventoryPage from "./InventoryPage";

async function getInventoryData() {
  const supabase = createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || !user || user.role !== "vendor") {
    redirect("/marketplace");
  }

  // Fetch products with categories
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`
      id,
      name,
      sku,
      price,
      stock_quantity,
      images,
      is_active,
      created_at,
      category:categories(id, name)
    `)
    .eq("vendor_id", userId)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  // Fetch categories for filter
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
  }

  return {
    products: products || [],
    categories: categories || [],
  };
}

export default async function InventoryPageWrapper() {
  const data = await getInventoryData();

  return <InventoryPage products={data.products} categories={data.categories} />;
}