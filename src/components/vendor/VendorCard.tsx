'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, Package, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { VendorProfile } from '@/types';

interface VendorCardProps {
  vendor: VendorProfile & {
    total_products?: number;
    total_sales?: number;
    rating: number;
    review_count?: number;
    location?: string;
    created_at: string;
    is_verified: boolean;
    user?: { full_name: string };
    _count?: { products: number };
  };
  showFollowButton?: boolean;
}

export function VendorCard({ vendor, showFollowButton = true }: VendorCardProps) {
  const shopName = vendor.shop_name || 'Vendor Store';
  const totalProducts = vendor.total_products || vendor._count?.products || 0;
  const reviewCount = vendor.review_count || 0;
  const vendorLocation = vendor.location || '';
  const isVerified = vendor.is_verified || false;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
      {/* Banner Image */}
      <div className="relative h-32 overflow-hidden bg-slate-100">
        {vendor.banner_url ? (
          <Image
            src={vendor.banner_url}
            alt={`${shopName} banner`}
            fill
            className="object-cover group-hover:scale-105 transition"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-r from-emerald-400 to-emerald-600">
            <Package className="h-12 w-24 text-white" />
          </div>
        )}
        {isVerified && (
          <Badge className="absolute right-4 top-4 bg-blue-100 text-blue-800">
            Verified
          </Badge>
        )}
      </div>

      {/* Vendor Info */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-sm">
            {vendor.logo_url ? (
              <Image
                src={vendor.logo_url}
                alt={`${shopName} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-emerald-100 text-emerald-600">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <Link href={`/vendor/${vendor.id}/store`}>
              <h3 className="text-lg font-semibold text-slate-900 hover:text-emerald-600 transition">
                {shopName}
              </h3>
            </Link>

            {vendorLocation && (
              <div className="flex items-center gap-1 mt-1 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                <span>{vendorLocation}</span>
              </div>
            )}

            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{vendor.rating.toFixed(1)}</span>
                <span>({reviewCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{totalProducts} menu items</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>Fast delivery across Lagos</span>
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
              {vendor.shop_description || 'Quality products from a trusted seller.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Link href={`/vendor/${vendor.id}/store`} className="flex-1">
            <Button className="w-full">View Menu</Button>
          </Link>
          {showFollowButton && (
            <Button variant="outline" className="flex-1">
              <Heart className="mr-2 h-4 w-4" />
              Follow
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
