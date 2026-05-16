import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Member = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "member";
  active: boolean;
  reminder_hours: number[];
};

/**
 * Returns the currently authenticated member, or redirects to "/" if
 * not signed in. Does NOT check for active or admin status — call this
 * from any auth-required page.
 */
export async function requireMember(): Promise<{
  member: Member | null;
  authEmail: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return { member: member as Member | null, authEmail: user.email! };
}

/**
 * Requires an active member. Throws (via redirect) if not.
 * Use on member-facing pages.
 */
export async function requireActiveMember(): Promise<Member> {
  const { member } = await requireMember();
  if (!member?.active) redirect("/dashboard"); // dashboard shows the pending card
  return member;
}

/**
 * Requires an active admin. Redirects to /dashboard if not admin.
 * Use on admin pages.
 */
export async function requireAdmin(): Promise<Member> {
  const member = await requireActiveMember();
  if (member.role !== "admin") redirect("/dashboard");
  return member;
}
