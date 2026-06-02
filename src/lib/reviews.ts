import { supabaseAdminClient } from './supabase-admin';

/**
 * Recalculates and updates the average rating and review count for a product
 */
export async function recalculateProductRating(productId: string) {
  // Get all reviews for this product
  const { data: reviews, error: reviewsError } = await supabaseAdminClient
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
    throw new Error('Failed to calculate rating');
  }

  const reviewCount = reviews?.length || 0;
  let averageRating = 0;

  if (reviewCount > 0) {
    const totalRating = reviews?.reduce((sum, review) => sum + review.rating, 0) || 0;
    averageRating = Math.round((totalRating / reviewCount) * 100) / 100; // Round to 2 decimals
  }

  // Update product with new rating and review count
  const { error: updateError } = await supabaseAdminClient
    .from('products')
    .update({
      rating: averageRating,
      review_count: reviewCount,
    })
    .eq('id', productId);

  if (updateError) {
    console.error('Error updating product rating:', updateError);
    throw new Error('Failed to update product rating');
  }

  return { rating: averageRating, review_count: reviewCount };
}

/**
 * Validates that a buyer purchased a specific product and received it
 */
export async function validateBuyerPurchased(buyerId: string, productId: string) {
  const { data: orders, error } = await supabaseAdminClient
    .from('orders')
    .select('id, status, order_items!inner(product_id)')
    .eq('buyer_id', buyerId)
    .eq('order_items.product_id', productId)
    .in('status', ['delivered', 'shipped', 'out_for_delivery']) // Allow reviewing shipped/out_for_delivery or delivered items
    .limit(1);

  if (error) {
    console.error('Error validating purchase:', error);
    throw new Error('Failed to validate purchase');
  }

  return orders && orders.length > 0;
}

/**
 * Checks if a buyer has already reviewed a product
 */
export async function hasBuyerReviewedProduct(buyerId: string, productId: string) {
  const { data: review, error } = await supabaseAdminClient
    .from('reviews')
    .select('id')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking existing review:', error);
    throw new Error('Failed to check existing review');
  }

  return !!review;
}

/**
 * Gets rating breakdown for a product (count of each star rating)
 */
export async function getRatingBreakdown(productId: string) {
  const { data: reviews, error } = await supabaseAdminClient
    .from('reviews')
    .select('rating')
    .eq('product_id', productId);

  if (error) {
    console.error('Error fetching reviews for breakdown:', error);
    throw new Error('Failed to get rating breakdown');
  }

  const breakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  reviews?.forEach((review: any) => {
    const rating = review.rating as keyof typeof breakdown;
    if (rating >= 1 && rating <= 5) {
      breakdown[rating]++;
    }
  });

  const total = reviews?.length || 1; // Avoid division by zero

  return {
    breakdown,
    percentages: {
      5: Math.round((breakdown[5] / total) * 100),
      4: Math.round((breakdown[4] / total) * 100),
      3: Math.round((breakdown[3] / total) * 100),
      2: Math.round((breakdown[2] / total) * 100),
      1: Math.round((breakdown[1] / total) * 100),
    },
  };
}