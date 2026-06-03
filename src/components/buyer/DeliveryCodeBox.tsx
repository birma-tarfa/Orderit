"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function DeliveryCodeBox({ code }: { code: string | null }) {
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

  return (
    <div className="mt-4 flex items-center gap-4">
      <div className="rounded-2xl bg-emerald-50 px-6 py-4 text-center">
        <p className="text-sm font-medium text-emerald-700">Your Delivery Code</p>
        <p className="mt-2 text-3xl font-bold tracking-widest text-emerald-900">{code}</p>
        <p className="mt-2 text-xs text-emerald-700">Give this code to your rider when they deliver</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button onClick={copy} className="rounded-full bg-emerald-600 px-4 py-2 text-white">
          {copied ? "Copied" : "Copy code"}
        </Button>
        <p className="text-xs text-slate-600">Do not share this code until your order arrives.</p>
      </div>
    </div>
  );
}
