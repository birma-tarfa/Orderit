'use client';

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
    .select("*")
    .limit(8);
  if (error) console.error("categories error:", error);
  return data ?? [];
}

export default function MarketplacePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      <section className="rounded-[2rem] bg-gradient-to-br from-emerald-900 via-slate-900 to-[#0f4f36] px-6 py-12 text-white sm:px-12 sm:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Shop Anything From Trusted Local Vendors
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-emerald-100 sm:text-xl">
              Electronics, fashion, food, beauty, jewelry, and more, delivered to your door from verified vendors.
            </p>
          </div>
          <div className="mx-auto max-w-2xl space-y-6">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Search className="h-5 w-5 text-emerald-200" />
              <input
                className="flex-1 bg-transparent text-white placeholder:text-emerald-200 focus:outline-none"
                type="search"
                placeholder="Search products, vendors, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Search</Button>
            </form>
            <div className="flex flex-wrap justify-center gap-3">
              {["Rice & Swallow", "Grills & BBQ", "Soups & Stews", "Snacks & Small Chops", "Drinks"].map((category) => (
                <Link
                  key={category}
                  href={`/marketplace/search?category=${encodeURIComponent(category)}`}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-white/20"
                >
                  {category}
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Start Cooking</Button>
              </Link>
            </div>
          </div>
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
                    <div>
                      <h3 className="font-semibold text-slate-900">{category.name}</h3>
                      <p className="text-sm text-slate-600">Browse products</p>
                    </div>
                  </div>
                </Link>
              ))
            : Array.from({ length: 8 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <h2 className="text-3xl font-semibold">Featured Products</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {featuredProducts.length > 0
            ? featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
            : Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)}
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
