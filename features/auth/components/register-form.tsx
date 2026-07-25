"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { registerAction } from "@/actions/auth/register";
import { GoogleSignInButton } from "./google-signin-button";
import { ROLE_LABEL } from "@/lib/constants/roles";
import type { RegisterInput } from "@/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface RegisterFormProps {
  role: "BUYER" | "SELLER";
}

const initialState = {
  name: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeToTerms: false,
  referralCode: "",
};

export function RegisterForm({ role }: RegisterFormProps) {
  const searchParams = useSearchParams();
  const referralCodeFromLink = searchParams.get("ref") ?? "";
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({ ...initialState, referralCode: referralCodeFromLink });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    startTransition(async () => {
      const result = await registerAction({ ...values, role } as RegisterInput);
      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        if (result.message) toast.error(result.message);
        return;
      }
      setSubmitted(true);
      toast.success("Account created! Check your inbox to verify your email.");
    });
  }

  if (submitted) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-4xl">📬</p>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to <span className="font-medium text-foreground">{values.email}</span>.
          Click it to activate your {ROLE_LABEL[role].toLowerCase()} account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <GoogleSignInButton />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name" error={fieldErrors.name}>
          <Input required value={values.name} onChange={(e) => update("name", e.target.value)} />
        </Field>

        <Field label="Username" error={fieldErrors.username}>
          <Input
            required
            value={values.username}
            onChange={(e) => update("username", e.target.value.toLowerCase())}
          />
        </Field>

        <Field label="Email" error={fieldErrors.email}>
          <Input type="email" required value={values.email} onChange={(e) => update("email", e.target.value)} />
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          <Input
            type="password"
            required
            value={values.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </Field>

        <Field label="Confirm password" error={fieldErrors.confirmPassword}>
          <Input
            type="password"
            required
            value={values.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />
        </Field>

        <Field label="Referral code (optional)" error={fieldErrors.referralCode}>
          <Input
            value={values.referralCode}
            onChange={(e) => update("referralCode", e.target.value)}
            placeholder="e.g. a1b2c3d4"
          />
        </Field>

        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox
            checked={values.agreeToTerms}
            onCheckedChange={(checked) => update("agreeToTerms", checked === true)}
            className="mt-0.5"
          />
          I agree to the Terms of Service and acknowledge PawDrop uses internal points only —
          no real-money payments.
        </label>
        {fieldErrors.agreeToTerms && <p className="text-sm text-destructive">{fieldErrors.agreeToTerms}</p>}

        <Button type="submit" variant="brand" size="lg" disabled={isPending} className="w-full">
          {isPending ? "Creating account…" : `Create ${ROLE_LABEL[role]} account`}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
