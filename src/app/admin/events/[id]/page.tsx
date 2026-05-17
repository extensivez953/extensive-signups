import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  updateEvent,
  publishEvent,
  closeEvent,
  deleteEvent,
  updateSlotCapacity,
} from "../actions";
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
    signups: { id: string; status: string; member: { name: string } }[];
  }[];
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, description, status, gap_alert_hours, invites_sent_at, created_at",
    )
    .eq("id", id)
    .single();

  if (!event) notFound();

  const { data: massesData } = await supabase
    .from("masses")
    .select(
      `id, mass_date, start_time, label, location, display_order,
       slots(id, role, capacity, display_order,
             signups(id, status, member:members(name)))`,
    )
    .eq("event_id", id)
    .order("display_order");

  const masses = (massesData ?? []) as unknown as Mass[];

  const totalSlots = masses.reduce(
    (acc, m) => acc + m.slots.reduce((a, s) => a + s.capacity, 0),
    0,
  );
  const filledSlots = masses.reduce(
    (acc, m) =>
      acc +
      m.slots.reduce(
        (a, s) =>
          a + s.signups.filter((sg) => sg.status === "confirmed").length,
        0,
      ),
    0,
  );

  return (
    <div>
      <Link
        href="/admin/events"
        className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1"
      >
        ← Back to events
      </Link>

      {/* Header + metadata */}
      <form action={updateEvent} className="mb-6">
        <input type="hidden" name="id" value={event.id} />
        <input
          name="name"
          defaultValue={event.name}
          className="text-2xl font-bold bg-transparent border-0 border-b border-slate-700 focus:border-[#832b2b] focus:outline-none px-1 w-full mb-3"
        />
        <textarea
          name="description"
          defaultValue={event.description ?? ""}
          rows={2}
          placeholder="Description (optional)"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent mb-3"
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400">Gap alert (hrs):</label>
          <input
            name="gap_alert_hours"
            type="number"
            min={1}
            defaultValue={event.gap_alert_hours}
            className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm"
          />
          <SubmitButton className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
            Save
          </SubmitButton>
          <div className="flex-1" />
          <StatusBadge status={event.status} />
        </div>
      </form>

      {/* Action bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {event.status === "draft" && (
          <form action={publishEvent}>
            <input type="hidden" name="id" value={event.id} />
            <SubmitButton className="px-4 py-2 bg-[#832b2b] hover:bg-[#a04444] rounded-lg text-sm font-semibold text-white cursor-pointer">
              Publish &amp; Send Invites
            </SubmitButton>
          </form>
        )}
        {event.status === "open" && (
          <form action={closeEvent}>
            <input type="hidden" name="id" value={event.id} />
            <SubmitButton className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold cursor-pointer">
              Close Event
            </SubmitButton>
          </form>
        )}
        <Link
          href={`/event/${event.id}`}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold"
        >
          View as Member →
        </Link>
        <div className="flex-1" />
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <SubmitButton className="px-3 py-2 text-red-300 hover:bg-red-900/20 rounded-lg text-sm cursor-pointer">
            Delete Event
          </SubmitButton>
        </form>
      </div>

      {/* Fill summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Total slots" value={String(totalSlots)} />
        <Stat label="Filled" value={`${filledSlots} / ${totalSlots}`} />
        <Stat
          label="% complete"
          value={totalSlots ? `${Math.round((filledSlots / totalSlots) * 100)}%` : "—"}
        />
      </div>

      {/* Masses + slots */}
      <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
        Masses ({masses.length})
      </h2>
      <div className="space-y-3">
        {masses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            No Masses in this event yet.
          </div>
        ) : (
          masses.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800">
                <div className="font-semibold">{m.label}</div>
                <div className="text-xs text-slate-500">
                  {formatDate(m.mass_date)} · {m.start_time.slice(0, 5)} ·{" "}
                  {m.location}
                </div>
              </div>
              <div className="divide-y divide-slate-800">
                {m.slots
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((s) => {
                    const confirmed = s.signups.filter(
                      (x) => x.status === "confirmed",
                    );
                    return (
                      <div
                        key={s.id}
                        className="px-5 py-3 flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">{s.role}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {confirmed.length === 0
                              ? "Empty"
                              : confirmed
                                  .map((c) => c.member.name)
                                  .join(" · ")}
                          </div>
                        </div>
                        <form action={updateSlotCapacity} className="flex gap-2 items-center">
                          <input type="hidden" name="id" value={s.id} />
                          <input
                            type="hidden"
                            name="event_id"
                            value={event.id}
                          />
                          <label className="text-xs text-slate-500">
                            cap
                          </label>
                          <input
                            name="capacity"
                            type="number"
                            min={1}
                            defaultValue={s.capacity}
                            className="w-14 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs"
                          />
                          <SubmitButton className="text-xs px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
                            Save
                          </SubmitButton>
                        </form>
                        <div
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            confirmed.length >= s.capacity
                              ? "bg-green-900/40 text-green-300"
                              : "bg-amber-900/40 text-amber-300"
                          }`}
                        >
                          {confirmed.length} / {s.capacity}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "open"
      ? "bg-green-900/40 text-green-300"
      : status === "draft"
        ? "bg-amber-900/40 text-amber-300"
        : "bg-slate-800 text-slate-400";
  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${styles}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
