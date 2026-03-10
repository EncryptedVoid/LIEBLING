import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch the user's profile from our users table
  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, theme_mode, theme_color, onboarded")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Redirect to onboarding if not completed
  if (!profile.onboarded) redirect("/onboarding");

  return (
    <ThemeProvider mode={profile.theme_mode} color={profile.theme_color}>
      <div className="min-h-screen flex flex-col">
        <Nav user={profile} />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}