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

  // Ask Supabase to validate the session; never rely on browser-only state.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isMuaRoute =
    pathname === "/dashboard/mua" || pathname.startsWith("/dashboard/mua/");
  const isPublicArtistProfile =
    pathname === "/bride/mua" || pathname.startsWith("/bride/mua/");
  const isPrivateBrideRoute =
    (pathname === "/bride" || pathname.startsWith("/bride/")) &&
    !isPublicArtistProfile;

  // Public pages do not need a logged-in session.
  if (!isAdminRoute && !isMuaRoute && !isPrivateBrideRoute) {
    return response;
  }

  if (authError || !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check only the role needed for the requested area. This keeps the admin
  // gate independent from bride/MUA profile availability and fails closed
  // if the membership lookup cannot be completed.
  const roleTable = isAdminRoute
    ? "admins"
    : isMuaRoute
      ? "mua_profiles"
      : "bride_profiles";

  const roleColumn = roleTable === "admins" ? "user_id" : "id";
  const { data: membership, error: roleError } = await supabase
    .from(roleTable)
    .select(roleColumn)
    .eq(roleColumn, user.id)
    .maybeSingle();

  if (roleError) {
    console.error(`Protected route role check failed for ${roleTable}:`, roleError.message);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("error", "access_check");
    return NextResponse.redirect(loginUrl);
  }

  if (membership) {
    return response;
  }

  // A signed-in user with a different role is sent to their own workspace.
  const destination = isAdminRoute
    ? "/login"
    : isMuaRoute
      ? "/login"
      : "/login";

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = destination;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("error", "access_denied");
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/bride/:path*", "/dashboard/mua/:path*"],
};
