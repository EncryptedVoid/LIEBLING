"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

type FriendCodeShareProps = {
  friendCode: string; // e.g. "LIEB-A3X9"
};

export function FriendCodeShare({ friendCode }: FriendCodeShareProps) {
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${friendCode}`;
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Try manually.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Your friend code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {/* Big code display */}
        <div className="flex items-center justify-between rounded-md border px-4 py-3 bg-muted">
          <span className="text-lg font-mono font-semibold tracking-wider">
            {friendCode}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(friendCode)}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        {/* Share sheet with more options */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              Share with a friend
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Share your wishlist</SheetTitle>
              <SheetDescription>
                Friends who use this code or link can see your wishlists and
                claim items for you.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-6 mt-6">
              {/* Copy link */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Invite link</p>
                <div className="flex gap-2">
                  <code className="flex-1 rounded-md border px-3 py-2 text-sm bg-muted truncate">
                    {inviteUrl}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(inviteUrl)}
                  >
                    Copy
                  </Button>
                </div>
              </div>

              {/* QR code */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-medium">QR code</p>
                <div className="rounded-lg border p-4 bg-white">
                  <QRCodeSVG value={inviteUrl} size={180} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Have a friend scan this with their phone camera.
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}