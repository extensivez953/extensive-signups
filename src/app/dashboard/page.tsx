import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";

type OpenEvent = {
  id: string;
  name: string;
  description: string | null;
  masses: {
    slots: {
      capacity: number;
      signups: { id: string; status: string }[];
    }[];
  }[];
};

type UpcomingCommitment = {
  id: string;
  comment: string | null;
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

export default async function DashboardPage() {
  const { member, authEmail } = await requireMember();
  const supabase = await createClient();

  // Inactive members see the pending banner
  if (!member?.active) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header name={member?.name ?? authEmail} email={authEmail} isAdmin={false} />
        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-amber-950/40 border border-amber-900 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-amber-200 mb-2">
              Account pending activation
            </h2>
            <p className="text-amber-100/80">
              You&apos;ve signed in successfully, but your account hasn&apos;t
              been activated yet. Contact Matt Dooley to be added to the safety
              team.
            </p>
            <div className="mt-4 text-sm text-amber-100/60">
              Signed in as <strong>{authEmail}</strong>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Open events (any event still accepting signups)
  const { data: openEventsData } = await supabase
    .from("events")
    .select(
      "id, name, description, masses(slots(capacity, signups(id, status)))",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const openEvents = (openEventsData ?? []) as OpenEvent[];

  // Upcoming commitments for this member (today onwards)
  const today = new Date().toISOString().slice(0, 10);
  const { data: upcomingData } = await supabase
    .from("signups")
    .select(
      "id, comment, slot:slots(role, mass:masses(mass_date, start_time, label, location, event_id))",
    )
    .eq("member_id", member.id)
    .eq("status", "confirmed");

  type UpRaw = {
    id: string;
    comment: string | null;
    slot:
      | {
          role: string;
          mass:
            | {
                mass_date: string;
                start_time: string;
                label: string;
                location: string;
                event_id: string;
              }
            | null;
        }
      | null;
  };
  const upcoming = ((upcomingData ?? []) as unknown as UpRaw[])
    .filter((s) => s.slot?.mass && s.slot.mass.mass_date >= today)
    .map((s) => s as unknown as UpcomingCommitment)
    .sort(
      (a, b) =>
        new Date(`${a.slot.mass.mass_date}T${a.slot.mass.start_time}`).getTime() -
        new Date(`${b.slot.mass.mass_date}T${b.slot.mass.start_time}`).getTime(),
    );

  // Year stats
  const yearStart = new Date(new Date().getFullYear(), 0, 1)
    .toISOString()
    .slice(0, 10);

  const { data: yearStatsRaw } = await supabase
    .from("signups")
    .select("slot:slots(role, mass:masses(mass_date))")
    .eq("member_id", member.id)
    .eq("status", "confirmed");

  type StatRaw = {
    slot: { role: string; mass: { mass_date: string } | null } | null;
  };
  const yearShifts = ((yearStatsRaw ?? []) as unknown as StatRaw[]).filter(
    (s) => s.slot?.mass && s.slot.mass.mass_date >= yearStart,
  );
  const shiftsServed = yearShifts.length;
  const asTeamLead = yearShifts.filter((s) => s.slot?.role === "Team Lead").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header name={member.name} email={authEmail} isAdmin={member.role === "admin"} />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Open invitations */}
        {openEvents.length > 0 && (
          <section className="mb-10">
            <div className="text-xs font-semibold text-[#c88080] uppercase tracking-wider mb-3">
              {openEvents.length === 1 ? "Open invitation" : "Open invitations"}
            </div>
            <div className="space-y-3">
              {openEvents.map((e) => {
                const totalSlots = e.masses.reduce(
                  (acc, m) => acc + m.slots.reduce((a, s) => a + s.capacity, 0),
                  0,
                );
                const filledSlots = e.masses.reduce(
                  (acc, m) =>
                    acc +
                    m.slots.reduce(
                      (a, s) =>
                        a +
                        s.signups.filter((x) => x.status === "confirmed").length,
                      0,
                    ),
                  0,
                );
                const open = totalSlots - filledSlots;

                return (
                  <Link
                    key={e.id}
                    href={`/event/${e.id}`}
                    className="block bg-gradient-to-br from-[#8a4f4f] to-[#a86060] rounded-2xl p-6 hover:from-[#a86060] hover:to-[#b87070] transition-all shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-xl font-bold">{e.name}</h2>
                      <div className="bg-white/20 backdrop-blur text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                        {open} OPEN
                      </div>
                    </div>
                    {e.description && (
                      <p className="text-white/80 text-sm mb-4">
                        {e.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      View &amp; Sign Up
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming commitments */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Your upcoming commitments
            </h3>
            <span className="text-xs text-slate-500">
              {upcoming.length} {upcoming.length === 1 ? "shift" : "shifts"}
            </span>
          </div>
          {upcoming.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              {openEvents.length > 0
                ? "Sign up for a shift above to see it here."
                : "No upcoming shifts. Wait for the next signup invite."}
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((c) => (
                <CommitmentCard key={c.id} commitment={c} />
              ))}
            </div>
          )}
        </section>

        {/* Year stats */}
        <section>
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Your year
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={String(shiftsServed)} label="Shifts served" />
            <Stat value={String(asTeamLead)} label="As Team Lead" />
            <Stat value={`${shiftsServed * 1.5}`} label="Hours served" />
          </div>
        </section>
      </main>
    </div>
  );
}

function Header({
  name,
  email,
  isAdmin,
}: {
  name: string;
  email: string;
  isAdmin: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#a86060] rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <div className="font-semibold">Safety Team</div>
            <div className="text-xs text-slate-500">St John the Apostle</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/events"
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Admin
            </Link>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-slate-500">{email}</div>
          </div>
          <div className="w-9 h-9 bg-[#8a4f4f] rounded-full flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
          <form action="/auth/signout" method="POST">
            <SubmitButton className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </div>
    </header>
  );
}

function CommitmentCard({ commitment }: { commitment: UpcomingCommitment }) {
  const { mass_date, start_time, label, location } = commitment.slot.mass;
  const [y, m, d] = mass_date.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dow = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dom = date.getDate();
  const mon = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  const time = start_time.slice(0, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 hover:border-slate-700 transition">
      <div className="text-center min-w-[60px]">
        <div className="text-xs text-[#c88080] font-semibold">{dow}</div>
        <div className="text-2xl font-bold">{dom}</div>
        <div className="text-xs text-slate-500">{mon}</div>
      </div>
      <div className="flex-1">
        <div className="font-medium">
          {commitment.slot.role} · {label}
        </div>
        <div className="text-sm text-slate-500">
          {location} · {time}
        </div>
        {commitment.comment && (
          <div className="text-xs text-slate-500 mt-1 italic">
            &ldquo;{commitment.comment}&rdquo;
          </div>
        )}
      </div>
      <Link
        href={`/event/${commitment.slot.mass.event_id}`}
        className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg"
      >
        View event
      </Link>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
