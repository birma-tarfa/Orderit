'use client';

import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Minus, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  // Group items by vendor
  const groupedByVendor = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    items.forEach((item) => {
      const vendorId = item.product.vendor_id;
      if (!groups[vendorId]) {
        groups[vendorId] = [];
      }
      groups[vendorId].push(item);
    });
    return groups;
  }, [items]);

  // Calculate totals
  const totals = useMemo(() => {
    const vendorTotals: Record<string, number> = {};
    let grandTotal = 0;

    items.forEach((item) => {
      const vendorId = item.product.vendor_id;
      const itemTotal = item.product.price * item.quantity;
      vendorTotals[vendorId] = (vendorTotals[vendorId] || 0) + itemTotal;
      grandTotal += itemTotal;
    });

    return { vendorTotals, grandTotal };
  }, [items]);

  // Handle quantity update (increment)
  const handleIncrement = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      removeItem(itemId);
      useCartStore.getState().addItem({
        ...item,
        quantity: item.quantity + 1,
      });
    }
  };

  // Handle quantity update (decrement)
  const handleDecrement = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (item) {
      if (item.quantity <= 1) {
        removeItem(itemId);
      } else {
        removeItem(itemId);
        useCartStore.getState().addItem({
          ...item,
          quantity: item.quantity - 1,
        });
      }
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <ShoppingBag className="w-16 h-16 text-[#1a7a4a] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any items yet. Browse our marketplace to find delicious options!
          </p>
          <Button
            onClick={() => router.push('/marketplace')}
            className="bg-[#1a7a4a] hover:bg-[#156b3c] w-full"
          >
            Browse Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {Object.entries(groupedByVendor).map(([vendorId, vendorItems]) => (
                <div key={vendorId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Vendor Group Header */}
                  <div className="bg-gradient-to-r from-[#1a7a4a] to-[#156b3c] px-6 py-4">
                    <h2 className="text-lg font-semibold text-white">
                      {vendorItems[0]?.product.name?.split('|')[0] || 'Vendor Store'}
                    </h2>
                  </div>

                  {/* Items in vendor group */}
                  <div className="divide-y">
                    {vendorItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-6 hover:bg-gray-50 transition"
                      >
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {item.product.images && item.product.images[0] ? (
                              <Image
                                src={item.product.images[0]}
                                alt={item.product.name}
                                width={120}
                                height={120}
                                className="object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-[120px] h-[120px] bg-gray-200 rounded-lg flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {item.product.name}
                            </h3>
                            <p className="text-2xl font-bold text-[#1a7a4a] mb-4">
                              ₦{item.product.price.toLocaleString()}
                            </p>

                            {/* Quantity Stepper */}
                            <div className="flex items-center gap-3 mt-auto">
                              <button
                                onClick={() => handleDecrement(item.id)}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-[#1a7a4a] text-gray-700 hover:text-white transition"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-12 text-center font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleIncrement(item.id)}
                                className="p-2 rounded-lg bg-gray-100 hover:bg-[#1a7a4a] text-gray-700 hover:text-white transition"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Item Total and Remove */}
                          <div className="flex flex-col items-end justify-between">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <div className="text-right">
                              <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₦{(item.product.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vendor Subtotal */}
                  <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <span className="text-gray-700 font-semibold">Vendor Subtotal</span>
                    <span className="text-xl font-bold text-[#1a7a4a]">
                      ₦{totals.vendorTotals[vendorId]?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-8 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>₦{totals.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-3xl font-bold text-[#1a7a4a]">
                    ₦{totals.grandTotal.toLocaleString()}
                  </span>
                </div>

                <Button
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-[#1a7a4a] hover:bg-[#156b3c] text-white font-semibold py-3"
                >
                  Proceed to Checkout
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                You can review and modify your order in the next step
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
