import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Update this once you have a verified domain in Resend
const FROM_EMAIL = "Lieblings <onboarding@resend.dev>";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Send failed:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[Email] Send error:", err);
    return { success: false, error: err };
  }
}