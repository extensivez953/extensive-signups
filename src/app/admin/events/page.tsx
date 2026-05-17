import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type EventRow = {
  id: string;
  name: string;
  status: "draft" | "open" | "closed";
  created_at: string;
  invites_sent_at: string | null;
  masses: { id: string; mass_date: string }[];
};

export default async function EventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id, name, status, created_at, invites_sent_at, masses(id, mass_date)")
    .order("created_at", { ascending: false });

  const events = (data ?? []) as EventRow[];
  const open = events.filter((e) => e.status === "open");
  const drafts = events.filter((e) => e.status === "draft");
  const closed = events.filter((e) => e.status === "closed");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/admin/events/new"
          className="px-4 py-2 bg-[#832b2b] hover:bg-[#a04444] rounded-lg text-sm font-semibold text-white"
        >
          + Create Event
        </Link>
      </div>

      {drafts.length > 0 && (
        <Section title="Drafts" count={drafts.length}>
          {drafts.map((e) => (
            <EventRowCard key={e.id} event={e} variant="draft" />
          ))}
        </Section>
      )}

      <Section title="Open" count={open.length}>
        {open.length === 0 ? (
          <EmptyState text="No open events. Create one to send invites." />
        ) : (
          open.map((e) => <EventRowCard key={e.id} event={e} variant="open" />)
        )}
      </Section>

      {closed.length > 0 && (
        <Section title="Past" count={closed.length}>
          {closed.map((e) => (
            <EventRowCard key={e.id} event={e} variant="closed" />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        {title} ({count})
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
      {text}
    </div>
  );
}

function EventRowCard({
  event,
  variant,
}: {
  event: EventRow;
  variant: "draft" | "open" | "closed";
}) {
  const massCount = event.masses?.length ?? 0;
  const earliest = event.masses
    ?.map((m) => m.mass_date)
    .sort()[0];
  const latest = event.masses?.map((m) => m.mass_date).sort().slice(-1)[0];

  return (
    <Link
      href={`/admin/events/${event.id}`}
      className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-medium">{event.name}</div>
            {variant === "draft" && (
              <span className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-300 rounded-full">
                Draft
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {massCount} Masses
            {earliest && (
              <>
                {" · "}
                {earliest === latest
                  ? formatDate(earliest)
                  : `${formatDate(earliest)} → ${formatDate(latest!)}`}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
