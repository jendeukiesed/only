"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/modals/confirm-dialog";
import {
  beginTwoFactorSetupAction,
  confirmTwoFactorSetupAction,
  disableTwoFactorAction,
} from "@/actions/auth/two-factor";

export function TwoFactorSettings({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  function handleBeginSetup() {
    startTransition(async () => {
      const result = await beginTwoFactorSetupAction();
      setSetup(result);
    });
  }

  function handleConfirmSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    startTransition(async () => {
      const result = await confirmTwoFactorSetupAction(setup.secret, { code });
      if (!result.success) {
        toast.error(result.message ?? "Invalid code.");
        return;
      }
      toast.success("Two-factor authentication enabled.");
      setEnabled(true);
      setSetup(null);
      setCode("");
      router.refresh();
    });
  }

  async function handleDisable() {
    const result = await disableTwoFactorAction({ password: disablePassword });
    if (!result.success) {
      toast.error(result.message ?? "Something went wrong.");
      throw new Error(result.message);
    }
    toast.success("Two-factor authentication disabled.");
    setEnabled(false);
    setDisablePassword("");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Two-factor authentication</CardTitle>
          {enabled && (
            <Badge variant="success">
              <ShieldCheck className="size-3" /> Enabled
            </Badge>
          )}
        </div>
        <CardDescription>Require a code from an authenticator app when signing in.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled && !setup && (
          <Button variant="brand" onClick={handleBeginSetup} disabled={isPending}>
            <ShieldCheck className="size-4" /> Enable 2FA
          </Button>
        )}

        {!enabled && setup && (
          <form onSubmit={handleConfirmSetup} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with Google Authenticator, 1Password, or any TOTP app, then enter
              the 6-digit code it generates.
            </p>
            <div className="flex justify-center rounded-xl border border-border bg-white p-4">
              <Image src={setup.qrCodeDataUrl} alt="2FA QR code" width={180} height={180} />
            </div>
            <div className="space-y-1.5">
              <Label>Verification code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                inputMode="numeric"
                className="text-center tracking-[0.5em]"
                placeholder="000000"
                required
              />
            </div>
            <Button type="submit" variant="brand" disabled={isPending || code.length !== 6}>
              {isPending ? "Verifying…" : "Confirm & enable"}
            </Button>
          </form>
        )}

        {enabled && (
          <ConfirmDialog
            trigger={
              <Button variant="outline">
                <ShieldOff className="size-4" /> Disable 2FA
              </Button>
            }
            title="Disable two-factor authentication?"
            description="Enter your password to confirm. Your account will be less secure without 2FA."
            confirmLabel="Disable"
            variant="destructive"
            onConfirm={handleDisable}
          >
            <Input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Password"
            />
          </ConfirmDialog>
        )}
      </CardContent>
    </Card>
  );
}
