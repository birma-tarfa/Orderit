import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface VendorStoreLayoutProps {
  params: {
    vendorId: string;
  };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { vendorId: string } }): Promise<Metadata> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: vendor } = await supabase
      .from('users')
      .select('shop_name, shop_description, logo_url, banner_url')
      .eq('id', params.vendorId)
      .eq('role', 'vendor')
      .single();

    if (!vendor) {
      return {
        title: 'Store Not Found',
        description: 'This vendor store could not be found.',
      };
    }

    return {
      title: `${vendor.shop_name} | Tradeloft`,
      description: vendor.shop_description || `Shop at ${vendor.shop_name} on Tradeloft`,
      openGraph: {
        title: vendor.shop_name,
        description: vendor.shop_description || `Browse products from ${vendor.shop_name}`,
        images: vendor.banner_url ? [vendor.banner_url] : vendor.logo_url ? [vendor.logo_url] : [],
        type: 'website',
      },
      keywords: [
        vendor.shop_name,
        'vendor',
        'store',
        'marketplace',
        'products',
      ],
    };
  } catch {
    return {
      title: 'Vendor Store',
      description: 'Browse products from this vendor',
    };
  }
}

export async function generateStaticParams() {
  try {
    const supabase = createSupabaseServerClient();

    // Get top 50 vendors for ISR
    const { data: vendors } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'vendor')
      .order('total_sales', { ascending: false })
      .limit(50);

    if (!vendors) return [];

    return vendors.map((vendor) => ({
      vendorId: vendor.id,
    }));
  } catch {
    return [];
  }
}

export const revalidate = 3600; // ISR: revalidate every hour

export default function VendorStoreLayout({ children }: VendorStoreLayoutProps) {
  return <>{children}</>;
}