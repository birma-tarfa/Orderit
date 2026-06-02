'use client';

import Image from 'next/image';
import { Star, MapPin, Calendar, Package, MessageSquare, Heart, Share2, Clock, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { VendorProfile } from '@/types';

interface StorefrontHeaderProps {
  vendor: VendorProfile & {
    total_products: number;
    total_sales: number;
    rating: number;
    review_count: number;
    location?: string;
    created_at: string;
    is_verified: boolean;
  };
}

interface StorefrontHeaderPropsWithOwner extends StorefrontHeaderProps {
  isOwner?: boolean;
}

export function StorefrontHeader({ vendor, isOwner }: StorefrontHeaderPropsWithOwner) {
  return (
    <div className="space-y-6">
      {/* Banner Image */}
      <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-slate-100 md:h-80">
        {vendor.banner_url ? (
          <Image
            src={vendor.banner_url}
            alt={`${vendor.shop_name} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-r from-emerald-400 to-emerald-600">
            <Package className="h-24 w-24 text-white" />
          </div>
        )}
        {/* no floating owner overlay to avoid overlapping badge */}
        {vendor.is_verified && (
          <Badge className="absolute right-6 top-6 bg-blue-100 text-blue-800">
            Open Now
          </Badge>
        )}
      </div>

      {/* Vendor Info Row */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg">
            {vendor.logo_url ? (
              <Image
                src={vendor.logo_url}
                alt={`${vendor.shop_name} logo`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-emerald-100 text-emerald-600">
                <Package className="h-12 w-12" />
              </div>
            )}
            {isOwner ? (
              <a
                href="/vendor/settings#branding"
                className="absolute right-0 bottom-0 hidden translate-y-6 translate-x-6 items-center gap-2 rounded-full bg-white/90 p-2 text-sm text-slate-700 shadow hover:bg-white md:flex"
                title="Edit logo"
              >
                <Edit3 className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          {/* Vendor Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{vendor.shop_name}</h1>
              {vendor.is_verified && (
                <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {vendor.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Member since {new Date(vendor.created_at).getFullYear()}</span>
              </div>

              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span>{vendor.rating.toFixed(1)} ({vendor.review_count} reviews)</span>
              </div>

              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{vendor.total_products} menu items</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Delivery estimate 30-45 mins</span>
              </div>
            </div>

            {vendor.shop_description && (
              <p className="max-w-2xl text-slate-700">{vendor.shop_description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons: if owner show Edit/Add, else show Message/Follow. Share always visible */}
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:gap-3">
          <div className="flex flex-wrap gap-3">
            {isOwner ? (
              <>
                <a href="/vendor/settings" className="">
                  <Button>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Store
                  </Button>
                </a>
                <a href="/vendor/products/new">
                  <Button>
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </a>
              </>
            ) : (
              <>
                <Button variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Vendor
                </Button>
                <Button variant="outline">
                  <Heart className="mr-2 h-4 w-4" />
                  Follow
                </Button>
              </>
            )}
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}