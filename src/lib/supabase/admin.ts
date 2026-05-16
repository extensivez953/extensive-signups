import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin client that uses the service_role key, bypassing RLS.
 *
 * Only call this from server-side code (route handlers, server actions).
 * NEVER import this into a client component.
 *
 * Use it for things RLS can't or shouldn't gate:
 *   - Generating magic links for users
 *   - Cron jobs reading data across all users
 *   - Bulk operations from admin flows
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Generates a magic-link URL that signs the user in when clicked.
 * The link is delivered via OUR email (not Supabase's built-in pipeline)
 * so we keep our branding. Valid for 1 hour by default.
 */
export async function generateMagicLink(opts: {
  email: string;
  redirectTo: string;
}): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: opts.email,
    options: { redirectTo: opts.redirectTo },
  });
  if (error) {
    console.error("[admin:generateMagicLink]", error);
    return null;
  }
  return data?.properties?.action_link ?? null;
}
