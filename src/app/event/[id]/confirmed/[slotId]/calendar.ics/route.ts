import { createClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/auth";
import { generateICalForSlot } from "@/lib/ical";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> },
) {
  const { id, slotId } = await params;
  const member = await requireActiveMember();
  const supabase = await createClient();

  const { data: slot } = await supabase
    .from("slots")
    .select("id, role, mass:masses(mass_date, start_time, location)")
    .eq("id", slotId)
    .single();

  type SlotData = {
    id: string;
    role: string;
    mass: {
      mass_date: string;
      start_time: string;
      location: string;
    };
  };
  const s = slot as unknown as SlotData | null;
  if (!s) return new NextResponse("Not found", { status: 404 });

  // Get the signup row for stable UID
  const { data: signup } = await supabase
    .from("signups")
    .select("id")
    .eq("slot_id", slotId)
    .eq("member_id", member.id)
    .eq("status", "confirmed")
    .single();

  if (!signup) return new NextResponse("Not signed up", { status: 404 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const ics = generateICalForSlot({
    uid: signup.id,
    role: s.role,
    location: s.mass.location,
    massDate: s.mass.mass_date,
    massTime: s.mass.start_time,
    eventUrl: `${origin}/event/${id}`,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="safety-team-${s.mass.mass_date}.ics"`,
    },
  });
}
