'use client';

import { useState, useEffect } from 'react';
import { MessageVendorButton } from '@/components/messaging/MessageVendorButton';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Star, ShoppingCart, MessageSquare, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, getCurrencyOption } from '@/constants';
import { useCurrencyStore } from '@/store/currencyStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ProductReviewsSection } from '@/components/product/ProductReviewsSection';
import Script from 'next/script';
import { Product as GlobalProduct } from '@/types';

interface ProductWithVendor extends GlobalProduct {
  vendor: {
    id: string;
    userId: string;
    shop_name: string;
    rating: number;
    total_sales: number;
    created_at: string;
    is_verified: boolean;
  };
  category: {
    name: string;
  };
  updated_at: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const supabase = createClient();

  const [product, setProduct] = useState<ProductWithVendor | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductWithVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  const currency = getCurrencyOption(useCurrencyStore((state) => state.currency));
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // Fetch product with joined vendor and category in one request
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, vendor:vendor_profiles(*), category:categories(name)')
          .eq('id', productId)
          .eq('is_active', true)
          .single();

        if (productError || !productData) {
          setProduct(null);
          return;
        }

        setProduct({
          ...productData,
          created_at: new Date(productData.created_at),
          // Ensure fallback objects match the interface to prevent runtime errors
          vendor: productData.vendor
            ? {
                ...productData.vendor,
                userId: productData.vendor.user_id || '',
              }
            : {
                id: '',
                userId: '',
                shop_name: 'Unknown',
                rating: 0,
                total_sales: 0,
                created_at: '',
                is_verified: false,
              },
          category: productData.category || { name: 'Uncategorized' },
        });
        setMainImage(0);

        // Fetch related products (same category, different vendor)
        if (productData.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select('*, vendor:vendor_profiles(id, shop_name, rating, is_verified), category:categories(name)')
            .eq('category_id', productData.category_id)
            .eq('is_active', true)
            .neq('id', productId)
            .limit(6);

          if (related && related.length > 0) {
            const enrichedRelated = related.map((p: any) => ({
              ...p,
              created_at: new Date(p.created_at),
              vendor: p.vendor || { shop_name: 'Unknown Vendor' },
              category: p.category || { name: 'Uncategorized' },
            }));
            setRelatedProducts(enrichedRelated);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, supabase]);

  const handleAddToCart = async () => {
    if (product) {
      // Update local Zustand state for immediate UI feedback
      addItem({
        id: product.id,
        product,
        quantity,
        vendor: {
          id: product.vendor.id,
          shop_name: product.vendor.shop_name,
        },
      });

      // If user is logged in, sync to the database
      if (user) {
        try {
          const { error } = await supabase
            .from('cart_items')
            .upsert({
              user_id: user.id,
              product_id: product.id,
              vendor_id: product.vendor.id, // Ensure we use the joined vendor id
              quantity: quantity,
            }, { onConflict: 'user_id,product_id' });

          if (error) throw error;
        } catch (err) {
          console.error('Failed to sync cart to database:', err);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Product Not Found</h1>
        <p className="mt-2 text-slate-600">This product may have been removed or is no longer available.</p>
        <Link href="/marketplace">
          <Button className="mt-4">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : null;
  const isOwner = !!user && user.id === product.vendor_id;

  return (
    <div className="space-y-8">
      {/* Main Product Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100">
            {product.images[mainImage] ? (
              <Image
                src={product.images[mainImage]}
                alt={product.name}
                fill // Removed duplicate className
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No Image</div>
            )}
            {discount && (
              <Badge className="absolute left-4 top-4 bg-red-500">-{discount}%</Badge>
            )}
            {product.stock_quantity === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-2xl font-bold text-white">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(idx)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    mainImage === idx ? 'border-emerald-600' : 'border-slate-200'
                  } `}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${idx + 1}`}
                    fill // Removed duplicate className
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Category Badge */}
          {product.category?.name && (
            <Badge className="w-fit border border-slate-200 bg-transparent text-slate-600">{product.category.name}</Badge>
          )}

          {/* Title and Vendor */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
            <Link
              href={`/vendor/${product.vendor.id}`}
              className="mt-2 text-emerald-600 hover:underline"
            >
              {product.vendor.shop_name}
              {product.vendor.is_verified && <Badge className="ml-2 bg-blue-100 text-blue-800">Verified</Badge>}
            </Link>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-slate-600">({product.review_count} reviews)</span>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">
                {formatCurrency(product.price, currency.code, currency.locale)}
              </span>
              {product.compare_price && (
                <span className="text-lg text-slate-400 line-through">
                  {formatCurrency(product.compare_price, currency.code, currency.locale)}
                </span>
              )}
            </div>
            {product.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {product.stock_quantity > 0 ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600">
                  {product.stock_quantity} in stock
                </span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-600">Out of Stock</span>
              </>
            )}
          </div>

          {!isOwner ? (
            <>
              {product.stock_quantity > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Quantity:</label>
                    <div className="flex items-center rounded-lg border border-slate-300">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 hover:bg-slate-100"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 border-l border-r border-slate-300 px-2 py-2 text-center focus:outline-none"
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                        className="px-3 py-2 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button className="w-full" onClick={handleAddToCart}>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Order Now
                    </Button>
                    <Button className="w-full border border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50">
                      Buy Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Secondary Buttons */}
              <div className="flex gap-2 border-t border-slate-200 pt-4">
                <MessageVendorButton
                  vendorUserId={product.vendor.userId}
                  vendorName={product.vendor.shop_name}
                  className="flex-1"
                />
                <Button className="flex-1 border border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50">
                  <Heart className="mr-2 h-4 w-4" />
                  Wishlist
                </Button>
                <Button className="flex-1 border border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-sm font-medium text-emerald-800">This is your product listing.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/vendor/products/${product.id}/edit`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Edit Product
                </Link>
                <Link
                  href="/vendor/products"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Manage Listings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-b border-slate-200">
        <div className="flex gap-8 overflow-x-auto">
          {['description', 'reviews', 'vendor'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-4 font-medium capitalize transition ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'description' ? 'Description' : tab === 'reviews' ? 'Reviews' : 'Vendor Info'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="max-w-3xl space-y-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
              {product.description || 'No description available.'}
            </div>
            {product.sku && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-600">
                  <strong>SKU:</strong> {product.sku}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            avgRating={product.rating}
            reviewCount={product.review_count}
          />
        )}

        {/* Vendor Info Tab */}
        {activeTab === 'vendor' && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-lg border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{product.vendor.shop_name}</h3>
                    {product.vendor.is_verified && (
                      <Badge className="mt-2 bg-blue-100 text-blue-800">Verified Seller</Badge>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-slate-600">Seller Rating</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{product.vendor.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Total Sales</p>
                      <p className="mt-1 font-semibold">{product.vendor.total_sales}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Member Since</p>
                      <p className="mt-1 font-semibold">
                        {new Date(product.vendor.created_at).getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-slate-200 pt-6">
                <Link href={`/vendor/${product.vendor.id}`}>
                  <Button className="w-full border border-slate-200 bg-transparent text-slate-900 hover:bg-slate-50">
                    {isOwner ? (
                      <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-medium text-emerald-800">This is your product listing.</p>
                        <div className="flex gap-2">
                          <Link href={`/vendor/products/${product.id}/edit`} className="flex-1">
                            <Button className="w-full">Edit Product</Button>
                          </Link>
                          <Button variant="outline" className="flex-1">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Quantity Selector */}
                        {product.stock_quantity > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <label className="text-sm font-medium">Quantity:</label>
                              <div className="flex items-center rounded-lg border border-slate-300">
                                <button
                                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                  className="px-3 py-2 hover:bg-slate-100"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={quantity}
                                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="w-16 border-l border-r border-slate-300 px-2 py-2 text-center focus:outline-none"
                                />
                                <button
                                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                  className="px-3 py-2 hover:bg-slate-100"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              <Button className="w-full" onClick={handleAddToCart}>
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Order Now
                              </Button>
                              <Button variant="outline" className="w-full">
                                Buy Now
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Secondary Buttons */}
                        <div className="flex gap-2 border-t border-slate-200 pt-4">
                          <MessageVendorButton
                            vendorUserId={product.vendor.userId}
                            vendorName={product.vendor.shop_name}
                            className="flex-1"
                          />
                          <Button variant="outline" className="flex-1">
                            <Heart className="mr-2 h-4 w-4" />
                            Wishlist
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </div>
                      </>
                    )}
                  </Button>
                </Link>

                {/* Structured data JSON-LD */}
                <Script id="product-json-ld" type="application/ld+json">
                  {JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: product.name,
                    image: product.images,
                    description: product.description,
                    sku: product.sku,
                    brand: {
                      '@type': 'Brand',
                      name: product.vendor.shop_name,
                    },
                    offers: {
                      '@type': 'Offer',
                      url: typeof window !== 'undefined' ? window.location.href : '',
                      priceCurrency: currency.code,
                      price: product.price,
                      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                      seller: {
                        '@type': 'Organization',
                        name: product.vendor.shop_name,
                      },
                    },
                    aggregateRating: {
                      '@type': 'AggregateRating',
                      ratingValue: product.rating,
                      reviewCount: product.review_count,
                    },
                  })}
                </Script>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
