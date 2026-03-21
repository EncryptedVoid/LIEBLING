import { emailLayout } from "./layout";

export function mfaEnabledEmail(displayName: string): string {
  return emailLayout({
    preheader: `Great news, ${displayName}! Two-factor authentication is now active on your account.`,
    heading: "MFA is now active! 🔐",
    body: `
      <p style="margin:0 0 16px;">Nice move, <strong>${displayName}</strong>! You've just enabled two-factor authentication on your Lieblings account.</p>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0 0 8px;font-weight:600;color:#166534;font-size:13px;">🛡️ What this means for you:</p>
        <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:13px;line-height:1.8;">
          <li>Your account is protected even if your password is compromised</li>
          <li>Only someone with your authenticator app can log in</li>
          <li>Sensitive actions like account deletion now require verification</li>
        </ul>
      </div>

      <p style="margin:0;color:#999;font-size:13px;">If you didn't make this change, please contact us immediately.</p>
    `,
    footerText: "This is a security notification from your Lieblings account.",
  });
}
