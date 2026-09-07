import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback handler (Google via Supabase). Supabase redirects
 * here with a `code` param after the provider consent screen; we exchange
 * it for a session cookie, then send the user back into the app.
 *
 * Configure this exact URL as a Redirect URL in Supabase Auth settings:
 *   <site-url>/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Optional: where to send the user after login (defaults to home).
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("OAuth callback error:", error.message);
  }

  // Missing/invalid code or exchange failed — bounce back to home; the app
  // falls back to its normal anonymous session flow.
  return NextResponse.redirect(`${origin}/?auth_error=1`);
}
