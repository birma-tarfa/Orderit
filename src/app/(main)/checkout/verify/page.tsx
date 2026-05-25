'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      const gateway = searchParams.get('gateway');
      const reference = searchParams.get('reference');
      const orderIdParam = searchParams.get('orderId');

      setOrderId(orderIdParam);

      try {
        if (gateway === 'paystack' && reference) {
          const res = await fetch(`/api/payments/paystack/verify?reference=${reference}`);
          const data = await res.json();
          if (data.success) {
            setStatus('success');
            setTimeout(() => router.push(`/buyer/orders`), 3000);
          } else {
            setStatus('failed');
          }
        } else if (gateway === 'flutterwave') {
          const transactionId = searchParams.get('transaction_id');
          const res = await fetch(`/api/payments/flutterwave/verify?transaction_id=${transactionId}`);
          const data = await res.json();
          if (data.success) {
            setStatus('success');
            setTimeout(() => router.push(`/buyer/orders`), 3000);
          } else {
            setStatus('failed');
          }
        } else {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-[#1a7a4a] mx-auto" />
            <h1 className="text-2xl font-semibold text-slate-900">Verifying payment...</h1>
            <p className="text-slate-600">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-[#1a7a4a] mx-auto" />
            <h1 className="text-2xl font-semibold text-slate-900">Payment Successful! 🎉</h1>
            <p className="text-slate-600">Your order has been confirmed. Redirecting to your orders...</p>
            <Link href="/buyer/orders" className="inline-block mt-4 rounded-full bg-[#1a7a4a] px-6 py-2 text-white text-sm font-medium hover:bg-emerald-700">
              View My Orders
            </Link>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-semibold text-slate-900">Payment Failed</h1>
            <p className="text-slate-600">Something went wrong with your payment. Please try again.</p>
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/checkout" className="rounded-full border border-slate-300 px-6 py-2 text-sm font-medium hover:bg-slate-50">
                Try Again
              </Link>
              <Link href="/marketplace" className="rounded-full bg-[#1a7a4a] px-6 py-2 text-white text-sm font-medium hover:bg-emerald-700">
                Back to Marketplace
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
