"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Role } from "@prisma/client";
import { authenticateAction } from "@/actions/auth/login";
import { GoogleSignInButton } from "./google-signin-button";
import { ROLE_LABEL } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface LoginFormProps {
  role: Role;
}

export function LoginForm({ role }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get("error");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await authenticateAction({ email, password, role });

      if (result.status === "success") {
        toast.success("Welcome back!");
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      if (result.status === "two_factor_required") {
        router.push(`/two-factor?ticket=${result.ticket}&role=${role}`);
        return;
      }

      setError(result.message);
    });
  }

  return (
    <div className="space-y-5">
      {urlError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {urlError.startsWith("account_")
            ? `Your account is ${urlError.replace("account_", "")}. Contact support for help.`
            : "Something went wrong. Please sign in again."}
        </p>
      )}

      {role !== Role.ADMIN && (
        <>
          <GoogleSignInButton />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="brand" size="lg" disabled={isPending} className="w-full">
          {isPending ? "Signing in…" : `Sign in as ${ROLE_LABEL[role]}`}
        </Button>
      </form>
    </div>
  );
}
