import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Role } from "@prisma/client";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Seller sign in" };

export default function SellerLoginPage() {
  return (
    <AuthCard
      title="Creator sign in"
      subtitle="Manage uploads, track earnings, and grow your following."
      footer={
        <>
          New creator?{" "}
          <Link href="/seller/register" className="font-medium text-foreground hover:underline">
            Apply to sell on PawDrop
          </Link>
          <div className="mt-2 flex justify-center gap-3 text-xs">
            <Link href="/buyer/login" className="hover:underline">Buying instead?</Link>
            <Link href="/admin/login" className="hover:underline">Admin login</Link>
          </div>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm role={Role.SELLER} />
      </Suspense>
    </AuthCard>
  );
}
