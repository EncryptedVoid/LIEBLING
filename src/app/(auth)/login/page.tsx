"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gradient-mesh">
      {reason === "inactive" && (
        <div className="mb-4 w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 p-4 text-center animate-fade-up">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Session expired due to inactivity
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/70 mt-1">
            Please log in again to continue.
          </p>
        </div>
      )}
      <AuthForm mode="login" />
      <p className="mt-6 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '200ms' }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen px-4 gradient-mesh">
        <AuthForm mode="login" />
        <p className="mt-6 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '200ms' }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}