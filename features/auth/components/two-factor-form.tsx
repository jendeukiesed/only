"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { completeTwoFactorLoginAction } from "@/actions/auth/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TwoFactorFormProps {
  ticket: string;
  role: Role;
}

export function TwoFactorForm({ ticket, role }: TwoFactorFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await completeTwoFactorLoginAction(ticket, code, role);
      if (result.status !== "success") {
        setError(result.status === "error" ? result.message : "Something went wrong.");
        return;
      }
      toast.success("Welcome back!");
      router.push(result.redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Authentication code</Label>
        <Input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="text-center text-lg tracking-[0.5em]"
        />
        <p className="text-xs text-muted-foreground">
          Open your authenticator app and enter the 6-digit code for PawDrop.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" variant="brand" size="lg" disabled={isPending || code.length !== 6} className="w-full">
        {isPending ? "Verifying…" : "Verify & continue"}
      </Button>
    </form>
  );
}
