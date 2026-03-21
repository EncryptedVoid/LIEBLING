import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";

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
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const html = welcomeEmail(displayName, siteUrl);

    const result = await sendEmail({
      to: user.email!,
      subject: "Welcome to Lieblings! 🎉 Let's get started",
      html,
    });

    if (!result.success) {
      console.error("[Email] Welcome email failed:", result.error);
      return NextResponse.json({ error: "Email send failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Email] Welcome route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}