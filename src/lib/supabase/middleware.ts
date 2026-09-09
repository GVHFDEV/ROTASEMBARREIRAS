import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh session cookie on every request. Required by @supabase/ssr —
 * without this, sessions silently expire mid-use.
 *
 * `rewriteUrl` (optional): when set, the response returned by this function
 * (and any intermediate response rebuilt while refreshing cookies) rewrites
 * to that URL instead of just passing the request through — used by
 * proxy.ts to send the admin.* subdomain into the /admin route group while
 * still refreshing the auth cookie in the same pass.
 */
export async function updateSession(request: NextRequest, rewriteUrl?: URL) {
  const buildResponse = () =>
    rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request }) : NextResponse.next({ request });

  let supabaseResponse = buildResponse();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = buildResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes token if expired. Required — do not remove.
  await supabase.auth.getUser();

  return supabaseResponse;
}
