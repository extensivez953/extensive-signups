import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { createTemplate, deleteTemplate } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

type Template = {
  id: string;
  name: string;
  created_at: string;
  mass_template_items: { count: number }[];
};

export default async function TemplatesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mass_templates")
    .select("id, name, created_at, mass_template_items(count)")
    .order("created_at", { ascending: false });

  const templates = (data ?? []) as Template[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mass Templates</h1>
        <form action={createTemplate}>
          <SubmitButton className="px-4 py-2 bg-[#a86060] hover:bg-[#b87070] rounded-lg text-sm font-semibold text-white cursor-pointer">
            + New Template
          </SubmitButton>
        </form>
      </div>

      <p className="text-sm text-slate-400 mb-6">
        Templates let you pre-define a Mass schedule (e.g. &ldquo;Standard
        Weekend&rdquo; = Saturday 4pm + Sunday 7:30, 9:15, 11:00) so you can
        quickly create events without filling out every Mass from scratch.
      </p>

      <div className="space-y-2">
        {templates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            No templates yet. Click &ldquo;New Template&rdquo; to start.
          </div>
        ) : (
          templates.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition"
            >
              <Link href={`/admin/templates/${t.id}`} className="flex-1">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {t.mass_template_items?.[0]?.count ?? 0} Masses
                </div>
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`/admin/templates/${t.id}`}
                  className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Edit
                </Link>
                <form action={deleteTemplate}>
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton className="text-xs px-2 py-1.5 text-red-300 hover:bg-red-900/20 rounded-lg cursor-pointer">
                    ✕
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
