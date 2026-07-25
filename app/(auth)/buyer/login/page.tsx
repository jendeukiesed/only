import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Role } from "@prisma/client";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Buyer sign in" };

export default function BuyerLoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to unlock more mystery photos."
      footer={
        <>
          New to PawDrop?{" "}
          <Link href="/buyer/register" className="font-medium text-foreground hover:underline">
            Create a buyer account
          </Link>
          <div className="mt-2 flex justify-center gap-3 text-xs">
            <Link href="/seller/login" className="hover:underline">Selling instead?</Link>
            <Link href="/admin/login" className="hover:underline">Admin login</Link>
          </div>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm role={Role.BUYER} />
      </Suspense>
    </AuthCard>
  );
}
