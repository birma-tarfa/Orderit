import type { ReactNode } from "react";

export const metadata = {
  title: "Tradeloft - Sign In or Register",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
