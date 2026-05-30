'use client';

import { useState, useEffect } from 'react';
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

interface ProductWithVendor extends Product {
  vendor: {
    id: string;
    shop_name: string;
    rating: number;
    total_sales: number;
    created_at: string;
    is_verified: boolean;
  };
  category: {
    name: string;
  };
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

        // Fetch product details without relationship hints
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .eq('is_active', true)
          .single();

        if (productError || !productData) {
          setProduct(null);
          return;
        }

        // Fetch vendor details for this product
        const { data: vendor } = await supabase
          .from('users')
          .select('id,full_name,shop_name,rating,total_sales,created_at,is_verified')
          .eq('id', productData.vendor_id)
          .single();

        // Fetch category details for this product
        const { data: category } = await supabase
          .from('categories')
          .select('name')
          .eq('id', productData.category_id)
          .single();

        const enrichedProduct = {
          ...productData,
          vendor: vendor || {},
          category: category || {},
        };

        setProduct(enrichedProduct);
        setMainImage(0);

        // Fetch related products (same category, different vendor)
        if (productData.category_id) {
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', productData.category_id)
            .eq('is_active', true)
            .neq('id', productId)
            .limit(6);

          if (related && related.length > 0) {
            // Batch fetch vendors for related products
            const relatedVendorIds = [...new Set(related.map(p => p.vendor_id))];
            const { data: relatedVendors } = await supabase
              .from('users')
              .select('id,full_name,shop_name,rating,total_sales,created_at,is_verified')
              .in('id', relatedVendorIds);

            const vendorsById = (relatedVendors || []).reduce((acc: any, v: any) => {
              acc[v.id] = v;
              return acc;
            }, {});

            // Batch fetch categories for related products
            const relatedCategoryIds = [...new Set(related.map(p => p.category_id).filter(Boolean))];
            const { data: relatedCategories } = relatedCategoryIds.length
              ? await supabase
                  .from('categories')
                  .select('id,name')
                  .in('id', relatedCategoryIds)
              : { data: [] };

            const categoriesById = (relatedCategories || []).reduce((acc: any, c: any) => {
              acc[c.id] = c;
              return acc;
            }, {});

            const enrichedRelated = related.map((p: any) => ({
              ...p,
              vendor: vendorsById[p.vendor_id] || {},
              category: categoriesById[p.category_id] || {},
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

  const handleAddToCart = () => {
    if (product) {
      addItem({
        id: product.id,
        product,
        quantity,
      });
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
                fill
                className="object-cover"
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
                    fill
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
          {product.category && (
            <Badge variant="outline" className="w-fit">{product.category.name}</Badge>
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
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">Prep {product.preparation_time} mins</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{product.spice_level}</span>
              {product.is_available_today ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Available today</span>
              ) : (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Not available today</span>
              )}
            </div>
            {product.dietary_tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {product.dietary_tags.map((tag) => (
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
            <Button variant="outline" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Vendor
            </Button>
            <Button variant="outline" className="flex-1">
              <Heart className="mr-2 h-4 w-4" />
              Wishlist
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
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
                  <Button variant="outline" className="w-full">
                    View Menu
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-slate-200 pt-8">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">Related Products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`}>
                <div className="group cursor-pointer space-y-3 rounded-lg border border-slate-200 p-4 hover:border-emerald-300 hover:shadow-lg transition">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                    {relatedProduct.images[0] ? (
                      <Image
                        src={relatedProduct.images[0]}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">No Image</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold line-clamp-2">{relatedProduct.name}</h3>
                    <p className="text-sm text-slate-600">{relatedProduct.vendor.shop_name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(relatedProduct.price, currency.code, currency.locale)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-slate-600">{relatedProduct.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
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
            review: reviews.map((review) => ({
              '@type': 'Review',
              reviewRating: {
                '@type': 'Rating',
                ratingValue: review.rating,
              },
              author: {
                '@type': 'Person',
                name: review.buyer.full_name,
              },
            })),
          }),
        }}
      />
    </div>
  );
}
