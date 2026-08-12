'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ProductCard } from "@/components/product/ProductCard";
import { VendorCard } from "@/components/vendor/VendorCard";
import { ProductCardSkeleton, VendorCardSkeleton, CategoryCardSkeleton } from "@/components/skeletons";

async function getFeaturedProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`*, vendor:vendor_profiles(shop_name, logo_url), category:categories(id,name)`)
    .eq("is_active", true)
    .order("rating", { ascending: false })
    .limit(10);
  if (error) console.error("featuredProducts error:", error);
  // normalize vendor name
  return (data || []).map((p: any) => ({
    ...p,
    vendor: { full_name: p.vendor?.shop_name || p.vendor?.full_name || 'Unknown', logo_url: p.vendor?.logo_url },
  }));
}

async function getTopVendors() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vendor_profiles")
    .select("*")
    .order("rating", { ascending: false })
    .order("total_sales", { ascending: false })
    .limit(6);
  if (error) console.error("topVendors error:", error);
  return data ?? [];
}

async function getRecentProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(`*, vendor:vendor_profiles(shop_name, logo_url), category:categories(id,name)`)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) console.error("recentProducts error:", error);
  return (data || []).map((p: any) => ({
    ...p,
    vendor: { full_name: p.vendor?.shop_name || p.vendor?.full_name || 'Unknown', logo_url: p.vendor?.logo_url },
  }));
}

async function getCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select(`*, products(id)`)
    .limit(8);
  if (error) console.error("categories error:", error);
  return data ?? [];
}

export default function MarketplacePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [featured, vendors, recent, cats] = await Promise.all([
        getFeaturedProducts(),
        getTopVendors(),
        getRecentProducts(),
        getCategories(),
      ]);
      setFeaturedProducts(featured);
      setTopVendors(vendors);
      setRecentProducts(recent);
      setCategories(cats);
      setIsLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-12">
      {/* Featured Products */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Featured Products</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {featuredProducts.length > 0
            ? featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
            : Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </section>

      {/* Recently Added */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Recently Added</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recentProducts.length > 0
            ? recentProducts.map((product) => <ProductCard key={product.id} product={product} />)
            : Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </section>

      {/* Featured Categories */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Shop by Category</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.length > 0
            ? categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/marketplace/search?category=${encodeURIComponent(category.name)}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
                      {category.icon || "📦"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{category.name}</h3>
                      <p className="text-sm text-slate-600">
                        {category.products?.length ?? 0} product{(category.products?.length ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            : Array.from({ length: 8 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
        </div>
      </section>

      {/* Top Vendors */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Top Vendors</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topVendors.length > 0
            ? topVendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)
            : Array.from({ length: 6 }).map((_, i) => <VendorCardSkeleton key={i} />)}
        </div>
      </section>

      {/* Recently Added */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Recently Added</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recentProducts.length > 0
            ? recentProducts.map((product) => <ProductCard key={product.id} product={product} />)
            : Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </section>
    </div>
  );
}
