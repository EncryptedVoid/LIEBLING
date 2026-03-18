import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/nav";
import { ThemeProvider } from "@/components/theme-provider";
import { InactivityGuard } from "@/components/inactivity-guard";
import { Footer } from "@/components/footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name, avatar_url, theme_mode, theme_color, onboarded")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // User exists in auth but not in the users table (DB was reset)
    // Sign them out and redirect to login
    await supabase.auth.signOut();
    redirect("/login");
  }
  if (!profile.onboarded) redirect("/onboarding");

  return (
    <ThemeProvider mode={profile.theme_mode} color={profile.theme_color}>
      <div className="min-h-screen flex flex-col">
        <Nav user={profile} />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </main>
        <Footer />
      </div>
      <InactivityGuard />
    </ThemeProvider>
  );
}