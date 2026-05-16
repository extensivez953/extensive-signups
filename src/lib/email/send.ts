import { resend, FROM_ADDRESS, SITE_URL } from "./client";
import {
  inviteEmail,
  confirmationEmail,
  reminderEmail,
  gapAlertEmail,
} from "./templates";
import { generateICalForSlot } from "@/lib/ical";

type EmailSendable = boolean;

/** Returns true if email is configured (RESEND_API_KEY set). */
export function emailConfigured(): EmailSendable {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Logs to console if email isn't configured, then returns silently. Used everywhere as a soft no-op. */
async function safeSend(args: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}) {
  if (!emailConfigured()) {
    console.log("[email:dev]", args.to, "—", args.subject);
    return { skipped: true };
  }
  try {
    const r = await resend().emails.send({
      from: FROM_ADDRESS,
      to: args.to,
      subject: args.subject,
      html: args.html,
      attachments: args.attachments,
    });
    return r;
  } catch (e) {
    console.error("[email:send-failed]", e);
    return { error: String(e) };
  }
}

export async function sendInvite(opts: {
  to: string;
  recipientName: string;
  eventId: string;
  eventName: string;
  eventDescription: string | null;
}) {
  const eventUrl = `${SITE_URL}/event/${opts.eventId}`;
  const { subject, html } = inviteEmail({
    recipientName: opts.recipientName,
    eventName: opts.eventName,
    eventDescription: opts.eventDescription,
    eventUrl,
  });
  return safeSend({ to: opts.to, subject, html });
}

export async function sendConfirmation(opts: {
  to: string;
  recipientName: string;
  eventId: string;
  eventName: string;
  signupId: string;
  role: string;
  massLabel: string;
  massDate: string;
  massTime: string;
  location: string;
}) {
  const eventUrl = `${SITE_URL}/event/${opts.eventId}`;
  const cancelUrl = `${SITE_URL}/dashboard`;
  const { subject, html } = confirmationEmail({
    recipientName: opts.recipientName,
    eventName: opts.eventName,
    role: opts.role,
    massLabel: opts.massLabel,
    massDate: opts.massDate,
    massTime: opts.massTime,
    location: opts.location,
    eventUrl,
    cancelUrl,
  });
  const ics = generateICalForSlot({
    uid: opts.signupId,
    role: opts.role,
    location: opts.location,
    massDate: opts.massDate,
    massTime: opts.massTime,
    eventUrl,
  });
  return safeSend({
    to: opts.to,
    subject,
    html,
    attachments: [{ filename: "calendar.ics", content: ics }],
  });
}

export async function sendReminder(opts: {
  to: string;
  recipientName: string;
  eventId: string;
  role: string;
  massLabel: string;
  massDate: string;
  massTime: string;
  location: string;
  hoursOut: number;
}) {
  const eventUrl = `${SITE_URL}/event/${opts.eventId}`;
  const cancelUrl = `${SITE_URL}/dashboard`;
  const { subject, html } = reminderEmail({
    recipientName: opts.recipientName,
    role: opts.role,
    massLabel: opts.massLabel,
    massDate: opts.massDate,
    massTime: opts.massTime,
    location: opts.location,
    hoursOut: opts.hoursOut,
    eventUrl,
    cancelUrl,
  });
  return safeSend({ to: opts.to, subject, html });
}

export async function sendGapAlert(opts: {
  to: string;
  recipientName: string;
  eventId: string;
  eventName: string;
  unfilledList: { role: string; massLabel: string; massDate: string }[];
}) {
  const eventUrl = `${SITE_URL}/admin/events/${opts.eventId}`;
  const { subject, html } = gapAlertEmail({
    recipientName: opts.recipientName,
    eventName: opts.eventName,
    unfilledList: opts.unfilledList,
    eventUrl,
  });
  return safeSend({ to: opts.to, subject, html });
}
