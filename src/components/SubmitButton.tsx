"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Drop-in replacement for <button type="submit"> inside a <form action={...}>.
 *
 * When the form's server action is in flight (useFormStatus().pending === true):
 *   - shows an inline spinner
 *   - disables the button
 *   - keeps the original button size so the layout doesn't jump
 *
 * Works for both server-action forms (the bulk of our buttons) and any
 * client-component form. Must be a child of a <form>; outside a form it just
 * renders as a normal button.
 *
 * Example:
 *   <form action={signUpForSlot}>
 *     <SubmitButton className="...">Confirm Signup</SubmitButton>
 *   </form>
 */
export function SubmitButton({
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      {...rest}
      disabled={pending || rest.disabled}
      className={`relative ${className} ${
        pending ? "cursor-wait" : ""
      } disabled:opacity-70`}
      aria-busy={pending}
    >
      <span className={pending ? "invisible" : ""}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
