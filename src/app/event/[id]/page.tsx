import { createClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cancelSignup } from "./actions";
import { SignupModal } from "./SignupModal";
import { SubmitButton } from "@/components/SubmitButton";

type Mass = {
  id: string;
  mass_date: string;
  start_time: string;
  label: string;
  location: string;
  display_order: number;
  slots: {
    id: string;
    role: string;
    capacity: number;
    display_order: number;
    signups: {
      id: string;
      status: string;
      display_name: string | null;
      member_id: string;
      member: { name: string };
    }[];
  }[];
};

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const member = await requireActiveMember();
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, description, status")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: massesData } = await supabase
    .from("masses")
    .select(
      `id, mass_date, start_time, label, location, display_order,
       slots(id, role, capacity, display_order,
             signups(id, status, display_name, member_id, member:members(name)))`,
    )
    .eq("event_id", id)
    .order("display_order");

  const masses = (massesData ?? []) as unknown as Mass[];

  // Group masses by date for "Weekend N" headers
  const groupedByDate: Map<string, Mass[]> = new Map();
  for (const m of masses) {
    const list = groupedByDate.get(m.mass_date) ?? [];
    list.push(m);
    groupedByDate.set(m.mass_date, list);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
          <div className="text-sm text-gray-500">{member.name}</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
          {event.description && (
            <p className="text-gray-500">{event.description}</p>
          )}
        </div>

        {error === "full" && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            That slot just filled up. Please pick another.
          </div>
        )}
        {error === "already" && (
          <div className="mb-4 p-3 bg-amber-900/30 border border-amber-800 rounded-lg text-sm text-amber-800">
            You&apos;re already signed up for that slot.
          </div>
        )}

        <div className="mb-8 flex gap-3 text-xs">
          <Legend color="bg-[#832b2b]" label="Open" />
          <Legend color="bg-slate-700" label="Filled" />
          <Legend color="bg-green-500" label="You" />
        </div>

        {[...groupedByDate.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, dateMasses]) => (
            <section key={date} className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#b85a5a] mb-3">
                {formatDateHeader(date)}
              </h2>
              <div className="space-y-3">
                {dateMasses
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((mass) => (
                    <MassCard
                      key={mass.id}
                      mass={mass}
                      eventId={event.id}
                      currentMemberId={member.id}
                      eventOpen={event.status === "open"}
                    />
                  ))}
              </div>
            </section>
          ))}

        {masses.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No Masses in this event yet.
          </div>
        )}
      </main>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

function MassCard({
  mass,
  eventId,
  currentMemberId,
  eventOpen,
}: {
  mass: Mass;
  eventId: string;
  currentMemberId: string;
  eventOpen: boolean;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="font-semibold">{mass.label}</div>
        <div className="text-xs text-gray-500">{mass.location}</div>
      </div>
      <div className="divide-y divide-gray-200">
        {mass.slots
          .sort((a, b) => a.display_order - b.display_order)
          .map((slot) => {
            const confirmed = slot.signups.filter((s) => s.status === "confirmed");
            const mine = confirmed.find((s) => s.member_id === currentMemberId);
            const filled = confirmed.length >= slot.capacity;
            const openCount = slot.capacity - confirmed.length;

            return (
              <div
                key={slot.id}
                className={`px-5 py-3 flex items-center justify-between gap-3 ${
                  mine ? "border-l-2 border-green-500 -ml-px" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    {slot.role}
                    {mine && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                        You&apos;re signed up
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {confirmed.length === 0
                      ? "Open"
                      : confirmed
                          .map((s) => s.display_name ?? s.member.name)
                          .join(" · ")}
                    {!filled && confirmed.length > 0 && (
                      <span className="text-[#b85a5a]">
                        {" "}
                        · {openCount} more open
                      </span>
                    )}
                  </div>
                </div>
                {mine ? (
                  <form action={cancelSignup}>
                    <input type="hidden" name="signup_id" value={mine.id} />
                    <input type="hidden" name="event_id" value={eventId} />
                    <SubmitButton className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                      Cancel
                    </SubmitButton>
                  </form>
                ) : filled || !eventOpen ? (
                  <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                    {filled ? "Filled" : "Closed"}
                  </div>
                ) : (
                  <SignupModal
                    slotId={slot.id}
                    eventId={eventId}
                    slotLabel={`${slot.role} · ${mass.label}`}
                    massDate={mass.mass_date}
                    massTime={mass.start_time}
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function formatDateHeader(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
