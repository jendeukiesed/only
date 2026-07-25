import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Create a buyer account" };

export default function BuyerRegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start collecting adorable dog photos."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/buyer/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <RegisterForm role="BUYER" />
      </Suspense>
    </AuthCard>
  );
}
