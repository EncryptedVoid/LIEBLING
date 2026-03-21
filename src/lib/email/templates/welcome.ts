import { emailLayout } from "./layout";

export function welcomeEmail(displayName: string, siteUrl: string): string {
  return emailLayout({
    preheader: `Welcome to Lieblings, ${displayName}! Your gift-giving journey starts now.`,
    heading: `Welcome aboard, ${displayName}! 🎉`,
    body: `
      <p style="margin:0 0 16px;">You've just joined Lieblings — the smarter way to give and receive gifts. We're so glad you're here.</p>

      <p style="margin:0 0 12px;font-weight:600;color:#1a1a1a;">Here's how to get started:</p>

      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        <tr>
          <td style="padding:8px 0;vertical-align:top;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#fbbf24,#f43f5e);color:#000;font-weight:700;font-size:13px;text-align:center;line-height:28px;margin-right:12px;">1</span>
          </td>
          <td style="padding:8px 0;vertical-align:middle;font-size:14px;color:#555;">
            <strong style="color:#1a1a1a;">Create your first wishlist</strong> — add items from any URL
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;vertical-align:top;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#fbbf24,#f43f5e);color:#000;font-weight:700;font-size:13px;text-align:center;line-height:28px;margin-right:12px;">2</span>
          </td>
          <td style="padding:8px 0;vertical-align:middle;font-size:14px;color:#555;">
            <strong style="color:#1a1a1a;">Add friends</strong> — share your friend code so they can see your lists
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;vertical-align:top;">
            <span style="display:inline-block;width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#fbbf24,#f43f5e);color:#000;font-weight:700;font-size:13px;text-align:center;line-height:28px;margin-right:12px;">3</span>
          </td>
          <td style="padding:8px 0;vertical-align:middle;font-size:14px;color:#555;">
            <strong style="color:#1a1a1a;">Browse & claim</strong> — see what your friends want and claim gifts secretly
          </td>
        </tr>
      </table>

      <p style="margin:0;color:#999;font-size:13px;">No more duplicate gifts. No more guessing. Just joy.</p>
    `,
    ctaText: "Go to your dashboard",
    ctaUrl: `${siteUrl}/dashboard`,
  });
}
