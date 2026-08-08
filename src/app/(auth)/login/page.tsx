'use client';

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast, Toaster } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    try {
      await signIn(email, password);
      toast.success("Welcome back to Tradeloft!");
      router.refresh();
      router.push("/marketplace");
    } catch (error: any) {
      toast.error(error.message ?? "Unable to sign in. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(26,122,74,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),transparent_30%),#f8fafc]">
      <Toaster position="top-right" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mb-10 max-w-2xl rounded-[2rem] border border-white/60 bg-white/90 p-10 shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-900">
              Tradeloft
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Welcome back
            </h1>
            <p className="mx-auto max-w-xl text-sm text-slate-600 sm:text-base">
              Sign in to shop or manage your store.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <a href="/forgot-password" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
                Forgot password?
              </a>
              <Button type="submit" className="min-w-[150px] bg-[#1a7a4a] hover:bg-emerald-700">
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
            New to Tradeloft? <a href="/register" className="font-semibold text-emerald-800 hover:text-emerald-900">Create an account</a>
          </div>
        </div>
      </div>
    </main>
  );
}
