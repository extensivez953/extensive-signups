/**
 * Generate an iCalendar (RFC 5545) event body for one slot signup.
 * Returns the raw .ics text content.
 *
 * Notes:
 * - We use floating local time (no TZID) since masses are at a single physical
 *   location and we want "8:30 AM" to mean 8:30 AM wherever the calendar app
 *   is showing it. If the church ever needs strict timezone handling, swap
 *   to TZID=America/Chicago (or whatever) here.
 * - Duration is hardcoded to 1.5 hours per Mass commitment.
 */
export function generateICalForSlot(opts: {
  uid: string; // stable unique id, use the signup id
  role: string;
  location: string;
  massDate: string; // YYYY-MM-DD
  massTime: string; // HH:MM:SS
  durationHours?: number; // defaults to 1.5
  eventUrl?: string; // optional link back to the signup page
}) {
  const duration = opts.durationHours ?? 1.5;

  const [y, m, d] = opts.massDate.split("-").map(Number);
  const [hh, mm] = opts.massTime.split(":").map(Number);

  const start = new Date(y, m - 1, d, hh, mm, 0);
  const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

  const fmt = (dt: Date) =>
    [
      dt.getFullYear(),
      pad(dt.getMonth() + 1),
      pad(dt.getDate()),
      "T",
      pad(dt.getHours()),
      pad(dt.getMinutes()),
      "00",
    ].join("");

  const summary = `Safety Team: ${opts.role}`;
  const description = opts.eventUrl
    ? `Manage your signup: ${opts.eventUrl}`
    : "St John the Apostle Safety Team";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Extensive Signups//SJA Safety Team//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@signup.extensive.cloud`,
    `DTSTAMP:${fmt(new Date()).replace(/\D/g, "").slice(0, 8)}T${fmt(new Date()).replace(/\D/g, "").slice(8, 14)}Z`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeICalText(summary)}`,
    `LOCATION:${escapeICalText(opts.location)}`,
    `DESCRIPTION:${escapeICalText(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function escapeICalText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
