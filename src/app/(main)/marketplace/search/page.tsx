'use client';

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from 'next/link';
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, X, ChevronDown, ChevronUp, Star } from "lucide-react";
import { getCurrencyOption, LOCATIONS, formatCurrency } from "@/constants";
import { useCurrencyStore } from "@/store/currencyStore";
import type { Product, Category } from "@/types";

interface SearchFilters {
  q: string;
  category: string[];
  minPrice: string;
  maxPrice: string;
  state: string;
  rating: string;
  inStock: boolean;
  sort: string;
  page: number;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Best Rated' },
];

const ITEMS_PER_PAGE = 12;

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || '',
    category: searchParams.get('category')?.split(',') || [],
    minPrice: searchParams.get('min') || '',
    maxPrice: searchParams.get('max') || '',
    state: searchParams.get('state') || '',
    rating: searchParams.get('rating') || '',
    inStock: searchParams.get('inStock') === 'true',
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page') || '1'),
  });

  const [products, setProducts] = useState<(Product & { vendor: { full_name: string } })[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const currencyCode = useCurrencyStore((state) => state.currency);
  const currency = getCurrencyOption(currencyCode);

  // Update URL when filters change
  const updateURL = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters };
    const params = new URLSearchParams();

    if (updated.q) params.set('q', updated.q);
    if (updated.category.length > 0) params.set('category', updated.category.join(','));
    if (updated.minPrice) params.set('min', updated.minPrice);
    if (updated.maxPrice) params.set('max', updated.maxPrice);
    if (updated.state) params.set('state', updated.state);
    if (updated.rating) params.set('rating', updated.rating);
    if (updated.inStock) params.set('inStock', updated.inStock.toString());
    if (updated.sort !== 'relevance') params.set('sort', updated.sort);
    if (updated.page > 1) params.set('page', updated.page.toString());

    router.push(`/marketplace/search?${params.toString()}`);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // If URL provided category names (from homepage links), map them to IDs once categories load
  useEffect(() => {
    if (categories.length === 0) return;
    if (!filters.category || filters.category.length === 0) return;

    const needsMapping = filters.category.some((c) => !c.includes('-'));
    if (!needsMapping) return;

    const mapped = filters.category.map((c) => {
      const found = categories.find((cat) => cat.name === c);
      return found ? found.id : c;
    }).filter(Boolean);

    if (JSON.stringify(mapped) !== JSON.stringify(filters.category)) {
      const newFilters = { ...filters, category: mapped };
      setFilters(newFilters);
      updateURL(newFilters);
    }
  }, [categories]);

  // Fetch products based on filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      // Fetch vendors if no category filter
      if (!filters.category || filters.category.length === 0) {
        let vendorQuery = supabase
          .from('vendor_profiles')
          .select('id, user_id, shop_name, shop_description, logo_url, rating, total_sales, is_verified');

        if (filters.q) {
          vendorQuery = vendorQuery.ilike('shop_name', `%${filters.q}%`);
        }

        const { data: vendorData } = await vendorQuery.limit(6);
        setVendors(vendorData || []);
      } else {
        setVendors([]);
      }

      let query = supabase
        .from('products')
        .select(`
          *, vendor:vendor_profiles(shop_name, logo_url), category:categories(id,name)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Text search
      if (filters.q) {
        query = query.or(`name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
      }

      // Category filter
      if (filters.category.length > 0) {
        query = query.in('category_id', filters.category);
      }

      // Price range
      if (filters.minPrice) {
        query = query.gte('price', parseInt(filters.minPrice));
      }
      if (filters.maxPrice) {
        query = query.lte('price', parseInt(filters.maxPrice));
      }

      // Rating filter
      if (filters.rating) {
        query = query.gte('rating', parseInt(filters.rating));
      }

      // In stock filter
      if (filters.inStock) {
        query = query.gt('stock_quantity', 0);
      }

      // Sorting
      switch (filters.sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        default:
          // Relevance - order by rating then created_at
          query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
      }

      // Pagination
      const from = (filters.page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setTotalCount(0);
      } else {
        // Fetch vendor details for all products
        if (data && data.length > 0) {
          // The select includes vendor:vendor_profiles and category relation. Normalize vendor.full_name
          const normalized = data.map((p: any) => {
            const vendor = p.vendor || {};
            const vendorName = vendor.shop_name || vendor.full_name || 'Unknown';
            return {
              ...p,
              vendor: { full_name: vendorName, logo_url: vendor.logo_url },
            };
          });
          setProducts(normalized);
        } else {
          setProducts([]);
        }
        setTotalCount(count || 0);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 }; // Reset to page 1 on filter change
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      q: '',
      category: [],
      minPrice: '',
      maxPrice: '',
      state: '',
      rating: '',
      inStock: false,
      sort: 'relevance',
      page: 1,
    };
    setFilters(clearedFilters);
    updateURL(clearedFilters);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = (filters.page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(filters.page * ITEMS_PER_PAGE, totalCount);

  return (
    <div className="flex gap-8">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          onClick={() => setShowMobileFilters(true)}
          className="mb-4 w-full"
          variant="outline"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 transform bg-white p-6 shadow-lg transition-transform lg:static lg:inset-auto lg:w-64 lg:translate-x-0 lg:shadow-none lg:p-0 ${
        showMobileFilters ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-lg font-semibold">Filters</h2>
          <Button
            onClick={() => setShowMobileFilters(false)}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-6 lg:mt-0">
          {/* Clear Filters */}
          <Button onClick={clearFilters} variant="outline" className="w-full">
            Clear All Filters
          </Button>

          {/* Categories */}
          <div>
            <h3 className="mb-3 font-medium">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.category.includes(category.id)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...filters.category, category.id]
                        : filters.category.filter(id => id !== category.id);
                      handleFilterChange('category', newCategories);
                    }}
                    className="mr-2"
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="mb-3 font-medium">Price Range ({currency.symbol})</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full"
              />
            </div>
          </div>


          {/* Location */}
          <div>
            <h3 className="mb-3 font-medium">Location</h3>
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">All States</option>
              {LOCATIONS.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <h3 className="mb-3 font-medium">Minimum Rating</h3>
            <div className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={filters.rating === rating.toString()}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="mr-2"
                  />
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                  <span className="ml-2">& Up</span>
                </label>
              ))}
            </div>
          </div>

          {/* In Stock */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                className="mr-2"
              />
              In Stock Only
            </label>
          </div>
        </div>
      </aside>

      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {filters.q ? `Search results for "${filters.q}"` : 'All Products'}
            </h1>
            <p className="text-slate-600">
              {loading ? 'Loading...' : `Showing ${startItem}-${endItem} of ${totalCount} results`}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Sort by:</span>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.category.length > 0 || filters.minPrice || filters.maxPrice || filters.state || filters.rating || filters.inStock) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.category.map((catId) => {
              const category = categories.find(c => c.id === catId);
              return category ? (
                <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                  {category.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('category', filters.category.filter(id => id !== catId))}
                  />
                </Badge>
              ) : null;
            })}
            {filters.minPrice && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Min: {formatCurrency(parseInt(filters.minPrice), currency.code, currency.locale)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('minPrice', '')}
                />
              </Badge>
            )}
            {filters.maxPrice && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Max: {formatCurrency(parseInt(filters.maxPrice), currency.code, currency.locale)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('maxPrice', '')}
                />
              </Badge>
            )}
            {filters.state && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.state}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('state', '')}
                />
              </Badge>
            )}
            {filters.rating && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.rating}+ Stars
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('rating', '')}
                />
              </Badge>
            )}
            {filters.inStock && (
              <Badge variant="secondary" className="flex items-center gap-1">
                In Stock
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('inStock', false)}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Products Grid */}
        {/* Vendors Section */}
        {!loading && vendors.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">Vendors</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((vendor) => (
                <Link key={vendor.id} href={`/vendor/${vendor.id}/store`}>
                  <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg">
                    <div className="flex items-start gap-4">
                      {vendor.logo_url && (
                        <img
                          src={vendor.logo_url}
                          alt={vendor.shop_name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{vendor.shop_name}</h3>
                          {vendor.is_verified && (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {vendor.total_sales} sales
                        </p>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-medium text-slate-900">
                            {vendor.rating.toFixed(1)}
                          </span>
                        </div>
                        {vendor.shop_description && (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                            {vendor.shop_description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Products Header */}
        {products.length > 0 && vendors.length > 0 && (
          <h2 className="mb-6 text-2xl font-semibold">Products</h2>
        )}

        {/* Products Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
          }
        </div>

        {/* No Results */}
        {!loading && products.length === 0 && vendors.length === 0 && (
          <div className="py-12 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No results found</h3>
            <p className="mt-2 text-slate-600">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <Button
                onClick={() => handleFilterChange('page', filters.page - 1)}
                disabled={filters.page === 1}
                variant="outline"
              >
                Previous
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, filters.page - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    onClick={() => handleFilterChange('page', pageNum)}
                    variant={pageNum === filters.page ? "default" : "outline"}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                onClick={() => handleFilterChange('page', filters.page + 1)}
                disabled={filters.page === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}