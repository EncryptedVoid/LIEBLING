"use client";

import Link from "next/link";
import { Heart, Baby, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BLUEPRINTS = [
  {
    id: "wedding",
    title: "Wedding",
    description: "Set up a wedding event and registry in minutes. Add your partner, pick a date, and we'll create everything for you.",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    available: true,
    href: "/blueprints/wedding",
  },
  {
    id: "baby-shower",
    title: "Baby Shower",
    description: "Create a baby shower event with a full registry. Add the other parent and let friends know what you need.",
    icon: Baby,
    color: "from-sky-400 to-blue-500",
    available: false,
    href: "#",
  },
];

export default function BlueprintsPage() {
  return (
    <div className="page-enter max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-semibold tracking-tight">Blueprints</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Multi-step wizards that set up events, collections, and more in one go.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {BLUEPRINTS.map((bp) => (
          <Card key={bp.id} className={`glass-card gradient-border-card rounded-2xl overflow-hidden ${!bp.available ? "opacity-60" : "hover:-translate-y-1"} transition-all`}>
            <div className={`h-2 bg-gradient-to-r ${bp.color}`} />
            <CardContent className="p-6 flex flex-col gap-4">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${bp.color} flex items-center justify-center shadow-lg`}>
                <bp.icon className="h-6 w-6 mkt-text" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-heading font-bold">{bp.title}</h3>
                  {!bp.available && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Clock className="h-3 w-3" /> Coming Soon
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{bp.description}</p>
              </div>
              {bp.available ? (
                <Button asChild className="w-full btn-gradient rounded-xl shadow-md">
                  <Link href={bp.href}>
                    Start Wizard <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              ) : (
                <Button disabled className="w-full rounded-xl">Coming Soon</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}