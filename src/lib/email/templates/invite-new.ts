import { emailLayout } from "./layout";

export function inviteNewUserEmail(
  inviterName: string,
  inviteCode: string,
  siteUrl: string,
): string {
  return emailLayout({
    preheader: `${inviterName} invited you to join Lieblings — the smarter way to give and receive gifts.`,
    heading: `${inviterName} wants to share wishlists with you! 🎁`,
    body: `
      <p style="margin:0 0 16px;">Your friend <strong>${inviterName}</strong> uses Lieblings to coordinate gift-giving — and they want you to join in.</p>

      <p style="margin:0 0 16px;">With Lieblings, you can:</p>

      <ul style="margin:0 0 16px;padding:0 0 0 20px;color:#555;font-size:14px;line-height:1.8;">
        <li>Create wishlists from any online store</li>
        <li>See what your friends actually want</li>
        <li>Claim gifts secretly — no duplicates, no spoiled surprises</li>
      </ul>

      <p style="margin:0 0 16px;">It's free, beautiful, and takes 2 minutes to set up.</p>

      <p style="margin:0;color:#999;font-size:13px;">When you sign up, you and ${inviterName} will automatically be connected as friends.</p>
    `,
    ctaText: "Join Lieblings",
    ctaUrl: `${siteUrl}/invite/${inviteCode}`,
  });
}
