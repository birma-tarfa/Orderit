import Link from "next/link";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Start Selling on Tradeloft", href: "/sell" },
  { label: "Help Center", href: "/help" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Tradeloft</h2>
            <p className="max-w-lg text-sm text-slate-400">
              Shop anything from verified local vendors with secure payments and fast delivery.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
              <Link href="/sell" className="hover:text-white">Start Selling on Tradeloft</Link>
              <Link href="/help" className="hover:text-white">Help Center</Link>
            </div>
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Connect</p>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <a href="#" className="rounded-2xl bg-slate-800 px-4 py-3 hover:bg-slate-700">Facebook</a>
              <a href="#" className="rounded-2xl bg-slate-800 px-4 py-3 hover:bg-slate-700">Instagram</a>
              <a href="#" className="rounded-2xl bg-slate-800 px-4 py-3 hover:bg-slate-700">Twitter</a>
            </div>
          </div>

          <div className="grid gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Payments</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">Paystack</div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">Flutterwave</div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">Visa</div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">Mastercard</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">Made with <span className="text-emerald-400">❤️</span> for sellers and buyers worldwide</p>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Tradeloft. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
