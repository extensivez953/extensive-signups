"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { sendInvite } from "@/lib/email/send";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const templateId = String(formData.get("template_id") ?? "") || null;
  const startDateStr = String(formData.get("start_date") ?? "");
  const weekends = Math.max(1, Number(formData.get("weekends") ?? 1));

  if (!name || !startDateStr) return;

  const { data: event } = await supabase
    .from("events")
    .insert({
      name,
      description,
      created_by: admin.id,
      status: "draft",
    })
    .select("id")
    .single();

  if (!event) return;

  // If a template was picked, materialize masses + slots
  if (templateId) {
    const { data: items } = await supabase
      .from("mass_template_items")
      .select(
        "day_offset, start_time, label, location, display_order, mass_template_slots(role, capacity, display_order)",
      )
      .eq("template_id", templateId)
      .order("display_order");

    type Item = {
      day_offset: number;
      start_time: string;
      label: string;
      location: string;
      display_order: number;
      mass_template_slots: {
        role: string;
        capacity: number;
        display_order: number;
      }[];
    };

    const startDate = new Date(startDateStr);
    let displayOrderBase = 0;

    for (let w = 0; w < weekends; w++) {
      for (const item of (items ?? []) as Item[]) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + w * 7 + item.day_offset);
        const dateStr = date.toISOString().slice(0, 10);

        const { data: mass } = await supabase
          .from("masses")
          .insert({
            event_id: event.id,
            mass_date: dateStr,
            start_time: item.start_time,
            label: item.label,
            location: item.location,
            display_order: displayOrderBase++,
          })
          .select("id")
          .single();

        if (mass) {
          await supabase.from("slots").insert(
            item.mass_template_slots.map((s) => ({
              mass_id: mass.id,
              role: s.role,
              capacity: s.capacity,
              display_order: s.display_order,
            })),
          );
        }
      }
    }
  }

  redirect(`/admin/events/${event.id}`);
}

export async function duplicateEvent(formData: FormData) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const sourceId = String(formData.get("source_id"));
  const startDateStr = String(formData.get("start_date"));

  if (!sourceId || !startDateStr) return;

  const { data: source } = await supabase
    .from("events")
    .select("name, description")
    .eq("id", sourceId)
    .single();

  if (!source) return;

  const { data: sourceMasses } = await supabase
    .from("masses")
    .select(
      "mass_date, start_time, label, location, display_order, slots(role, capacity, display_order)",
    )
    .eq("event_id", sourceId)
    .order("display_order");

  type SrcMass = {
    mass_date: string;
    start_time: string;
    label: string;
    location: string;
    display_order: number;
    slots: { role: string; capacity: number; display_order: number }[];
  };

  // Compute the source's earliest date, use it as the anchor to rebase
  const masses = (sourceMasses ?? []) as SrcMass[];
  if (masses.length === 0) return;

  const sourceAnchor = new Date(
    masses.map((m) => m.mass_date).sort()[0] + "T00:00:00Z",
  );
  const newAnchor = new Date(startDateStr + "T00:00:00Z");
  const offsetMs = newAnchor.getTime() - sourceAnchor.getTime();

  const { data: event } = await supabase
    .from("events")
    .insert({
      name: `${source.name} (copy)`,
      description: source.description,
      created_by: admin.id,
      status: "draft",
    })
    .select("id")
    .single();

  if (!event) return;

  for (const m of masses) {
    const shifted = new Date(
      new Date(m.mass_date + "T00:00:00Z").getTime() + offsetMs,
    );
    const newDateStr = shifted.toISOString().slice(0, 10);

    const { data: newMass } = await supabase
      .from("masses")
      .insert({
        event_id: event.id,
        mass_date: newDateStr,
        start_time: m.start_time,
        label: m.label,
        location: m.location,
        display_order: m.display_order,
      })
      .select("id")
      .single();

    if (newMass) {
      await supabase.from("slots").insert(
        m.slots.map((s) => ({
          mass_id: newMass.id,
          role: s.role,
          capacity: s.capacity,
          display_order: s.display_order,
        })),
      );
    }
  }

  redirect(`/admin/events/${event.id}`);
}

export async function updateEvent(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const gapAlertHours = Number(formData.get("gap_alert_hours") ?? 72);

  if (!id || !name) return;

  await supabase
    .from("events")
    .update({ name, description, gap_alert_hours: gapAlertHours })
    .eq("id", id);

  revalidatePath(`/admin/events/${id}`);
}

export async function publishEvent(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;

  const { data: event } = await supabase
    .from("events")
    .update({ status: "open", invites_sent_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, name, description")
    .single();

  if (event) {
    // Send invite emails to all active members. Failures don't block the publish.
    const { data: members } = await supabase
      .from("members")
      .select("name, email")
      .eq("active", true);

    type M = { name: string; email: string };
    await Promise.allSettled(
      ((members ?? []) as M[]).map((m) =>
        sendInvite({
          to: m.email,
          recipientName: m.name,
          eventId: event.id,
          eventName: event.name,
          eventDescription: event.description,
        }),
      ),
    );
  }

  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/events");
}

export async function closeEvent(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;
  await supabase.from("events").update({ status: "closed" }).eq("id", id);
  revalidatePath(`/admin/events/${id}`);
  revalidatePath("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  if (!id) return;
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/admin/events");
  redirect("/admin/events");
}

export async function updateSlotCapacity(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const eventId = String(formData.get("event_id"));
  const capacity = Math.max(1, Number(formData.get("capacity")) || 1);
  if (!id) return;
  await supabase.from("slots").update({ capacity }).eq("id", id);
  revalidatePath(`/admin/events/${eventId}`);
}
