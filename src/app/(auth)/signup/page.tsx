"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Sun, Moon } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

function ThemeToggle() {
  function toggle() {
    const current = document.documentElement.getAttribute("data-marketing-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-marketing-theme", next);
    localStorage.setItem("lieblings-marketing-theme", next);
  }

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 h-10 w-10 rounded-xl flex items-center justify-center mkt-bg-subtle hover:mkt-bg-hover transition-all border mkt-card-border"
      title="Toggle theme"
    >
      <Sun className="h-4 w-4 mkt-text-muted hidden [html[data-marketing-theme='dark']_&]:block" />
      <Moon className="h-4 w-4 mkt-text-muted block [html[data-marketing-theme='dark']_&]:hidden" />
    </button>
  );
}

function SignupContent() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? undefined;
  const prefillPassword = searchParams.get("password") ?? undefined;

  useEffect(() => {
    if (!document.documentElement.getAttribute("data-marketing-theme")) {
      const stored = localStorage.getItem("lieblings-marketing-theme");
      document.documentElement.setAttribute("data-marketing-theme", stored || "dark");
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 relative overflow-hidden mkt-bg transition-colors duration-500">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="mkt-orb-1 absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(244,63,94,0.2) 50%, transparent 70%)" }} />
        <div className="mkt-orb-2 absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(244,63,94,0.4) 0%, rgba(168,85,247,0.15) 50%, transparent 70%)" }} />
      </div>

      <ThemeToggle />

      <AuthForm
        mode="signup"
        prefillEmail={prefillEmail}
        prefillPassword={prefillPassword}
      />

      <p className="mt-6 text-sm mkt-text-muted animate-fade-up" style={{ animationDelay: "200ms" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium bg-gradient-to-r from-amber-300 to-rose-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen mkt-bg">
        <div className="h-8 w-8 rounded-full animate-spin border-2 border-transparent border-t-amber-400" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}