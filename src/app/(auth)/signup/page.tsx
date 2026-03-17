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
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <Suspense fallback={<AuthForm mode="signup" />}>
        <SignupFormWrapper />
      </Suspense>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          Log in
        </Link>
      </p>
    </div>
  );
}