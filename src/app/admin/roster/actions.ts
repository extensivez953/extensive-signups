"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMember(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const role = formData.get("role") === "admin" ? "admin" : "member";

  if (!name || !email) return;

  // Insert pre-emptively. If they later sign in with Google using this email,
  // the auth trigger will link auth.users.id to this row via the on-conflict path.
  // Admin-added members are immediately active.
  await supabase.from("members").insert({
    name,
    email,
    phone,
    role,
    active: true,
  });

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
