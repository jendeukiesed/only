import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/features/auth/components/auth-card";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = { title: "Become a PawDrop creator" };

export default function SellerRegisterPage() {
  return (
    <AuthCard
      title="Become a creator"
      subtitle="Upload dog photos, get AI-scored, and earn points from every unlock."
      footer={
        <>
          Already selling?{" "}
          <Link href="/seller/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <RegisterForm role="SELLER" />
      </Suspense>
    </AuthCard>
  );
}
