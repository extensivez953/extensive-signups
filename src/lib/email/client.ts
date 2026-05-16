import { Resend } from "resend";

let _client: Resend | null = null;

export function resend(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");
    _client = new Resend(key);
  }
  return _client;
}

export const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "Safety Team <noreply@extensive.cloud>";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
