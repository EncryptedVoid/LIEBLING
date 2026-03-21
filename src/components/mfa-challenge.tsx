"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type MfaChallengeProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
  description?: string;
};

export function MfaChallenge({
  open,
  onOpenChange,
  onVerified,
  title = "Verify your identity",
  description = "Enter the 6-digit code from your authenticator app to continue.",
}: MfaChallengeProps) {
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCode("");
      return;
    }
    // Get the user's enrolled factor
    async function getFactors() {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data.totp || data.totp.length === 0) {
        toast.error("No MFA factor found.");
        onOpenChange(false);
        return;
      }
      // Use the first verified TOTP factor
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
      } else {
        toast.error("No verified MFA factor found.");
        onOpenChange(false);
      }
    }
    getFactors();
  }, [open]);

  async function handleVerify() {
    if (!factorId || code.length !== 6) return;
    setLoading(true);
    try {
      const { data: challenge, error: challengeErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyErr) throw verifyErr;

      toast.success("Identity verified.");
      onVerified();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Try again.");
      setCode("");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm glass-card rounded-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center shadow-lg mb-2" style={{ background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))" }}>
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <DialogTitle className="font-heading">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Authenticator code
            </Label>
            <Input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="text-center text-lg font-mono tracking-[0.5em]"
              maxLength={6}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 btn-gradient rounded-xl shadow-lg"
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Utility: check if the current user has MFA enrolled
 */
export async function checkMfaEnrolled(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data.totp) return false;
  return data.totp.some((f) => f.status === "verified");
}