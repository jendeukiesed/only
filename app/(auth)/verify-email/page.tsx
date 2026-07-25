import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/features/auth/components/auth-card";
import { verifyEmailAction } from "@/actions/auth/verify-email";

export const metadata: Metadata = { title: "Verify your email" };

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  const result = token
    ? await verifyEmailAction(token)
    : { success: false as const, message: "Missing verification token." };

  if (result.success && "redirectTo" in result) {
    redirect(result.redirectTo);
  }

  return (
    <AuthCard title="Verification failed" subtitle={result.message}>
      <div className="space-y-3 text-center text-sm text-muted-foreground">
        <p>The link may have expired. Sign in and request a new verification email.</p>
        <a href="/buyer/login" className="font-medium text-foreground hover:underline">
          Back to sign in
        </a>
      </div>
    </AuthCard>
  );
}
