import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <AuthForm mode="signup" />
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
          Log in
        </Link>
      </p>
    </div>
  );
}