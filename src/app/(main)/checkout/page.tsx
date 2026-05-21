"use client";

import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CartDrawer } from "@/components/checkout/CartDrawer";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Checkout</h1>
        <p className="text-slate-600">Complete your purchase with secure payment options.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Your cart is empty</h2>
          <p className="mt-2 text-slate-600">Add products from the marketplace before checking out.</p>
          <Link href="/marketplace">
            <Button className="mt-6">Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {!user?.email && (
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                Please sign in to complete checkout and place your order.
              </div>
            )}
            <CheckoutForm items={items} />
          </div>
          <CartDrawer items={items} />
        </div>
      )}
    </section>
  );
}
