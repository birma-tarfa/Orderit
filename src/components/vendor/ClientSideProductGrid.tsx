"use client";

import { useState } from "react";
import OwnerControls from "@/components/vendor/OwnerControls";
import ProductGridClient from "@/components/vendor/ProductGridClient";
import type { Product } from "@/types";

interface Props {
  vendorId: string;
  products: Product[];
  isOwner?: boolean;
  vendorName?: string;
}

export default function ClientSideProductGrid({ vendorId, products, isOwner = false }: Props) {
  const [viewPublic, setViewPublic] = useState(true);

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="flex items-center justify-between">
          <OwnerControls vendorId={vendorId} onToggleView={(v) => setViewPublic(v)} />
        </div>
      )}

      <ProductGridClient products={products} initialViewPublic={viewPublic} />
    </div>
  );
}
