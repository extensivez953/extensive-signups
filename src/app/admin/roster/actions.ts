"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { generateMagicLink } from "@/lib/supabase/admin";
import { sendInvitation } from "@/lib/email/send";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = formData.get("role") === "admin" ? "admin" : "member";

  if (!name || !email) return;

  // Insert pre-emptively. If they later sign in via OAuth using this email,
  // the auth trigger links auth.users.id to this row via the on-conflict path.
  // Admin-added members are immediately active.
  const { error } = await supabase.from("members").insert({
    name,
    email,
    phone,
    role,
    active: true,
  });

  // Send invitation email with magic link (skip on duplicate-email insert error)
  if (!error) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const link = await generateMagicLink({
      email,
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    });

    if (link) {
      await sendInvitation({
        to: email,
        recipientName: name,
        coordinatorName: admin.name,
        magicLink: link,
      });
    }
  }

  revalidatePath("/admin/roster");
}

export async function updateMember(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = formData.get("role") === "admin" ? "admin" : "member";
  const active = formData.get("active") === "true";

  if (!id || !name || !email) return;

  await supabase
    .from("members")
    .update({ name, email, phone, role, active })
    .eq("id", id);

  revalidatePath("/admin/roster");
}

export async function deleteMember(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  await supabase.from("members").delete().eq("id", id);
  revalidatePath("/admin/roster");
}
