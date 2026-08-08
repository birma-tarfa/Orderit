"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function DeliveryCodeBox({
  code,
  isUsed,
}: {
  code: string | null;
  isUsed: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  // Show "Code already used" if delivery was completed
  if (isUsed) {
    return (
      <div className="mt-4 rounded-2xl bg-emerald-50 px-6 py-4">
        <p className="flex items-center gap-2 text-lg font-semibold text-emerald-700">
          <span>✓</span> Code already used - Order delivered
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Button to reveal code */}
      <div className="mt-4">
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700"
        >
          🔐 Get Delivery Code
        </Button>
      </div>

      {/* Modal overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
            {/* Code Display */}
            <div className="mb-8 rounded-2xl bg-emerald-50 p-6 text-center">
              <p className="mb-4 text-sm font-medium text-emerald-700">Your Delivery Code</p>
              <p className="text-5xl font-bold tracking-widest text-emerald-900">
                {code.split("").join(" ")}
              </p>
            </div>

            {/* Warning */}
            <div className="mb-6 rounded-lg bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">
                ⚠️ Only share this when your rider arrives
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={copy}
                className="flex-1 rounded-full bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                {copied ? "✓ Copied" : "📋 Copy Code"}
              </Button>
              <Button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-full border-2 border-slate-200 bg-white px-4 py-2 text-slate-900 hover:bg-slate-50"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
