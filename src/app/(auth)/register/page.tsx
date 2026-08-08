'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast, Toaster } from "react-hot-toast";

type RegisterValues = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  shop_name?: string;
  shop_description?: string;
  location?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [activeRole, setActiveRole] = useState<"buyer" | "vendor">("buyer");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterValues>();

  const onSubmit = async (values: RegisterValues) => {
    if (values.password !== values.confirm_password) {
      setError("confirm_password", { message: "Passwords do not match" });
      return;
    }
    if (!values.phone.match(/^(\+234|0)[789][01]\d{8}$/)) {
      setError("phone", { message: "Invalid Nigerian phone number" });
      return;
    }
    if (activeRole === "vendor") {
      if (!values.shop_name || values.shop_name.length < 2) {
        setError("shop_name", { message: "Kitchen name is required" });
        return;
      }
      if (!values.shop_description || values.shop_description.length < 10) {
        setError("shop_description", { message: "Description must be at least 10 characters" });
        return;
      }
      if (!values.location) {
        setError("location", { message: "Please select your state" });
        return;
      }
    }
    try {
      await signUp(
        values.email,
        values.password,
        values.full_name,
        values.phone,
        activeRole,
        activeRole === "vendor"
          ? {
              shopName: values.shop_name!,
              shopDescription: values.shop_description!,
              location: values.location!,
            }
          : undefined
      );
      toast.success("Account created successfully.");
      router.push(activeRole === "vendor" ? "/vendor/onboarding" : "/marketplace");
    } catch (error: any) {
      toast.error(error.message ?? "Registration failed. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(26,122,74,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),transparent_35%),#f8fafc]">
      <Toaster position="top-right" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:px-8">
        <div className="grid gap-10 rounded-[2rem] bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-900">
                Tradeloft
              </p>
              <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
                Create your account
              </h1>
              <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
                Join thousands of buyers and vendors on Tradeloft.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "buyer",
                    title: "Buyer",
                    description: "Browse and order products",
                  },
                  {
                    value: "vendor",
                    title: "Vendor",
                    description: "Sell your products",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActiveRole(option.value)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      activeRole === option.value
                        ? "border-emerald-600 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-slate-900">
                      {option.title}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-5">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="text-sm font-medium text-slate-700">Full name</label>
                    <Input id="full_name" type="text" {...register("full_name", { required: "Full name is required" })} placeholder="John Doe" />
                    {errors.full_name && <p className="text-sm text-red-600">{errors.full_name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">Email address</label>
                    <Input id="email" type="email" {...register("email", { required: "Email is required" })} placeholder="you@example.com" />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone number</label>
                    <Input id="phone" type="tel" {...register("phone", { required: "Phone is required" })} placeholder="08012345678" />
                    {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
                  </div>

                  {activeRole === "vendor" && (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="shop_name" className="text-sm font-medium text-slate-700">Shop / business name</label>
                        <Input id="shop_name" type="text" {...register("shop_name")} placeholder="Ada's Boutique" />
                        {errors.shop_name && <p className="text-sm text-red-600">{errors.shop_name.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="shop_description" className="text-sm font-medium text-slate-700">Description</label>
                        <Input id="shop_description" type="text" {...register("shop_description")} placeholder="What do you sell?" />
                        {errors.shop_description && <p className="text-sm text-red-600">{errors.shop_description.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="location" className="text-sm font-medium text-slate-700">State / location</label>
                        <Input id="location" type="text" {...register("location")} placeholder="Lagos" />
                        {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                    <Input id="password" type="password" {...register("password", { required: "Password is required", minLength: { value: 8, message: "Minimum 8 characters" } })} placeholder="Create a password" />
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirm_password" className="text-sm font-medium text-slate-700">Confirm password</label>
                    <Input id="confirm_password" type="password" {...register("confirm_password", { required: "Please confirm your password" })} placeholder="Repeat password" />
                    {errors.confirm_password && <p className="text-sm text-red-600">{errors.confirm_password.message}</p>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Already registered?{" "}
                  <a href="/login" className="font-semibold text-emerald-800 hover:text-emerald-900">Sign in</a>
                </p>
                <Button className="bg-[#1a7a4a] hover:bg-emerald-700" type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-emerald-900 via-slate-900 to-[#0f4f36] p-8 text-white shadow-xl sm:p-12">
            <div className="space-y-6">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Tradeloft</p>
                <h2 className="mt-4 text-3xl font-semibold">Anything you need, from vendors you trust.</h2>
              </div>
              <ul className="space-y-4 text-sm leading-7 text-emerald-100">
                <li>• Shop from verified local vendors across every category.</li>
                <li>• Pay with Paystack or Flutterwave.</li>
                <li>• Track your order from vendor to door.</li>
              </ul>
              <p className="rounded-3xl bg-white/10 p-5 text-sm text-slate-200">
                Join thousands of Nigerians already shopping on Tradeloft.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
