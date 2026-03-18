"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";

function SignupFormWrapper() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? undefined;
  const prefillPassword = searchParams.get("password") ?? undefined;

  return (
    <AuthForm
      mode="signup"
      prefillEmail={prefillEmail}
      prefillPassword={prefillPassword}
    />
  );
}

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gradient-mesh">
      <Suspense fallback={<AuthForm mode="signup" />}>
        <SignupFormWrapper />
      </Suspense>
      <p className="mt-6 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '200ms' }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}