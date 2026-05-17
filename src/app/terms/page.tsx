export const metadata = {
  title: "Terms of Service — Safety Team Signups",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-5">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to home
        </a>
        <h1 className="text-3xl font-bold mt-4">Terms of Service</h1>
        <p className="text-sm text-gray-500">Last updated: 2026</p>

        <p>
          The Safety Team Signups application (the &ldquo;App&rdquo;) is
          provided free of charge to authorized members of the St John the
          Apostle safety/security team for the sole purpose of coordinating
          volunteer Mass coverage.
        </p>

        <Section title="Authorized use">
          <p>
            Access is restricted to team members who have been added to the
            roster by the team coordinator. By signing in, you confirm
            you&apos;re an authorized member.
          </p>
        </Section>

        <Section title="Acceptable use">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Sign up only for slots you intend to fulfill. Cancel as early as
              possible if you can&apos;t make it.
            </li>
            <li>
              Don&apos;t share your sign-in credentials. Use your own Google
              account.
            </li>
            <li>
              Don&apos;t attempt to access or modify other members&apos;
              signups or data.
            </li>
          </ul>
        </Section>

        <Section title="No warranty">
          <p>
            The App is provided as-is, without warranty. The operator makes no
            guarantee of uptime, data preservation, or fitness for any
            particular purpose. Use it as a coordination convenience, not as a
            critical system of record.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            The team coordinator may remove your access at any time. You may
            request to be removed at any time by contacting the coordinator.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            These terms may be updated. The &ldquo;Last updated&rdquo; date
            above reflects the current version.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold mt-8 mb-3">{title}</h2>
      {children}
    </div>
  );
}
