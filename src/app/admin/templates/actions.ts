"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTemplate() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("mass_templates")
    .insert({ name: "Untitled Template", created_by: admin.id })
    .select("id")
    .single();
  if (!data) return;
  redirect(`/admin/templates/${data.id}`);
}

export async function renameTemplate(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await supabase.from("mass_templates").update({ name }).eq("id", id);
  revalidatePath(`/admin/templates/${id}`);
  revalidatePath("/admin/templates");
}

export async function deleteTemplate(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;
  await supabase.from("mass_templates").delete().eq("id", id);
  revalidatePath("/admin/templates");
}

export async function addTemplateItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const templateId = String(formData.get("template_id"));
  const dayOffset = Number(formData.get("day_offset"));
  const startTime = String(formData.get("start_time"));
  const label = String(formData.get("label") ?? "").trim();
  const location = String(formData.get("location") ?? "SJA").trim() || "SJA";

  if (!templateId || !startTime || !label) return;

  const { data: existing } = await supabase
    .from("mass_template_items")
    .select("display_order")
    .eq("template_id", templateId)
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

  const { data: item } = await supabase
    .from("mass_template_items")
    .insert({
      template_id: templateId,
      day_offset: dayOffset,
      start_time: startTime,
      label,
      location,
      display_order: nextOrder,
    })
    .select("id")
    .single();

  if (item) {
    // Default slot set: Team Lead, Medic, Team Member
    await supabase.from("mass_template_slots").insert([
      { template_item_id: item.id, role: "Team Lead", capacity: 1, display_order: 0 },
      { template_item_id: item.id, role: "Medic", capacity: 1, display_order: 1 },
      { template_item_id: item.id, role: "Team Member", capacity: 3, display_order: 2 },
    ]);
  }

  revalidatePath(`/admin/templates/${templateId}`);
}

export async function deleteTemplateItem(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const templateId = String(formData.get("template_id"));
  if (!id) return;
  await supabase.from("mass_template_items").delete().eq("id", id);
  revalidatePath(`/admin/templates/${templateId}`);
}

export async function updateTemplateSlot(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const templateId = String(formData.get("template_id"));
  const capacity = Math.max(1, Number(formData.get("capacity")) || 1);
  if (!id) return;
  await supabase.from("mass_template_slots").update({ capacity }).eq("id", id);
  revalidatePath(`/admin/templates/${templateId}`);
}
