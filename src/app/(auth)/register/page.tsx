'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast, Toaster } from "react-hot-toast";

const buyerSchema = z.object({
  role: z.literal("buyer"),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
  shop_name: z.string().optional(),
  shop_description: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const vendorSchema = z.object({
  role: z.literal("vendor"),
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(\+234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number"),
  shop_name: z.string().min(2, "Shop name is required"),
  shop_description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Please select your state"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

const registerSchema = z.discriminatedUnion("role", [buyerSchema, vendorSchema]);

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "vendor">("buyer");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "buyer",
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      shop_name: "",
      shop_description: "",
      location: "",
    } as any,
  });

  const role = watch("role");
  const activeRole = useMemo(() => role || selectedRole, [role, selectedRole]);

  const onSubmit = async (values: RegisterValues) => {
    try {
      await signUp(
        values.email,
        values.password,
        values.full_name,
        values.phone,
        values.role,
        values.role === "vendor"
          ? {
              shopName: values.shop_name!,
              shopDescription: values.shop_description!,
              location: values.location!,
            }
          : undefined
      );
      toast.success("Account created successfully.");
      router.push(values.role === "vendor" ? "/vendor/dashboard" : "/marketplace");
    } catch (error: any) {
      toast.error(error.message ?? "Registration failed. Please try again.");
    }
  };

  const chooseRole = (newRole: "buyer" | "vendor") => {
    setSelectedRole(newRole);
    setValue("role", newRole as any, { shouldDirty: true, shouldTouch: true });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(26,122,74,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),transparent_35%),#f8fafc]">
      <Toaster position="top-right" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-12 lg:px-8">
        <div className="grid gap-10 rounded-[2rem] bg-white/95 p-8 shadow-2xl backdrop-blur-xl sm:p-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div>
              <p className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-900">
                FreshDrop
              </p>
              <h1 className="mt-6 text-4xl font-semibold text-slate-900 sm:text-5xl">
                Create your account
              </h1>
              <p className="mt-4 max-w-xl text-sm text-slate-600 sm:text-base">
                Join thousands of Nigerian food lovers and food vendors on FreshDrop.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-wrap gap-3 rounded-full border border-slate-200 bg-slate-50 p-1 shadow-inner">
                <input type="hidden" {...register("role")} />
                {(["buyer", "vendor"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => chooseRole(option)}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                      activeRole === option
                        ? "bg-[#1a7a4a] text-white shadow"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    I&apos;m a {option === "buyer" ? "Buyer" : "Vendor"}
                  </button>
                ))}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="grid gap-5">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Full name
                    <Input type="text" {...register("full_name")} placeholder="John Doe" />
                    {errors.full_name && <p className="text-sm text-red-600">{errors.full_name.message}</p>}
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Email address
                    <Input type="email" {...register("email")} placeholder="you@example.com" />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Phone number
                    <Input type="tel" {...register("phone")} placeholder="08012345678" />
                    {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
                  </label>

                  {activeRole === "vendor" && (
                    <>
                      <label className="space-y-2 text-sm font-medium text-slate-700">
                        Kitchen Name
                        <Input type="text" {...register("shop_name")} placeholder="My Kitchen" />
                        {errors.shop_name && <p className="text-sm text-red-600">{errors.shop_name.message}</p>}
                      </label>

                      <label className="space-y-2 text-sm font-medium text-slate-700">
                        What you cook and deliver
                        <Input type="text" {...register("shop_description")} placeholder="E.g., Nigerian cuisine, snacks, breakfast" />
                        {errors.shop_description && <p className="text-sm text-red-600">{errors.shop_description.message}</p>}
                      </label>

                      <label className="space-y-2 text-sm font-medium text-slate-700">
                        Location
                        <Input type="text" {...register("location")} placeholder="Lagos" />
                        {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
                      </label>
                    </>
                  )}

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Password
                    <Input type="password" {...register("password")} placeholder="Create a password" />
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                  </label>

                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Confirm password
                    <Input type="password" {...register("confirm_password")} placeholder="Repeat password" />
                    {errors.confirm_password && <p className="text-sm text-red-600">{errors.confirm_password.message}</p>}
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Already registered?{" "}
                  <a href="/login" className="font-semibold text-emerald-800 hover:text-emerald-900">
                    Sign in
                  </a>
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
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">FreshDrop</p>
                <h2 className="mt-4 text-3xl font-semibold">Order and sell fresh Nigerian food.</h2>
              </div>
              <ul className="space-y-4 text-sm leading-7 text-emerald-100">
                <li>• Fast onboarding for food lovers and vendors.</li>
                <li>• Pay with Paystack or Flutterwave.</li>
                <li>• Real-time order tracking and delivery updates.</li>
              </ul>
              <p className="rounded-3xl bg-white/10 p-5 text-sm text-slate-200">
                Join thousands of Nigerians already ordering fresh meals and cooking from their kitchens on FreshDrop.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
