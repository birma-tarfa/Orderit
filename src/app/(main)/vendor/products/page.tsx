"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface VendorProductRow {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  images: string[];
  category?: { name: string };
}

const statusStyles = {
  active: "bg-emerald-100 text-emerald-800",
  draft: "bg-slate-100 text-slate-800",
};

export default function VendorProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<VendorProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userError || !userRecord || userRecord.role !== "vendor") {
        router.push("/marketplace");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (profileError) {
        console.error(profileError);
      }

      const vendorId = profileData?.id || user.id;

      const { data, error: productsError } = await supabase
        .from("products")
        .select(`id,name,price,stock_quantity,is_active,images,category:categories(name)`)
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (productsError) {
        setError(productsError.message);
      }

      setProducts(data || []);
      setLoading(false);
    };

    load();
  }, [router]);

  const filteredProducts = useMemo(
    () => products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  );

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this product? This will archive the item.");
    if (!confirmed) return;

    const response = await fetch(`/api/vendor/products/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    if (!response.ok) {
      window.alert(result.error || "Unable to delete product.");
      return;
    }

    setProducts((prev) => prev.filter((product) => product.id !== id));
  };

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent border-[#1a7a4a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Your Products</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your dishes, pricing, stock, and publish status.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/vendor/products/new")}
          className="inline-flex items-center justify-center rounded-full bg-[#1a7a4a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#166033]"
        >
          Add New Product
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products by name"
          className="w-full max-w-md rounded-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/20"
        />
      </div>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600">
          <p className="text-xl font-semibold text-slate-900">No products yet.</p>
          <p className="mt-2">Add your first product!</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-4">Image</th>
                <th className="px-4 py-4">Name</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Price (₦)</th>
                <th className="px-4 py-4">Stock</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-4 align-top">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-slate-100">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">No image</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-slate-900">{product.name}</td>
                  <td className="px-4 py-4 align-top text-slate-600">{product.category?.name ?? "Uncategorized"}</td>
                  <td className="px-4 py-4 align-top text-slate-900">₦{product.price.toLocaleString()}</td>
                  <td className="px-4 py-4 align-top text-slate-900">{product.stock_quantity}</td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.is_active ? statusStyles.active : statusStyles.draft}`}>
                      {product.is_active ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top space-x-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/vendor/products/${product.id}/edit`)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      className="rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
