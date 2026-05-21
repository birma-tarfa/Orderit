import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

const PUBLIC_ROUTES = ["/", "/marketplace", "/login", "/register"];

const PROTECTED_ROUTE_PREFIXES = [
  "/vendor/dashboard",
  "/vendor/products",
  "/vendor/orders",
  "/vendor/inventory",
  "/buyer/dashboard",
  "/buyer/orders",
  "/buyer/profile",
  "/checkout",
  "/messages",
];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set(name, value, options);
        },
        remove: (name: string, options: any) => {
          res.cookies.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );

  // Calling getSession ensures the server client reads and refreshes cookies as needed
  const { data } = await supabase.auth.getSession();
  const session = data?.session ?? null;
  const { pathname } = req.nextUrl;

  // Allow listed public routes, product pages and vendor storefronts
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/product") ||
    /^\/vendor\/[^/]+\/store/.test(pathname)
  ) {
    return res;
  }

  const isProtected = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isProtected && !session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/main", req.url));
  }

  return res;
}
