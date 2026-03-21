/**
 * Shared email layout with Lieblings branding.
 * Uses inline styles for maximum email client compatibility.
 */

export function emailLayout({
  preheader,
  heading,
  body,
  ctaText,
  ctaUrl,
  footerText,
}: {
  preheader: string;
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f8f8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden text for email previews) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f8f8;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Gradient Header -->
          <tr>
            <td style="height:6px;background:linear-gradient(135deg,#fbbf24,#fb923c,#f43f5e);"></td>
          </tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:32px 40px 16px;">
              <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                <span style="background:linear-gradient(135deg,#fbbf24,#fb923c,#f43f5e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                  lieblings
                </span>
              </div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:0 40px 8px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">
                ${heading}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:8px 40px 24px;">
              <div style="font-size:14px;line-height:1.7;color:#555555;">
                ${body}
              </div>
            </td>
          </tr>

          ${
            ctaText && ctaUrl
              ? `
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px 32px;">
              <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#fbbf24,#fb923c,#f43f5e);color:#000000;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 4px 12px rgba(251,191,36,0.3);">
                ${ctaText}
              </a>
            </td>
          </tr>
          `
              : ""
          }

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#eeeeee;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 40px 28px;">
              <p style="margin:0;font-size:11px;color:#999999;line-height:1.5;">
                ${footerText || "You're receiving this because you have a Lieblings account."}
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#bbbbbb;">
                © ${new Date().getFullYear()} Lieblings
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
