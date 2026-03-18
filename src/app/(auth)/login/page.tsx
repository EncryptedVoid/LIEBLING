import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gradient-mesh">
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