"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

/**
 * Sends a magic link to an arbitrary email. Used by the "Continue with Email"
 * button on the login page. Works for ANY email provider (not just Google).
 *
 * The user clicks the link in their inbox → lands on /auth/callback → signed in.
 *
 * If the email doesn't match an active member, the auth trigger creates a
 * pending member row (active=false), and the dashboard shows the pending
 * banner — admin still has to activate them.
 */
export async function sendLoginMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) redirect("/?error=email");

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    redirect(`/?error=email&msg=${encodeURIComponent(error.message)}`);
  }

  redirect(`/?sent=${encodeURIComponent(email)}`);
}

/**
 * Server Action: starts the Google OAuth flow.
 * Called from the login page <form action={signInWithGoogle}>.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/?error=auth");
  }

  if (data.url) {
    redirect(data.url);
  }
}
