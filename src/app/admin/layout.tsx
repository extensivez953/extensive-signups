import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#832b2b] rounded-lg flex items-center justify-center">
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
              <div className="font-semibold">Safety Team · Admin</div>
              <div className="text-xs text-gray-500">St John the Apostle</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900">
              ← Back to my view
            </Link>
            <span className="text-slate-700">·</span>
            <span>{admin.name}</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px">
            <AdminTab href="/admin/events" label="Events" />
            <AdminTab href="/admin/roster" label="Roster" />
            <AdminTab href="/admin/templates" label="Templates" />
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300"
    >
      {label}
    </Link>
  );
}
