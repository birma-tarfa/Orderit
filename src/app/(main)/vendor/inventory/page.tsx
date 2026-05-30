import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import InventoryPage from "./InventoryPage";

async function getInventoryData() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

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

  const { data: vpData } = await supabase
    .from("vendor_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();
  const vendorProfileId = vpData?.id;

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(`id, name, sku, price, stock_quantity, images, is_active, created_at, category_id`)
    .eq("vendor_id", vendorProfileId)
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  const productList = products || [];
  const categoryIds = Array.from(new Set(productList.map((p: any) => p.category_id).filter(Boolean)));

  // Fetch categories separately
  const { data: categoryData, error: categoriesError } = categoryIds.length
    ? await supabase.from("categories").select("id,name").in("id", categoryIds)
    : { data: [] };

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
  }

  const categoriesById: Record<string, any> = (categoryData || []).reduce((acc: any, cat: any) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const productsWithCategories = productList.map((p: any) => ({
    ...p,
    category: categoriesById[p.category_id],
  }));

  // Fetch all categories for the filter dropdown
  const { data: allCategories, error: allCategoriesError } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (allCategoriesError) {
    console.error("Error fetching all categories:", allCategoriesError);
  }

  return {
    products: productsWithCategories,
    categories: allCategories || [],
  };
}

export default async function InventoryPageWrapper() {
  const data = await getInventoryData();

  return <InventoryPage products={data.products} categories={data.categories} />;
}