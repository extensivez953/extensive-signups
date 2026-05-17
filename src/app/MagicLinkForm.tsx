"use client";

import { useState } from "react";
import { sendLoginMagicLink } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function MagicLinkForm({ sentTo }: { sentTo?: string }) {
  const [expanded, setExpanded] = useState(Boolean(sentTo));

  if (sentTo) {
    return (
      <div className="mt-6 bg-green-900/20 border border-green-800 rounded-xl p-4 text-sm text-green-200 text-left">
        <div className="font-semibold mb-1">Check your email</div>
        <div className="text-green-200/80">
          We sent a sign-in link to <strong>{sentTo}</strong>. Click it from
          your inbox to sign in. The link works for 1 hour.
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-3 px-4 rounded-xl cursor-pointer transition"
      >
        Continue with Email
      </button>
    );
  }

  return (
    <form action={sendLoginMagicLink} className="mt-3">
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        required
        autoFocus
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
      />
      <SubmitButton className="mt-2 w-full bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-3 px-4 rounded-xl cursor-pointer transition">
        Send me a sign-in link
      </SubmitButton>
      <button
        type="button"
        onClick={() => setExpanded(false)}
        className="mt-2 text-xs text-slate-500 hover:text-slate-300"
      >
        ← back
      </button>
    </form>
  );
}
