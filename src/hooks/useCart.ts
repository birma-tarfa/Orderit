import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';

export function useCart() {
  const supabase = createClient();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function syncCart() {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch cart items joined with products and vendor_profiles info
        const { data, error } = await supabase
          .from('cart_items')
          .select('*, product:products(id, name, price, images, stock_quantity, vendor_id), vendor:vendor_profiles(id, shop_name)')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          // Access current items from the store state
          const currentItems = useCartStore.getState().items;

          const dbItems = data.map((item: any) => ({
            id: item.product_id,
            product: item.product,
            quantity: item.quantity,
            vendor: item.vendor,
          }));

          // Merge logic: DB takes priority for existing products
          const localItems = [...currentItems];
          const mergedItems = [...dbItems];
          
          // If something is in local but not in DB, we should ideally push it to DB
          // For now, we add local-only items to the merged list
          localItems.forEach(localItem => {
            const existsInDb = dbItems.find(dbItem => dbItem.id === localItem.id);
            if (!existsInDb) {
              mergedItems.push(localItem);
            }
          });

          // Update the store's items using the built-in setState
          useCartStore.setState({ items: mergedItems });
        }
      } catch (err) {
        console.error('Error fetching cart from database:', err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      syncCart();
    }
  }, [user, supabase]);

  return { loading };
}