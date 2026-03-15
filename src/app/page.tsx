import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <h1 className="text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            lieblings
          </span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-md leading-relaxed">
          Wishlists and registries, shared with the people you love. Add items,
          organize by event, and let friends claim gifts — without spoiling the
          surprise.
        </p>
        <div className="flex gap-3 mt-8 justify-center">
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="shadow-sm">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}