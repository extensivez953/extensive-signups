import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createEvent } from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewEventPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("mass_templates")
    .select("id, name, mass_template_items(count)")
    .order("name");

  type Tpl = { id: string; name: string; mass_template_items: { count: number }[] };
  const list = (templates ?? []) as Tpl[];

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/events"
        className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1"
      >
        ← Back to events
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>

      <form action={createEvent} className="space-y-5">
        <Field label="Name">
          <input
            name="name"
            placeholder="Mass Signups: 16-17 and 23-24 May 2026"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            name="description"
            rows={3}
            placeholder="Please pick a slot for both Mass weekends. Thank you!"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
          />
        </Field>

        <Field label="First weekend's Saturday date">
          <input
            name="start_date"
            type="date"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
          />
        </Field>

        <Field label="Use template (optional)">
          <select
            name="template_id"
            defaultValue=""
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
          >
            <option value="">— No template (add masses manually) —</option>
            {list.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.mass_template_items?.[0]?.count ?? 0} Masses)
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            If using a template, masses get auto-created with default slot
            capacities. You can adjust everything afterward.
          </p>
        </Field>

        <Field label="Repeat for how many weekends?">
          <select
            name="weekends"
            defaultValue="1"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
          >
            <option value="1">1 weekend</option>
            <option value="2">2 weekends</option>
            <option value="3">3 weekends</option>
            <option value="4">4 weekends</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Only applies when using a template. Each weekend uses the same
            schedule, 7 days apart.
          </p>
        </Field>

        <div className="flex gap-3 pt-2">
          <Link
            href="/admin/events"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
          >
            Cancel
          </Link>
          <SubmitButton className="px-4 py-2 bg-[#a86060] hover:bg-[#b87070] rounded-lg text-sm font-semibold text-white cursor-pointer">
            Create Event (as Draft)
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-2">{label}</div>
      {children}
    </label>
  );
}
