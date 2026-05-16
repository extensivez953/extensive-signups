import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  renameTemplate,
  addTemplateItem,
  deleteTemplateItem,
  updateTemplateSlot,
} from "../actions";
import { SubmitButton } from "@/components/SubmitButton";

type TemplateItem = {
  id: string;
  day_offset: number;
  start_time: string;
  label: string;
  location: string;
  display_order: number;
  mass_template_slots: {
    id: string;
    role: string;
    capacity: number;
    display_order: number;
  }[];
};

const DAY_LABELS = ["Saturday", "Sunday", "Mon", "Tue", "Wed", "Thu", "Fri"];

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("mass_templates")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!template) notFound();

  const { data: itemsData } = await supabase
    .from("mass_template_items")
    .select(
      "id, day_offset, start_time, label, location, display_order, mass_template_slots(id, role, capacity, display_order)",
    )
    .eq("template_id", id)
    .order("display_order");

  const items = (itemsData ?? []) as TemplateItem[];

  return (
    <div>
      <Link
        href="/admin/templates"
        className="text-sm text-slate-400 hover:text-white mb-4 inline-flex items-center gap-1"
      >
        ← Back to templates
      </Link>

      <form action={renameTemplate} className="mb-6 flex gap-3 items-center">
        <input type="hidden" name="id" value={template.id} />
        <input
          name="name"
          defaultValue={template.name}
          className="text-2xl font-bold bg-transparent border-0 border-b border-slate-700 focus:border-[#a86060] focus:outline-none px-1 flex-1"
        />
        <SubmitButton className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
          Save name
        </SubmitButton>
      </form>

      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Add Mass
        </h2>
        <form
          action={addTemplateItem}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-[120px_120px_1fr_120px_auto] gap-3"
        >
          <input type="hidden" name="template_id" value={template.id} />
          <select
            name="day_offset"
            defaultValue="0"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="0">Saturday</option>
            <option value="1">Sunday</option>
          </select>
          <input
            name="start_time"
            type="time"
            required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="label"
            placeholder="Label (e.g. Saturday 4:00 PM)"
            required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <input
            name="location"
            defaultValue="SJA"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm"
          />
          <SubmitButton className="px-4 py-2 bg-[#a86060] hover:bg-[#b87070] rounded-lg text-sm font-semibold text-white cursor-pointer">
            Add Mass
          </SubmitButton>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          New Masses get default slots: Team Lead × 1, Medic × 1, Team Member ×
          3. You can change capacities below.
        </p>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Masses in this template ({items.length})
        </h2>
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              No Masses yet. Add one above.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-xs text-slate-500">
                      {DAY_LABELS[item.day_offset] ?? "?"} ·{" "}
                      {item.start_time.slice(0, 5)} · {item.location}
                    </div>
                  </div>
                  <form action={deleteTemplateItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="template_id"
                      value={template.id}
                    />
                    <SubmitButton className="text-xs text-red-300 hover:bg-red-900/20 px-2 py-1 rounded-lg cursor-pointer">
                      Remove Mass
                    </SubmitButton>
                  </form>
                </div>
                <div className="divide-y divide-slate-800">
                  {item.mass_template_slots
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((slot) => (
                      <form
                        key={slot.id}
                        action={updateTemplateSlot}
                        className="px-5 py-3 flex items-center justify-between gap-3"
                      >
                        <input type="hidden" name="id" value={slot.id} />
                        <input
                          type="hidden"
                          name="template_id"
                          value={template.id}
                        />
                        <div className="text-sm font-medium flex-1">
                          {slot.role}
                        </div>
                        <label className="text-xs text-slate-500">
                          Capacity
                        </label>
                        <input
                          name="capacity"
                          type="number"
                          min={1}
                          defaultValue={slot.capacity}
                          className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm"
                        />
                        <SubmitButton className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
                          Save
                        </SubmitButton>
                      </form>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
