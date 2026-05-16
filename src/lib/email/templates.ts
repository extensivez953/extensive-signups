/**
 * Plain HTML email templates. Kept inline + simple — no MJML or React Email,
 * just hand-written HTML strings that render well in Gmail / Apple Mail / Outlook.
 *
 * Design language:
 *   - Light background, dark text (most clients dark-mode invert anyway)
 *   - Single column, no fancy CSS
 *   - Maroon accent (#a86060)
 */

const ACCENT = "#a86060";
const ACCENT_DARK = "#8a4f4f";

function shell(opts: { subject: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escape(opts.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:${ACCENT};padding:24px 32px;color:#ffffff;">
                <div style="font-size:14px;opacity:0.85;">St John the Apostle</div>
                <div style="font-size:20px;font-weight:700;margin-top:4px;">Safety Team Signups</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;font-size:12px;color:#888;">
                This is an automated message from the Safety Team Signups app.
                If you have questions, contact Matt Dooley.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:15px;">${escape(text)}</a>`;
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Email sent when an admin publishes an event (invites the roster). */
export function inviteEmail(opts: {
  recipientName: string;
  eventName: string;
  eventDescription: string | null;
  eventUrl: string;
}) {
  const subject = opts.eventName;
  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-size:15px;">Hi ${escape(opts.recipientName.split(" ")[0])},</p>
    <p style="margin:0 0 12px 0;font-size:15px;">A new signup is open. Please pick your slot when you have a moment.</p>
    ${
      opts.eventDescription
        ? `<p style="margin:16px 0;padding:12px 16px;background:#faf0f0;border-left:3px solid ${ACCENT};font-size:14px;color:#555;">${escape(opts.eventDescription)}</p>`
        : ""
    }
    <div style="margin:24px 0;">${button("View & Sign Up", opts.eventUrl)}</div>
    <p style="margin:24px 0 0 0;font-size:13px;color:#888;">
      Thanks for serving — Matt
    </p>
  `;
  return { subject, html: shell({ subject, bodyHtml }) };
}

/** Email sent when a member signs up for a slot. Includes iCal attachment. */
export function confirmationEmail(opts: {
  recipientName: string;
  eventName: string;
  role: string;
  massLabel: string;
  massDate: string;
  massTime: string;
  location: string;
  eventUrl: string;
  cancelUrl: string;
}) {
  const subject = `Confirmed: ${opts.role} · ${opts.massLabel}`;
  const dateStr = new Date(opts.massDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-size:15px;">Hi ${escape(opts.recipientName.split(" ")[0])},</p>
    <p style="margin:0 0 16px 0;font-size:15px;">You&apos;re signed up. Thank you for serving.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="background:#faf0f0;border-left:3px solid ${ACCENT};padding:16px 20px;border-radius:4px;margin:16px 0;">
      <tr><td style="padding:0;">
        <div style="font-weight:700;font-size:16px;color:${ACCENT_DARK};">${escape(opts.role)}</div>
        <div style="margin-top:6px;font-size:14px;color:#555;">${escape(dateStr)} · ${escape(opts.massTime.slice(0, 5))}</div>
        <div style="font-size:14px;color:#888;">${escape(opts.location)}</div>
      </td></tr>
    </table>
    <p style="margin:24px 0 12px 0;font-size:14px;color:#666;">A calendar invite is attached. Open it on your phone to add this to your calendar.</p>
    <div style="margin:24px 0;">${button("View Event Page", opts.eventUrl)}</div>
    <p style="margin:24px 0 0 0;font-size:13px;color:#888;">
      Can&apos;t make it? <a href="${opts.cancelUrl}" style="color:${ACCENT};">Cancel this signup</a>.
    </p>
  `;
  return { subject, html: shell({ subject, bodyHtml }) };
}

/** Reminder email sent N hours before a Mass shift. */
export function reminderEmail(opts: {
  recipientName: string;
  role: string;
  massLabel: string;
  massDate: string;
  massTime: string;
  location: string;
  hoursOut: number;
  eventUrl: string;
  cancelUrl: string;
}) {
  const subject = `Reminder: ${opts.role} · ${opts.massLabel}`;
  const dateStr = new Date(opts.massDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-size:15px;">Hi ${escape(opts.recipientName.split(" ")[0])},</p>
    <p style="margin:0 0 16px 0;font-size:15px;">Reminder: your safety team shift is in ${opts.hoursOut} hour${opts.hoursOut === 1 ? "" : "s"}.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="background:#faf0f0;border-left:3px solid ${ACCENT};padding:16px 20px;border-radius:4px;margin:16px 0;">
      <tr><td style="padding:0;">
        <div style="font-weight:700;font-size:16px;color:${ACCENT_DARK};">${escape(opts.role)}</div>
        <div style="margin-top:6px;font-size:14px;color:#555;">${escape(dateStr)} · ${escape(opts.massTime.slice(0, 5))}</div>
        <div style="font-size:14px;color:#888;">${escape(opts.location)}</div>
      </td></tr>
    </table>
    <p style="margin:24px 0 0 0;font-size:13px;color:#888;">
      <a href="${opts.cancelUrl}" style="color:${ACCENT};">Need to cancel?</a>
      &nbsp;&middot;&nbsp;
      <a href="${opts.eventUrl}" style="color:${ACCENT};">View event</a>
    </p>
  `;
  return { subject, html: shell({ subject, bodyHtml }) };
}

/** Gap-alert email to admins/recipients when a slot is unfilled near deadline. */
export function gapAlertEmail(opts: {
  recipientName: string;
  eventName: string;
  unfilledList: { role: string; massLabel: string; massDate: string }[];
  eventUrl: string;
}) {
  const subject = `${opts.unfilledList.length} slot${opts.unfilledList.length === 1 ? "" : "s"} unfilled: ${opts.eventName}`;
  const rows = opts.unfilledList
    .map(
      (s) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;"><strong>${escape(s.role)}</strong> · ${escape(s.massLabel)} · ${escape(
          new Date(s.massDate + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
        )}</td></tr>`,
    )
    .join("");
  const bodyHtml = `
    <p style="margin:0 0 12px 0;font-size:15px;">Hi ${escape(opts.recipientName.split(" ")[0])},</p>
    <p style="margin:0 0 16px 0;font-size:15px;">Heads up — the following slots are still open as the deadline approaches:</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;">
      ${rows}
    </table>
    <div style="margin:24px 0;">${button("Open Admin Dashboard", opts.eventUrl)}</div>
  `;
  return { subject, html: shell({ subject, bodyHtml }) };
}
