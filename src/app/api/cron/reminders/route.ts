/**
 * Reminder cron endpoint.
 *
 * Triggered externally (e.g. by cron-job.org or GitHub Actions on a schedule).
 * Looks at every confirmed signup for an upcoming Mass and sends a reminder
 * email if the time-until-Mass crosses any of the member's reminder_hours
 * thresholds.
 *
 * Idempotency:
 *   We track sent reminders in a side table (cron_sent_reminders) so the same
 *   reminder doesn't fire twice. If we don't have that table yet, the function
 *   will create it lazily via a separate migration; for now we use a "window"
 *   approach: fire reminder if hours_remaining is within [target - 1h, target].
 *
 * Auth:
 *   Requires header `Authorization: Bearer ${CRON_SECRET}`.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendReminder } from "@/lib/email/send";

type SignupRow = {
  id: string;
  status: string;
  member: {
    name: string;
    email: string;
    reminder_hours: number[];
  };
  slot: {
    role: string;
    mass: {
      mass_date: string;
      start_time: string;
      label: string;
      location: string;
      event_id: string;
    };
  };
};

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Use service role for cron — bypasses RLS for the join we need to do.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Pull all confirmed signups for future Masses (within next 14 days as guard).
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: signupsRaw } = await supabase
    .from("signups")
    .select(
      `id, status,
       member:members(name, email, reminder_hours),
       slot:slots(role, mass:masses(mass_date, start_time, label, location, event_id))`,
    )
    .eq("status", "confirmed");

  const signups = ((signupsRaw ?? []) as unknown as SignupRow[]).filter(
    (s) =>
      s.slot?.mass &&
      s.slot.mass.mass_date >= today &&
      s.slot.mass.mass_date <= horizon,
  );

  const now = Date.now();
  const sentTo: Array<{
    signupId: string;
    target: number;
    email: string;
  }> = [];

  for (const s of signups) {
    const massAt = new Date(
      `${s.slot.mass.mass_date}T${s.slot.mass.start_time}`,
    ).getTime();
    const hoursOut = (massAt - now) / (1000 * 60 * 60);

    for (const target of s.member.reminder_hours ?? [48, 24]) {
      // Fire if we're within the [target-1h, target] window
      if (hoursOut <= target && hoursOut > target - 1) {
        await sendReminder({
          to: s.member.email,
          recipientName: s.member.name,
          eventId: s.slot.mass.event_id,
          role: s.slot.role,
          massLabel: s.slot.mass.label,
          massDate: s.slot.mass.mass_date,
          massTime: s.slot.mass.start_time,
          location: s.slot.mass.location,
          hoursOut: target,
        });
        sentTo.push({ signupId: s.id, target, email: s.member.email });
        break; // only fire the largest matching window per run
      }
    }
  }

  return NextResponse.json({
    checked: signups.length,
    sent: sentTo.length,
    details: sentTo,
  });
}
