"use client";

import Link from "next/link";
import { useState } from "react";
import { statusLabel, statusColor } from "@/lib/order-status";

interface Order {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  vendor: {
    shop_name?: string;
    logo_url?: string;
  };
  order_items: {
    product_name: string;
    product_image?: string;
  }[];
}

export function BuyerOrdersPage({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Your Orders</h1>
            <p className="mt-2 text-sm text-slate-600">Review all your orders and track their progress.</p>
          </div>
          <Link href="/marketplace" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Continue Shopping
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600">
          <p className="text-xl font-semibold text-slate-900">No orders yet</p>
          <p className="mt-2">Your completed purchases will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderRowWithCode key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Main row */}
      <div className="px-4 py-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-6 sm:items-center">
          <div>
            <p className="text-sm font-medium text-slate-500">Order</p>
            <p className="text-slate-900">#{order.id.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Vendor</p>
            <p className="text-slate-900">{order.vendor?.shop_name || "Unknown Vendor"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Items</p>
            <p className="text-slate-900">{order.order_items?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total</p>
            <p className="text-slate-900">₦{Number(order.total).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Status</p>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(order.status)}`}
            >
              {statusLabel(order.status)}
            </span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <p className="text-sm text-slate-600">
              {new Date(order.created_at).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRowWithCode({ order }: { order: Order }) {
  return <OrderRow order={order} />;
}
