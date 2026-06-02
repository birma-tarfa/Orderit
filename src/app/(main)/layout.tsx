'use client';

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  const showFooter = !user;
  const showBottomNav = !!user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl flex-col px-4 py-6 sm:px-6 pb-16 md:pb-0">
        {children}
      </main>
      {showFooter && <Footer />}
      {showBottomNav && <BottomNav />}
    </div>
  );
}
