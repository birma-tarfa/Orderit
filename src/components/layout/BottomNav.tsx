'use client';

import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, ShoppingCart, MessageSquare, User, Package, ShoppingBag } from "lucide-react";

export function BottomNav() {
  const { user, profile } = useAuthStore();
  const cartCount = useCartStore((state) => state.items.length);
  const pathname = usePathname();

  if (!user) return null;

  const isBuyer = user.role === "buyer";
  const isVendor = user.role === "vendor";

  const buyerTabs = [
    { icon: Home, label: "Home", href: "/marketplace", color: "text-blue-600" },
    { icon: Search, label: "Search", href: "/marketplace/search", color: "text-purple-600" },
    { icon: ShoppingCart, label: "Cart", href: "/cart", color: "text-orange-600", badge: cartCount },
    { icon: MessageSquare, label: "Messages", href: "/messages", color: "text-green-600" },
    { icon: User, label: "Profile", href: "/buyer/profile", color: "text-pink-600" },
  ];

  const vendorTabs = [
    { icon: Home, label: "Dashboard", href: "/vendor/dashboard", color: "text-blue-600" },
    { icon: Package, label: "Products", href: "/vendor/products", color: "text-purple-600" },
    { icon: ShoppingBag, label: "Orders", href: "/vendor/orders", color: "text-orange-600" },
    { icon: MessageSquare, label: "Messages", href: "/messages", color: "text-green-600" },
    { icon: ShoppingBag, label: "My Store", href: profile?.id ? `/vendor/${profile.id}/store` : "#", color: "text-pink-600" },
  ];

  const tabs = isBuyer ? buyerTabs : vendorTabs;

  const isActive = (href: string) => {
    if (href === "/marketplace" || href === "/marketplace/search") {
      return pathname?.startsWith("/marketplace") && pathname !== "/marketplace/search" && href === "/marketplace";
    }
    if (href === "/marketplace/search") {
      return pathname?.startsWith("/marketplace/search");
    }
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white md:hidden" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}>
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors ${
                active ? "text-[#1a7a4a]" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[0.65rem] font-bold text-white">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>
              <span className="line-clamp-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
