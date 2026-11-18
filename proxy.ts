import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Always validate the user with Supabase; never trust client-side state alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isMuaRoute = pathname.startsWith("/dashboard/mua");
  const isPublicArtistProfile =
    pathname === "/bride/mua" || pathname.startsWith("/bride/mua/");
  const isPrivateBrideRoute =
    pathname.startsWith("/bride") && !isPublicArtistProfile;

  // Public artist profile pages remain viewable; their private actions require login.
  if (!isAdminRoute && !isMuaRoute && !isPrivateBrideRoute) {
    return response;
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Resolve the account role on the server before allowing a private dashboard route.
  const [adminResult, brideResult, muaResult] = await Promise.all([
    supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("bride_profiles").select("id").eq("id", user.id).maybeSingle(),
    supabase.from("mua_profiles").select("id").eq("id", user.id).maybeSingle(),
  ]);

  // Fail closed if role lookup fails: do not render a protected dashboard.
  if (adminResult.error || brideResult.error || muaResult.error) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "role_check");
    return NextResponse.redirect(loginUrl);
  }

  const role = adminResult.data
    ? "admin"
    : brideResult.data
      ? "bride"
      : muaResult.data
        ? "mua"
        : null;

  const allowed =
    (isAdminRoute && role === "admin") ||
    (isMuaRoute && role === "mua") ||
    (isPrivateBrideRoute && role === "bride");

  if (allowed) {
    return response;
  }

  const destination =
    role === "admin"
      ? "/admin"
      : role === "mua"
        ? "/dashboard/mua"
        : role === "bride"
          ? "/bride/home"
          : "/login";

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = destination;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/bride/:path*", "/dashboard/mua/:path*"],
};
