"use client";

import { useState } from "react";
import OwnerControls from "@/components/vendor/OwnerControls";
import ProductGridClient from "@/components/vendor/ProductGridClient";
import type { Category } from '@/types';
import type { Product } from "@/types";

interface Props {
  vendorId: string;
  products: Product[];
  isOwner?: boolean;
  vendorName?: string;
  categories?: Category[];
}

export default function ClientSideProductGrid({ vendorId, products, isOwner = false, categories = [] }: Props) {
  const [viewPublic, setViewPublic] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredProducts = activeCategory
    ? products.filter((p) => p.category && (p.category as any).id === activeCategory)
    : products;

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex items-center justify-between">
          <OwnerControls vendorId={vendorId} onToggleView={(v) => setViewPublic(v)} />
        </div>
      )}
      {categories && categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto">
          <button
            className={`rounded-full px-4 py-2 text-sm ${!activeCategory ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`rounded-full px-4 py-2 text-sm ${activeCategory === c.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <ProductGridClient products={filteredProducts} initialViewPublic={viewPublic} />
    </div>
  );
}
