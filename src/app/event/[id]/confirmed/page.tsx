import { createClient } from "@/lib/supabase/server";
import { requireActiveMember } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ConfirmedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string }>;
}) {
  const { id } = await params;
  const { slot } = await searchParams;
  const member = await requireActiveMember();

  if (!slot) notFound();

  const supabase = await createClient();
  const { data: slotData } = await supabase
    .from("slots")
    .select("role, mass:masses(label, mass_date, start_time, location)")
    .eq("id", slot)
    .single();

  type SlotInfo = {
    role: string;
    mass: {
      label: string;
      mass_date: string;
      start_time: string;
      location: string;
    };
  };
  const s = slotData as unknown as SlotInfo | null;
  if (!s) notFound();

  const firstName = member.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Thank you, {firstName}!</h2>
        <p className="text-slate-400 mb-6">
          You&apos;re signed up. A confirmation email with calendar invite is on
          its way.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
          <div className="font-medium mb-1">{s.role}</div>
          <div className="text-sm text-slate-400">
            {formatDate(s.mass.mass_date)} · {s.mass.start_time.slice(0, 5)}
          </div>
          <div className="text-sm text-slate-500 mt-1">{s.mass.location}</div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/event/${id}/confirmed/${slot}/calendar.ics`}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium"
          >
            📅 Add to Calendar
          </a>
          <Link
            href={`/event/${id}`}
            className="flex-1 py-2.5 px-4 bg-[#832b2b] hover:bg-[#a04444] rounded-lg text-sm font-semibold text-white"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
