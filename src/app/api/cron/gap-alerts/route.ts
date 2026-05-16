/**
 * Gap-alert cron endpoint.
 *
 * For every open event, checks each Mass against the event's
 * gap_alert_hours setting. If we're within [gap_alert_hours - 1h, gap_alert_hours]
 * of the Mass start time and any slot is unfilled, send a single digest email
 * to each alert recipient listing the open slots.
 *
 * If no alert recipients are configured, defaults to all admins.
 *
 * Auth: requires Bearer CRON_SECRET like the reminders endpoint.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendGapAlert } from "@/lib/email/send";

type OpenEvent = {
  id: string;
  name: string;
  gap_alert_hours: number;
  event_alert_recipients: { member: { name: string; email: string } }[];
  masses: {
    id: string;
    mass_date: string;
    start_time: string;
    label: string;
    slots: {
      id: string;
      role: string;
      capacity: number;
      signups: { status: string }[];
    }[];
  }[];
};

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: openEventsRaw } = await supabase
    .from("events")
    .select(
      `id, name, gap_alert_hours,
       event_alert_recipients(member:members(name, email)),
       masses(id, mass_date, start_time, label,
              slots(id, role, capacity, signups(status)))`,
    )
    .eq("status", "open");

  const openEvents = (openEventsRaw ?? []) as unknown as OpenEvent[];
  const now = Date.now();

  // Fallback: all admins, if no recipients configured for an event
  const { data: adminsRaw } = await supabase
    .from("members")
    .select("name, email")
    .eq("role", "admin")
    .eq("active", true);
  type Admin = { name: string; email: string };
  const admins = (adminsRaw ?? []) as Admin[];

  const sent: Array<{ eventId: string; to: string; gaps: number }> = [];

  for (const event of openEvents) {
    const gapsByRecipient: Map<
      string,
      {
        name: string;
        email: string;
        gaps: { role: string; massLabel: string; massDate: string }[];
      }
    > = new Map();

    for (const mass of event.masses) {
      const massAt = new Date(
        `${mass.mass_date}T${mass.start_time}`,
      ).getTime();
      const hoursOut = (massAt - now) / (1000 * 60 * 60);

      // Within the alert window?
      const target = event.gap_alert_hours;
      if (hoursOut > target || hoursOut <= target - 1) continue;

      for (const slot of mass.slots) {
        const filled = slot.signups.filter(
          (s) => s.status === "confirmed",
        ).length;
        if (filled < slot.capacity) {
          // Determine recipients for this event
          const recipients =
            event.event_alert_recipients.length > 0
              ? event.event_alert_recipients.map((r) => r.member)
              : admins;
          for (const r of recipients) {
            const key = `${event.id}::${r.email}`;
            const entry = gapsByRecipient.get(key) ?? {
              name: r.name,
              email: r.email,
              gaps: [],
            };
            entry.gaps.push({
              role: slot.role,
              massLabel: mass.label,
              massDate: mass.mass_date,
            });
            gapsByRecipient.set(key, entry);
          }
        }
      }
    }

    for (const v of gapsByRecipient.values()) {
      await sendGapAlert({
        to: v.email,
        recipientName: v.name,
        eventId: event.id,
        eventName: event.name,
        unfilledList: v.gaps,
      });
      sent.push({ eventId: event.id, to: v.email, gaps: v.gaps.length });
    }
  }

  return NextResponse.json({
    checked: openEvents.length,
    sent: sent.length,
    details: sent,
  });
}
