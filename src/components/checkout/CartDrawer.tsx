import { formatCurrency } from "@/constants";
import type { CartItem } from "@/types";
import { useCart } from "@/hooks/useCart";

interface CartDrawerProps {
  items: CartItem[];
}

export function CartDrawer({ items }: CartDrawerProps) {
  const { loading } = useCart();

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = 1000;
  const total = subtotal + deliveryFee;

  return (
    <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold">Cart</h3>
        <p className="mt-2 text-sm text-slate-600">Review your items and total before paying.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-emerald-600" />
        </div>
      )}

      {items.length === 0 && !loading ? (
        <p className="text-sm text-slate-600">Your cart is empty.</p>
      ) : (
        <div className={`space-y-4 ${loading ? 'opacity-50' : ''}`}>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.product.name}</p>
                    <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    ₦{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between pb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, "NGN", "en-NG")}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span>Delivery fee</span>
              <span>{formatCurrency(deliveryFee, "NGN", "en-NG")}</span>
            </div>
            <div className="flex justify-between pt-2 font-semibold text-slate-900 border-t border-slate-200">
              <span>Total</span>
              <span>{formatCurrency(total, "NGN", "en-NG")}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
