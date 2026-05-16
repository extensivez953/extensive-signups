import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signInWithGoogle } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { MagicLinkForm } from "./MagicLinkForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; msg?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in → straight to dashboard
  if (user) redirect("/dashboard");

  const { error, sent, msg } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#a86060] rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-8 h-8 text-white"
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
        <h1 className="text-3xl font-bold mb-2 text-slate-100">
          Safety Team Signups
        </h1>
        <p className="text-slate-400 mb-10">St John the Apostle</p>

        {error === "auth" && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-200">
            Sign-in failed. Please try again.
          </div>
        )}
        {error === "email" && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-200">
            {msg ?? "Couldn't send the sign-in link. Please try again."}
          </div>
        )}

        <form action={signInWithGoogle}>
          <SubmitButton className="w-full bg-white text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-slate-100 transition cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Continue with Google
          </SubmitButton>
        </form>

        <MagicLinkForm sentTo={sent} />

        <p className="mt-8 text-xs text-slate-500">
          Sign in is restricted to team members.
          <br />
          Contact Mike Repa if you need access.
        </p>
        <p className="mt-6 text-xs text-slate-600">
          <a href="/privacy" className="hover:text-slate-400 underline">
            Privacy
          </a>
          {" · "}
          <a href="/terms" className="hover:text-slate-400 underline">
            Terms
          </a>
        </p>
      </div>
    </div>
  );
}
