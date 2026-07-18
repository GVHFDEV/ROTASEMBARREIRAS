import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-only Supabase client. Uses anon key only — safe for frontend bundle.
 * service_role key never touches this file or any client code.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
