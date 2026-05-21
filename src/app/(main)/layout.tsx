import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "FreshDrop",
};

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl flex-col px-4 py-6 sm:px-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
