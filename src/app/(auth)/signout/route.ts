import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Build response that redirects to login
  const response = NextResponse.json({ success: true });

  // Explicitly clear all Supabase auth cookies
  const cookieNames = [
    "sb-access-token",
    "sb-refresh-token",
  ];

  // Supabase SSR uses cookie names based on the project URL
  // The safest approach is to clear all cookies that start with "sb-"
  response.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
      });
    }
  });

  return response;
}