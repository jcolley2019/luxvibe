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
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:4px;">LUXVIBE</h1>
            <p style="margin:8px 0 0;color:#a0a0c0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Your Travel Escape</p>
          </td>
        </tr>

        <!-- Success Banner -->
        <tr>
          <td style="background:#10b981;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">✓ Booking Confirmed!</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${guestName},</p>
            <p style="margin:0 0 32px;color:#374151;font-size:16px;line-height:1.6;">
              Great news — your reservation at <strong>${hotelName}</strong> is confirmed. Here's everything you need to know.
            </p>

            <!-- Booking ID Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%">
                    <tr>
                      <td>
                        <p style="margin:0;color:#a0a0c0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Booking ID</p>
                        <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;font-family:monospace;">${bookingId}</p>
                      </td>
                      ${
                        confirmationCode
                          ? `<td style="text-align:right;">
                        <p style="margin:0;color:#a0a0c0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Conf. Code</p>
                        <p style="margin:4px 0 0;color:#ffffff;font-size:16px;font-weight:600;">${confirmationCode}</p>
                      </td>`
                          : ""
                      }
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Details Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:32px;">
              <tr style="background:#f9fafb;">
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Hotel</p>
                  <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${hotelName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;border-right:1px solid #e5e7eb;width:50%;">
                        <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Check-in</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${fmtDate(checkIn)}</p>
                      </td>
                      <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;width:50%;">
                        <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Check-out</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${fmtDate(checkOut)}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 20px;border-right:1px solid #e5e7eb;width:50%;">
                        <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Room</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${roomType}</p>
                      </td>
                      <td style="padding:16px 20px;width:50%;">
                        <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total Paid</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:18px;font-weight:700;">${currency} ${Number(price).toFixed(2)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;line-height:1.6;">
              Need to make changes or have questions? Visit <a href="https://luxvibe.io/manage-booking" style="color:#1a1a2e;font-weight:600;">My Bookings</a> or reply to this email.
            </p>
            <p style="margin:0;color:#6b7280;font-size:14px;">We hope you have an incredible stay!</p>

            <p style="margin:32px 0 0;color:#374151;font-size:14px;">Warm regards,<br/><strong>The Luxvibe Team</strong></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Luxvibe. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">This email was sent to ${to} because you made a booking with Luxvibe.</p>
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
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:4px;">LUXVIBE</h1>
            <p style="margin:8px 0 0;color:#a0a0c0;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Your Travel Escape</p>
          </td>
        </tr>

        <!-- Cancelled Banner -->
        <tr>
          <td style="background:#ef4444;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">Booking Cancelled</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;color:#374151;font-size:16px;">Hi ${guestName},</p>
            <p style="margin:0 0 32px;color:#374151;font-size:16px;line-height:1.6;">
              Your reservation at <strong>${hotelName}</strong> has been cancelled. Here are the details of the cancelled booking.
            </p>

            <!-- Booking ID Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#374151;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;color:#d1d5db;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Booking ID</p>
                  <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;font-family:monospace;">${bookingId}</p>
                </td>
              </tr>
            </table>

            <!-- Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:32px;">
              <tr style="background:#f9fafb;">
                <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;">
                  <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Hotel</p>
                  <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${hotelName}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:16px 20px;border-right:1px solid #e5e7eb;width:50%;">
                        <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Check-in (was)</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${fmtDate(checkIn)}</p>
                      </td>
                      <td style="padding:16px 20px;width:50%;">
                        <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Check-out (was)</p>
                        <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${fmtDate(checkOut)}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
              If you did not request this cancellation or have questions, please contact us at 
              <a href="mailto:support@luxvibe.io" style="color:#1a1a2e;font-weight:600;">support@luxvibe.io</a>.
            </p>
            <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
              Ready to plan your next escape? <a href="https://luxvibe.io" style="color:#1a1a2e;font-weight:600;">Browse hotels →</a>
            </p>

            <p style="margin:32px 0 0;color:#374151;font-size:14px;">Warm regards,<br/><strong>The Luxvibe Team</strong></p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Luxvibe. All rights reserved.</p>
            <p style="margin:8px 0 0;color:#9ca3af;font-size:12px;">This email was sent to ${to} because you have a booking with Luxvibe.</p>
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
