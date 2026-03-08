import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "Luxvibe <bookings@luxvibe.io>";

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

const EMAIL_HEADER = `
  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1e3a5f 0%,#152d4a 100%);padding:40px 40px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;text-transform:uppercase;">LUXVIBE</h1>
      <p style="margin:10px 0 0;color:#7ea8cc;font-size:13px;letter-spacing:1px;font-style:italic;">Luxury Stays. Unbeatable Rates.</p>
    </td>
  </tr>
`;

const EMAIL_FOOTER = (to: string) => `
  <!-- Footer -->
  <tr>
    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:28px 40px;text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.7;">
        You're receiving this because you booked through Luxvibe.<br/>
        Questions? Contact <a href="mailto:hello@luxvibe.io" style="color:#1e3a5f;font-weight:600;text-decoration:none;">hello@luxvibe.io</a>
      </p>
      <p style="margin:12px 0 0;color:#9ca3af;font-size:11px;">© ${new Date().getFullYear()} Luxvibe. All rights reserved.</p>
    </td>
  </tr>
`;

export async function sendBookingConfirmationEmail(opts: {
  to: string;
  guestName: string;
  bookingId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  price: string | number;
  currency: string;
  confirmationCode?: string;
}) {
  const {
    to,
    guestName,
    bookingId,
    hotelName,
    checkIn,
    checkOut,
    roomType,
    price,
    currency,
    confirmationCode,
  } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed – Luxvibe</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:40px 0;">
    <tr><td align="center" style="padding:0 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        ${EMAIL_HEADER}

        <!-- Success Banner -->
        <tr>
          <td style="background:#059669;padding:18px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:0.5px;">✓ &nbsp;Booking Confirmed!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#111827;font-size:17px;font-weight:600;">Hi ${guestName},</p>
            <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7;">
              Your reservation at <strong style="color:#111827;">${hotelName}</strong> is confirmed. We look forward to welcoming you.
            </p>

            <!-- Booking ID Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e3a5f 0%,#2463eb 100%);border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0;color:#93c5fd;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Booking Reference</p>
                        <p style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;font-family:monospace;letter-spacing:1px;">${bookingId}</p>
                      </td>
                      ${
                        confirmationCode
                          ? `<td style="text-align:right;">
                        <p style="margin:0;color:#93c5fd;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Conf. Code</p>
                        <p style="margin:6px 0 0;color:#ffffff;font-size:16px;font-weight:600;">${confirmationCode}</p>
                      </td>`
                          : ""
                      }
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:32px;">
              <tr style="background:#f8fafc;">
                <td colspan="2" style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Hotel</p>
                  <p style="margin:5px 0 0;color:#111827;font-size:16px;font-weight:700;">${hotelName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;width:50%;vertical-align:top;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Check-in</p>
                  <p style="margin:5px 0 0;color:#111827;font-size:15px;font-weight:600;">${fmtDate(checkIn)}</p>
                </td>
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;width:50%;vertical-align:top;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Check-out</p>
                  <p style="margin:5px 0 0;color:#111827;font-size:15px;font-weight:600;">${fmtDate(checkOut)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-right:1px solid #e5e7eb;width:50%;vertical-align:top;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Room Type</p>
                  <p style="margin:5px 0 0;color:#111827;font-size:15px;font-weight:600;">${roomType}</p>
                </td>
                <td style="padding:16px 20px;width:50%;vertical-align:top;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Total Paid</p>
                  <p style="margin:5px 0 0;color:#1e3a5f;font-size:20px;font-weight:800;">${currency} ${Number(price).toFixed(2)}</p>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="https://luxvibe.io/my-bookings"
                     style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#2463eb 100%);color:#ffffff;padding:15px 40px;border-radius:50px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.5px;">
                    View My Booking &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">We hope you have an extraordinary stay.<br/>
            <strong style="color:#111827;">The Luxvibe Team</strong></p>
          </td>
        </tr>

        ${EMAIL_FOOTER(to)}

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Booking Confirmed – ${hotelName} | Luxvibe`,
      html,
    });
    console.log(
      "[email] Booking confirmation sent to",
      to,
      "id:",
      result?.data?.id,
    );
    return result;
  } catch (err: any) {
    console.error(
      "[email] Failed to send booking confirmation:",
      err?.message || err,
    );
    throw err;
  }
}

export async function sendCancellationEmail(opts: {
  to: string;
  guestName: string;
  bookingId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
}) {
  const { to, guestName, bookingId, hotelName, checkIn, checkOut } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Cancelled – Luxvibe</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:40px 0;">
    <tr><td align="center" style="padding:0 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        ${EMAIL_HEADER}

        <!-- Cancelled Banner -->
        <tr>
          <td style="background:#d97706;padding:18px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:0.5px;">✕ &nbsp;Booking Cancelled</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#111827;font-size:17px;font-weight:600;">Hi ${guestName},</p>
            <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7;">
              Your reservation at <strong style="color:#111827;">${hotelName}</strong> has been cancelled. Below are the details of the cancelled booking for your records.
            </p>

            <!-- Booking ID Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#78350f;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;color:#fcd34d;font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Cancelled Booking ID</p>
                  <p style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:700;font-family:monospace;letter-spacing:1px;">${bookingId}</p>
                </td>
              </tr>
            </table>

            <!-- Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:32px;">
              <tr style="background:#f8fafc;">
                <td colspan="2" style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Hotel</p>
                  <p style="margin:5px 0 0;color:#111827;font-size:16px;font-weight:700;">${hotelName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;border-right:1px solid #e5e7eb;width:50%;vertical-align:top;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Check-in (was)</p>
                  <p style="margin:5px 0 0;color:#6b7280;font-size:15px;font-weight:600;text-decoration:line-through;">${fmtDate(checkIn)}</p>
                </td>
                <td style="padding:16px 20px;width:50%;vertical-align:top;">
                  <p style="margin:0;color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Check-out (was)</p>
                  <p style="margin:5px 0 0;color:#6b7280;font-size:15px;font-weight:600;text-decoration:line-through;">${fmtDate(checkOut)}</p>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="https://luxvibe.io"
                     style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#2463eb 100%);color:#ffffff;padding:15px 40px;border-radius:50px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:0.5px;">
                    Find Another Hotel &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.7;">
              If you did not request this cancellation, please contact us at <a href="mailto:hello@luxvibe.io" style="color:#1e3a5f;font-weight:600;text-decoration:none;">hello@luxvibe.io</a>.<br/>
              <strong style="color:#111827;">The Luxvibe Team</strong>
            </p>
          </td>
        </tr>

        ${EMAIL_FOOTER(to)}

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Booking Cancelled – ${hotelName} | Luxvibe`,
      html,
    });
    console.log(
      "[email] Cancellation email sent to",
      to,
      "id:",
      result?.data?.id,
    );
    return result;
  } catch (err: any) {
    console.error(
      "[email] Failed to send cancellation email:",
      err?.message || err,
    );
    throw err;
  }
}

export async function sendBugReportEmail(opts: {
  title: string;
  description: string;
  email?: string;
}) {
  const { title, description, email: userEmail } = opts;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bug Report from Luxvibe</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:4px;">BUG REPORT</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 24px;color:#1a1a2e;font-size:20px;font-weight:600;">${title}</h2>
            
            <div style="background:#f9fafb;border-left:4px solid #ef4444;padding:16px 20px;margin-bottom:32px;border-radius:4px;">
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
                ${description.replace(/\n/g, '<br />')}
              </p>
            </div>

            ${userEmail ? `<p style="margin:0;color:#6b7280;font-size:13px;">
              <strong>User Email:</strong> ${userEmail}
            </p>` : ''}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">This bug report was submitted via Luxvibe</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: "hello@luxvibe.io",
      subject: `🐛 Bug Report: ${title}`,
      html,
      replyTo: userEmail || "noreply@luxvibe.io",
    });
    console.log("[email] Bug report sent, id:", result?.data?.id);
    return result;
  } catch (err: any) {
    console.error("[email] Failed to send bug report:", err?.message || err);
    throw err;
  }
}

export async function sendInviteEmail(opts: {
  to: string;
  senderName: string;
  referralLink: string;
}) {
  const { to, senderName, referralLink } = opts;

  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to Luxvibe</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Plus Jakarta Sans',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center" style="padding:0 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.06);overflow:hidden;">

        <!-- Body -->
        <tr>
          <td style="padding:48px 48px 40px;text-align:center;">
            <!-- Logo -->
            <p style="margin:0 0 36px;font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#1e3a5f;letter-spacing:2px;">Luxvibe</p>

            <!-- Body copy -->
            <p style="margin:0 0 32px;font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;color:#374151;line-height:1.65;">
              ${senderName} invited you to check out Luxvibe — great rates on luxury hotels worldwide.
            </p>

            <!-- CTA -->
            <a href="${referralLink}"
               style="display:inline-block;background:#2463eb;color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-family:'Plus Jakarta Sans',sans-serif;font-size:16px;font-weight:600;">
              View Luxvibe
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid #e5e7eb;padding:20px 48px;text-align:center;">
            <p style="margin:0;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#9ca3af;">
              © ${year} Luxvibe &middot; You received this because ${senderName} invited you.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${senderName} invited you to check out Luxvibe — great rates on luxury hotels worldwide.

Visit: ${referralLink}

— Luxvibe`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${senderName} invited you to Luxvibe`,
      html,
      text,
    });
    console.log("[email] Invite sent to", to, "id:", result?.data?.id);
    return result;
  } catch (err: any) {
    console.error("[email] Failed to send invite:", err?.message || err);
    throw err;
  }
}
