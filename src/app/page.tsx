import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">lieblings</h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        Wishlists and registries, shared with the people you love. Add items,
        organize by event, and let friends claim gifts — without spoiling the
        surprise.
      </p>
      <div className="flex gap-3 mt-8">
        <Button asChild size="lg">
          <Link href="/signup">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </div>
  );
}