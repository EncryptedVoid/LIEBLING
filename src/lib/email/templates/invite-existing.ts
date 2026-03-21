import { emailLayout } from "./layout";

export function inviteExistingUserEmail(
  inviterName: string,
  siteUrl: string,
): string {
  return emailLayout({
    preheader: `${inviterName} added you as a friend on Lieblings! Log in to accept.`,
    heading: `${inviterName} added you as a friend! 👋`,
    body: `
      <p style="margin:0 0 16px;">Great news — <strong>${inviterName}</strong> just sent you a friend request on Lieblings.</p>

      <p style="margin:0 0 16px;">Once you accept, you'll be able to see each other's wishlists, claim gifts, and coordinate for upcoming events.</p>

      <p style="margin:0;color:#999;font-size:13px;">Log in to view and accept the request.</p>
    `,
    ctaText: "View friend request",
    ctaUrl: `${siteUrl}/friends`,
  });
}
