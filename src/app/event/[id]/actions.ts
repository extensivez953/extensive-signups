"use server";

import { createClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/auth";
import { sendConfirmation } from "@/lib/email/send";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUpForSlot(formData: FormData) {
  const member = await requireActiveMember();
  const supabase = await createClient();

  const slotId = String(formData.get("slot_id"));
  const eventId = String(formData.get("event_id"));
  const comment = String(formData.get("comment") ?? "").trim() || null;
  const displayName =
    String(formData.get("display_name") ?? "").trim() || null;

  if (!slotId) return;

  // Check capacity before inserting (RLS won't block this — capacity is app logic)
  const { data: slot } = await supabase
    .from("slots")
    .select("capacity, signups(status)")
    .eq("id", slotId)
    .single();

  if (!slot) return;

  type SignupRef = { status: string };
  const filled = (slot.signups as SignupRef[]).filter(
    (s) => s.status === "confirmed",
  ).length;
  if (filled >= slot.capacity) {
    redirect(`/event/${eventId}?error=full`);
  }

  const { data: inserted, error } = await supabase
    .from("signups")
    .insert({
      slot_id: slotId,
      member_id: member.id,
      display_name: displayName,
      comment,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(`/event/${eventId}?error=already`);
  }

  // Send confirmation email (with iCal attachment). Failures don't block.
  const { data: details } = await supabase
    .from("slots")
    .select(
      "role, mass:masses(label, mass_date, start_time, location, event:events(name))",
    )
    .eq("id", slotId)
    .single();

  type Details = {
    role: string;
    mass: {
      label: string;
      mass_date: string;
      start_time: string;
      location: string;
      event: { name: string };
    };
  };
  const d = details as unknown as Details | null;
  if (d) {
    await sendConfirmation({
      to: member.email,
      recipientName: member.name,
      eventId,
      eventName: d.mass.event.name,
      signupId: inserted.id,
      role: d.role,
      massLabel: d.mass.label,
      massDate: d.mass.mass_date,
      massTime: d.mass.start_time,
      location: d.mass.location,
    });
  }

  redirect(`/event/${eventId}/confirmed?slot=${slotId}`);
}

export async function cancelSignup(formData: FormData) {
  const member = await requireActiveMember();
  const supabase = await createClient();
  const signupId = String(formData.get("signup_id"));
  const eventId = String(formData.get("event_id"));

  if (!signupId) return;

  await supabase
    .from("signups")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", signupId)
    .eq("member_id", member.id);

  revalidatePath(`/event/${eventId}`);
  revalidatePath("/dashboard");
}
