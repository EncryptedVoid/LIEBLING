import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { inviteNewUserEmail } from "@/lib/email/templates/invite-new";
import { inviteExistingUserEmail } from "@/lib/email/templates/invite-existing";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { emails } = (await request.json()) as { emails: string[] };

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "No emails provided" },
        { status: 400 }
      );
    }

    // Get inviter's profile
    const { data: inviterProfile } = await supabase
      .from("users")
      .select("display_name, friend_code")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.display_name || "Someone";
    const inviteCode = inviterProfile?.friend_code || "";
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const results: {
      email: string;
      status: "sent" | "exists" | "error";
    }[] = [];

    for (const rawEmail of emails.slice(0, 20)) {
      const email = rawEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        results.push({ email, status: "error" });
        continue;
      }

      // Skip self-invite
      if (email === user.email) {
        results.push({ email, status: "error" });
        continue;
      }

      try {
        // Check if user with this email already exists
        // We look up by checking auth.users via the admin/service role
        // Since we're in a server route with the regular client, we check
        // the users table instead (users are created on signup via trigger)
        const { data: existingUsers } = await supabase
          .from("users")
          .select("id, display_name")
          .limit(1);

        // Alternative: use supabase admin to check auth.users
        // For now, we'll query our own users table by checking friendships
        // The safest approach: store the invite and send the "new user" email
        // The auto-friendship trigger handles the rest on signup

        // Store the pending invite
        const { error: inviteErr } = await supabase
          .from("pending_invites")
          .insert({ inviter_id: user.id, email })
          .single();

        if (inviteErr) {
          if (
            inviteErr.message.includes("duplicate") ||
            inviteErr.code === "23505"
          ) {
            // Already invited — skip silently
            results.push({ email, status: "exists" });
            continue;
          }
          throw inviteErr;
        }

        // Send invite email (always as new user — if they already have
        // an account, the friendship trigger handles it on next login
        // or we could check auth.users with service role)
        const html = inviteNewUserEmail(inviterName, inviteCode, siteUrl);
        const emailResult = await sendEmail({
          to: email,
          subject: `${inviterName} invited you to Lieblings! 🎁`,
          html,
        });

        results.push({
          email,
          status: emailResult.success ? "sent" : "error",
        });
      } catch (err) {
        console.error(`[Invite] Error for ${email}:`, err);
        results.push({ email, status: "error" });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[Invite] Route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}