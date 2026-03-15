"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? undefined;
  const prefillPassword = searchParams.get("password") ?? undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <AuthForm
        mode="signup"
        prefillEmail={prefillEmail}
        prefillPassword={prefillPassword}
      />
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          Log in
        </Link>
      </p>
    </div>
  );
}