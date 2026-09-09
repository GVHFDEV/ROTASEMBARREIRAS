import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

// Subdomain that serves the admin panel. Overridable via env for local/
// preview testing (e.g. admin.localhost:3000, admin-preview.vercel.app).
const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST || "admin.rotasembarreiras.com.br";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  // Strip port for local dev (e.g. "admin.localhost:3000" -> "admin.localhost").
  const hostname = host.split(":")[0];
  const isAdminHost = hostname === ADMIN_HOST || hostname === ADMIN_HOST.split(":")[0];

  const { pathname } = request.nextUrl;

  if (isAdminHost) {
    // admin.rotasembarreiras.com.br/* -> internally served by /admin/*.
    // Users on this subdomain never see "/admin" in the URL.
    if (!pathname.startsWith("/admin")) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return await updateSession(request, rewriteUrl);
    }
    return await updateSession(request);
  }

  // Main domain (and any other host) never gets to see /admin/* — the
  // route group only resolves through the subdomain rewrite above. This
  // stops the panel from being reachable at rotasembarreiras.com.br/admin.
  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
