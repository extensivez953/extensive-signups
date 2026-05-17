export const metadata = {
  title: "Privacy Policy — Safety Team Signups",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-5">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to home
        </a>
        <h1 className="text-3xl font-bold mt-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500">Last updated: 2026</p>

        <p>
          The Safety Team Signups application (the &ldquo;App&rdquo;) is a
          volunteer scheduling tool for the safety/security team at St John the
          Apostle Catholic Church. This policy describes what information the
          App collects and how it&apos;s used.
        </p>

        <Section title="Who runs this">
          <p>
            The App is operated by the St John the Apostle safety team
            coordinator. Contact: <code className="bg-gray-100 px-1 rounded">extensive@gmail.com</code>.
          </p>
        </Section>

        <Section title="What we collect">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Your Google account email and name</strong>, used to
              verify you&apos;re an authorized team member.
            </li>
            <li>
              <strong>Phone number</strong>, if you choose to add one to your
              profile (optional).
            </li>
            <li>
              <strong>Your signup history</strong> — which Masses you committed
              to, when, and any comments you left.
            </li>
          </ul>
        </Section>

        <Section title="What we don't do">
          <ul className="list-disc pl-6 space-y-1">
            <li>We do not sell your data.</li>
            <li>We do not show advertisements.</li>
            <li>We do not use third-party analytics or tracking.</li>
            <li>
              We do not share your information with anyone outside the safety
              team coordinator and other active team members on this app.
            </li>
          </ul>
        </Section>

        <Section title="Who can see your data">
          <p>
            Other active team members can see your name and which slots
            you&apos;ve signed up for — this is necessary for coordinating
            coverage. Admins can additionally see your email, phone (if
            provided), and full signup history.
          </p>
        </Section>

        <Section title="Where data is stored">
          <p>
            Data is stored in a Postgres database hosted by Supabase Inc.
            Authentication is handled by Google Sign-In. We use Cloudflare for
            web hosting.
          </p>
        </Section>

        <Section title="How to delete your data">
          <p>
            Contact the safety team coordinator. They can remove you from the
            roster, which deletes your member record and signup history.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to this policy, we&apos;ll update the
            &ldquo;Last updated&rdquo; date at the top.
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
