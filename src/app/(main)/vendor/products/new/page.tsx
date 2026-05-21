"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  image_urls: string[];
  preparation_time: string;
  spice_level: "mild" | "medium" | "hot" | "extra_hot";
  dietary_tags: {
    halal: boolean;
    vegan: boolean;
    vegetarian: boolean;
    gluten_free: boolean;
  };
}

const spiceOptions = [
  { value: "mild", label: "Mild" },
  { value: "medium", label: "Medium" },
  { value: "hot", label: "Hot" },
  { value: "extra_hot", label: "Extra Hot" },
];

export default function NewVendorProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      price: "",
      compare_price: "",
      stock_quantity: "0",
      sku: "",
      is_active: true,
      image_urls: ["", "", ""],
      preparation_time: "20",
      spice_level: "medium",
      dietary_tags: {
        halal: false,
        vegan: false,
        vegetarian: false,
        gluten_free: false,
      },
    },
  });

  const imageUrls = watch("image_urls");
  const dietaryTags = watch("dietary_tags");

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
      const tags = Object.entries(values.dietary_tags)
        .filter(([, value]) => value)
        .map(([key]) => {
          switch (key) {
            case "halal":
              return "halal";
            case "vegan":
              return "vegan";
            case "vegetarian":
              return "vegetarian";
            case "gluten_free":
              return "gluten-free";
            default:
              return key;
          }
        });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const imageList = values.image_urls.filter(Boolean).slice(0, 3);

      const { error } = await supabase.from("products").insert({
        vendor_id: user.id,
        name: values.name,
        description: values.description || null,
        category_id: values.category_id || null,
        price: Number(values.price),
        compare_price: values.compare_price ? Number(values.compare_price) : null,
        stock_quantity: Number(values.stock_quantity),
        sku: values.sku || null,
        is_active: values.is_active,
        images: imageList,
        preparation_time: Number(values.preparation_time),
        dietary_tags: tags,
        spice_level: spiceOptions.find((option) => option.value === values.spice_level)?.label ?? "Medium",
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
          <p className="mt-2 text-sm text-slate-600">Create a new dish and publish it to your storefront.</p>
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

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Preparation time (minutes)</label>
              <input
                type="number"
                {...register("preparation_time", { required: true })}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Spice level</label>
              <select
                {...register("spice_level")}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
              >
                {spiceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Image URLs (up to 3)</label>
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <input
                    key={index}
                    type="text"
                    {...register(`image_urls.${index}` as const)}
                    placeholder={`Image URL ${index + 1}`}
                    className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-[#1a7a4a] focus:outline-none focus:ring-2 focus:ring-[#1a7a4a]/20"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Dietary tags</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "halal", label: "Halal" },
                  { key: "vegan", label: "Vegan" },
                  { key: "vegetarian", label: "Vegetarian" },
                  { key: "gluten_free", label: "Gluten-free" },
                ].map((option) => (
                  <label key={option.key} className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      {...register(`dietary_tags.${option.key}` as const)}
                      className="h-4 w-4 rounded border-slate-300 text-[#1a7a4a]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
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
              className="inline-flex items-center justify-center rounded-full bg-[#1a7a4a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#166033] disabled:cursor-not-allowed disabled:opacity-70"
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
