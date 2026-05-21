import Link from "next/link";
import { Package, AlertTriangle, TrendingUp } from "lucide-react";

export function InventoryTable() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Inventory Overview</h3>
          <p className="mt-2 text-sm text-slate-600">Quick view of your stock levels.</p>
        </div>
        <Link
          href="/vendor/inventory"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-green-900">In Stock</div>
            <div className="text-lg font-semibold text-green-700">24</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-yellow-900">Low Stock</div>
            <div className="text-lg font-semibold text-yellow-700">3</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-red-900">Out of Stock</div>
            <div className="text-lg font-semibold text-red-700">1</div>
          </div>
        </div>
      </div>
    </section>
  );
}
