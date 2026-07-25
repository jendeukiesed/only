import type { Metadata } from "next";
import { Role } from "@prisma/client";
import { AuthCard } from "@/features/auth/components/auth-card";
import { TwoFactorForm } from "@/features/auth/components/two-factor-form";

export const metadata: Metadata = { title: "Two-factor verification" };

interface PageProps {
  searchParams: Promise<{ ticket?: string; role?: string }>;
}

export default async function TwoFactorPage({ searchParams }: PageProps) {
  const { ticket, role } = await searchParams;
  const parsedRole = role && role in Role ? (role as Role) : Role.BUYER;

  if (!ticket) {
    return (
      <AuthCard title="Session expired" subtitle="Please sign in again.">
        <a href="/buyer/login" className="text-sm font-medium text-foreground hover:underline">
          Back to sign in
        </a>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Two-factor verification" subtitle="Enter the code from your authenticator app.">
      <TwoFactorForm ticket={ticket} role={parsedRole} />
    </AuthCard>
  );
}
