import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { mfaEnabledEmail } from "@/lib/email/templates/mfa-enabled";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name || "there";
    const html = mfaEnabledEmail(displayName);

    const result = await sendEmail({
      to: user.email!,
      subject: "🔐 Two-factor authentication is now active",
      html,
    });

    if (!result.success) {
      console.error("[Email] MFA email failed:", result.error);
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Email] MFA route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}