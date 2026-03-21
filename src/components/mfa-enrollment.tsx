"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Check, Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type MfaEnrollmentProps = {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  variant?: "card" | "inline";
};

export function MfaEnrollment({
  onComplete,
  onSkip,
  showSkip = false,
  variant = "card",
}: MfaEnrollmentProps) {
  const supabase = createClient();

  const [step, setStep] = useState<"idle" | "enrolling" | "verifying" | "done">("idle");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStartEnroll() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });
      if (error) throw error;
      if (data.totp?.qr_code) {
        setQrUri(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep("enrolling");
      }
    } catch (err: any) {
      toast.error(err.message || "Couldn't start MFA setup.");
    }
    setLoading(false);
  }

  async function handleVerify() {
    if (verifyCode.length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyErr) throw verifyErr;

      setStep("done");
      toast.success("MFA enabled! Your account is now more secure.");

      // Send MFA congratulations email
      try {
        await fetch("/api/email/mfa-enabled", { method: "POST" });
      } catch {
        // Non-critical — don't block on email failure
      }

      onComplete?.();
    } catch (err: any) {
      toast.error(err.message || "Invalid code. Try again.");
    }
    setLoading(false);
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied! Paste it into your authenticator app.");
  }

  const content = (
    <>
      {step === "idle" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--gradient-from), var(--gradient-to))",
              boxShadow: "0 4px 20px var(--glow)",
            }}
          >
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-base font-heading font-semibold">
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Add an extra layer of security using an authenticator app like
              Google Authenticator, Authy, or 1Password.
            </p>
          </div>
          <div className="flex gap-2 w-full max-w-xs">
            {showSkip && (
              <Button variant="ghost" className="flex-1" onClick={onSkip}>
                Skip
              </Button>
            )}
            <Button
              className="flex-1 btn-gradient rounded-xl shadow-lg"
              onClick={handleStartEnroll}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enable MFA"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "enrolling" && (
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <h3 className="text-sm font-heading font-semibold">
            Scan this QR code
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Open your authenticator app and scan the code below. If you can't
            scan, copy the secret key manually.
          </p>

          <div
            className="p-4 rounded-2xl shadow-lg"
            style={{ background: "white", boxShadow: "0 0 30px var(--glow)" }}
          >
            {qrUri && (
              <img src={qrUri} alt="MFA QR Code" className="w-48 h-48" />
            )}
          </div>

          {secret && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 w-full max-w-xs">
              <code className="text-[10px] font-mono flex-1 break-all text-muted-foreground">
                {secret}
              </code>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={copySecret}
                className="shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="w-full max-w-xs flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">
              Enter the 6-digit code from your app
            </Label>
            <Input
              value={verifyCode}
              onChange={(e) =>
                setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="text-center text-lg font-mono tracking-[0.5em]"
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>

          <div className="flex gap-2 w-full max-w-xs">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setStep("idle");
                setVerifyCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 btn-gradient rounded-xl shadow-lg"
              onClick={handleVerify}
              disabled={loading || verifyCode.length !== 6}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & Enable"
              )}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in-50 duration-300">
          <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
            <Check className="h-7 w-7 text-green-500" />
          </div>
          <div>
            <h3 className="text-base font-heading font-semibold">
              MFA Enabled!
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 text-green-600 border-green-500/30"
          >
            <ShieldCheck className="h-3 w-3" /> Two-factor active
          </Badge>
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return <div className="flex flex-col gap-4">{content}</div>;
  }

  return (
    <Card className="glass-card rounded-2xl">
      <CardContent className="p-6">{content}</CardContent>
    </Card>
  );
}