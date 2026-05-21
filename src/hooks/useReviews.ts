'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Review } from '@/types';

export interface ReviewWithBuyer extends Review {
  buyer?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface RatingBreakdown {
  breakdown: { [key: number]: number };
  percentages: { [key: number]: number };
}

export function useProductReviews(productId?: string) {
  const [reviews, setReviews] = useState<ReviewWithBuyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [breakdown, setBreakdown] = useState<RatingBreakdown | null>(null);

  const limit = 10;

  const fetchReviews = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * limit;
      const response = await fetch(
        `/api/reviews/product/${productId}?limit=${limit}&offset=${offset}&sort=${sort}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setBreakdown(data.breakdown || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, page, sort]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (rating: number, comment?: string) => {
      if (!productId) throw new Error('Product ID is required');

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await createClient().auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ productId, rating, comment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const newReview = await response.json();
      setReviews(prev => [newReview, ...prev]);
      setTotal(prev => prev + 1);
      return newReview;
    },
    [productId]
  );

  const hasMorePages = (page * limit) < total;

  return {
    reviews,
    loading,
    error,
    total,
    page,
    sort,
    breakdown,
    setPage,
    setSort,
    hasMorePages,
    submitReview,
    refresh: fetchReviews,
  };
}