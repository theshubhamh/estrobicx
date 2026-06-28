import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  const publicRoutes = ["/login", "/signup", "/invite"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profile) {
      // Redirect based on role
      const isAdmin = profile.role === "super_admin" || profile.role === "reviewer";
      const isStartup = profile.role === "startup";
      const isInvestor = profile.role === "investor";

      // Redirect root to appropriate dashboard
      if (pathname === "/") {
        if (isAdmin) return NextResponse.redirect(new URL("/admin", request.url));
        if (isStartup) return NextResponse.redirect(new URL("/dashboard/startup", request.url));
        if (isInvestor) return NextResponse.redirect(new URL("/dashboard/investor", request.url));
      }

      // Role-based access control
      if (pathname.startsWith("/admin") && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard/startup", request.url));
      }
      if (pathname.startsWith("/dashboard/startup") && !isStartup && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard/investor", request.url));
      }
      if (pathname.startsWith("/dashboard/investor") && !isInvestor && !isAdmin) {
        return NextResponse.redirect(new URL("/dashboard/startup", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
