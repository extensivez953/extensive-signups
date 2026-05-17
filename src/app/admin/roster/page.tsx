import { createClient } from "@/lib/supabase/server";
import { addMember, updateMember, deleteMember } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "member";
  active: boolean;
};

export default async function RosterPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("members")
    .select("id, name, email, phone, role, active")
    .order("active", { ascending: false })
    .order("name");

  const list = (members ?? []) as Member[];
  const active = list.filter((m) => m.active);
  const pending = list.filter((m) => !m.active);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Roster</h1>
        <div className="text-sm text-slate-500">
          {active.length} active · {pending.length} pending
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Add new member
        </h2>
        <form
          action={addMember}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_140px_auto] gap-3"
        >
          <input
            name="name"
            placeholder="Full name"
            required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
          />
          <input
            name="email"
            type="email"
            placeholder="Gmail address"
            required
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
          />
          <select
            name="role"
            defaultValue="member"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <SubmitButton className="px-4 py-2 bg-[#832b2b] hover:bg-[#a04444] rounded-lg text-sm font-semibold text-white cursor-pointer">
            Add
          </SubmitButton>
        </form>
      </section>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
            Pending activation ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((m) => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          Active ({active.length})
        </h2>
        <div className="space-y-2">
          {active.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500 text-sm">
              No active members yet.
            </div>
          ) : (
            active.map((m) => <MemberRow key={m.id} member={m} />)
          )}
        </div>
      </section>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <form
      action={updateMember}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3"
    >
      <input type="hidden" name="id" value={member.id} />
      <div className="w-10 h-10 bg-[#751313] rounded-full flex items-center justify-center font-semibold text-sm">
        {member.name
          .split(" ")
          .map((p) => p[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()}
      </div>
      <input
        name="name"
        defaultValue={member.name}
        className="flex-1 min-w-0 bg-transparent border-0 px-2 py-1 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none rounded-md"
      />
      <input
        name="email"
        type="email"
        defaultValue={member.email}
        className="flex-1 min-w-0 bg-transparent border-0 px-2 py-1 text-xs text-slate-400 focus:ring-2 focus:ring-[#832b2b] focus:outline-none rounded-md"
      />
      <input
        name="phone"
        defaultValue={member.phone ?? ""}
        placeholder="Phone"
        className="w-32 bg-transparent border-0 px-2 py-1 text-xs text-slate-400 focus:ring-2 focus:ring-[#832b2b] focus:outline-none rounded-md"
      />
      <select
        name="role"
        defaultValue={member.role}
        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <select
        name="active"
        defaultValue={member.active ? "true" : "false"}
        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs"
      >
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <SubmitButton className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer">
        Save
      </SubmitButton>
      <SubmitButton
        formAction={deleteMember}
        className="text-xs px-2 py-1.5 text-red-300 hover:bg-red-900/20 rounded-lg cursor-pointer"
        title="Remove"
      >
        ✕
      </SubmitButton>
    </form>
  );
}
