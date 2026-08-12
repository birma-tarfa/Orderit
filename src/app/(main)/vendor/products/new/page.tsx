"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/ImageUpload";
import type { Category } from "@/types";

interface ProductFormValues {
  name: string;
  description: string;
  category_id: string;
  price: string;
  compare_price: string;
  stock_quantity: string;
  sku: string;
  is_active: boolean;
  tags: string;
}

export default function NewVendorProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const { register, handleSubmit } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      price: "",
      compare_price: "",
      stock_quantity: "0",
      sku: "",
      is_active: true,
      tags: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
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

      const { data, error } = await supabase
        .from("categories")
        .select("id,name")
        .order("name");

      if (error) {
        console.error(error);
      }

      setCategories(data || []);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const onSubmit = async (values: ProductFormValues) => {
    setFormError(null);
    setSubmitting(true);
    const supabase = createClient();

    try {
      const tags = values.tags
        ? values.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }


      const imageList = imageUrls.slice(0, 5);

      const { error } = await supabase.from("products").insert({
        vendor_id: user.id,
        name: values.name,
        description: values.description || null,
        category_id: values.category_id || null,
        price: Number(values.price),
        compare_price: values.compare_price ? Number(values.compare_price) : null,
        minimum_order: 1,
        stock_quantity: Number(values.stock_quantity),
        sku: values.sku?.trim() || null,
        is_active: values.is_active,
        images: imageList,
        tags,
      });

      if (error) {
        throw error;
      }

      router.push("/vendor/products");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to create product. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Add New Product</h1>
          <p className="mt-2 text-sm text-slate-600">Create a new product and publish it to your storefront.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/vendor/products")}
          className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Back to Products
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent border-[#1a7a4a]" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          {formError && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Product name</label>
              <input
                type="text"
                {...register("name", { required: true })}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select
                {...register("category_id", { required: true })}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              {...register("description")}
              rows={5}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Price in ₦</label>
              <input
                type="number"
                step="0.01"
                {...register("price", { required: true })}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Compare price in ₦ (optional)</label>
              <input
                type="number"
                step="0.01"
                {...register("compare_price")}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Stock quantity</label>
              <input
                type="number"
                {...register("stock_quantity", { required: true })}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">SKU (optional)</label>
              <input
                type="text"
                {...register("sku")}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
            </div>

          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Product Images</label>
              <ImageUpload
                value={imageUrls}
                onChange={(urls) => setImageUrls(urls)}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Tags</label>
              <input
                type="text"
                {...register("tags")}
                placeholder="E.g. Waterproof, Limited Edition, Vegan"
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
              <p className="text-xs text-slate-500">
                Comma-separated. Use whatever's relevant for this product's category.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
              <input type="checkbox" {...register("is_active")} className="h-4 w-4 rounded border-slate-300 text-[#1a7a4a]" />
              Publish as active
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {imageUrls.filter(Boolean).length} image URL(s) added
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-[#1a7a4a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Product"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/vendor/products")}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
