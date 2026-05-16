"use client";

import { useState } from "react";
import { signUpForSlot } from "./actions";

export function SignupModal({
  slotId,
  eventId,
  slotLabel,
  massDate,
  massTime,
}: {
  slotId: string;
  eventId: string;
  slotLabel: string;
  massDate: string;
  massTime: string;
}) {
  const [open, setOpen] = useState(false);
  const [useAltName, setUseAltName] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 bg-[#a86060] hover:bg-[#b87070] text-white rounded-lg text-xs font-semibold cursor-pointer"
      >
        Sign Up
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Sign me up</h2>
                <p className="text-sm text-slate-400">
                  {slotLabel} · {formatDate(massDate)} ·{" "}
                  {massTime.slice(0, 5)}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form action={signUpForSlot}>
              <input type="hidden" name="slot_id" value={slotId} />
              <input type="hidden" name="event_id" value={eventId} />

              <label className="block mb-5">
                <div className="text-sm font-medium mb-2">
                  Comment (optional)
                </div>
                <textarea
                  name="comment"
                  rows={2}
                  placeholder="Anything to mention..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
                />
              </label>

              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAltName}
                  onChange={(e) => setUseAltName(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-[#a86060] focus:ring-[#a86060]"
                />
                <span className="text-sm text-slate-300">
                  Sign up with a different display name (e.g. spouse, child)
                </span>
              </label>

              {useAltName && (
                <input
                  name="display_name"
                  placeholder="Display name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-[#a86060] focus:outline-none focus:border-transparent"
                />
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-[#a86060] hover:bg-[#b87070] rounded-lg text-sm font-semibold text-white cursor-pointer"
                >
                  Confirm Signup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
