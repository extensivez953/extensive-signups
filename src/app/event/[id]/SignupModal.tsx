"use client";

import { useState } from "react";
import { signUpForSlot } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

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
        className="px-3 py-1 bg-[#832b2b] hover:bg-[#a04444] text-white rounded-lg text-xs font-semibold cursor-pointer"
      >
        Sign Up
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Sign me up</h2>
                <p className="text-sm text-gray-500">
                  {slotLabel} · {formatDate(massDate)} ·{" "}
                  {massTime.slice(0, 5)}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-900 cursor-pointer"
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
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
                />
              </label>

              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAltName}
                  onChange={(e) => setUseAltName(e.target.checked)}
                  className="rounded border-gray-300 bg-gray-100 text-[#832b2b] focus:ring-[#832b2b]"
                />
                <span className="text-sm text-gray-700">
                  Sign up with a different display name (e.g. spouse, child)
                </span>
              </label>

              {useAltName && (
                <input
                  name="display_name"
                  placeholder="Display name"
                  className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-[#832b2b] focus:outline-none focus:border-transparent"
                />
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <SubmitButton className="flex-1 py-2.5 px-4 bg-[#832b2b] hover:bg-[#a04444] rounded-lg text-sm font-semibold text-white cursor-pointer">
                  Confirm Signup
                </SubmitButton>
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
