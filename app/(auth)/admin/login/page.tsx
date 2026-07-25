import type { Metadata } from "next";
import { Suspense } from "react";
import { Role } from "@prisma/client";
import { AuthCard } from "@/features/auth/components/auth-card";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Admin sign in" };

// No register page here on purpose — admin accounts are provisioned via
// the seed script or by an existing admin from the admin panel (Stage 11),
// never self-service.
export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin console" subtitle="Restricted access. Authorized personnel only.">
      <Suspense fallback={null}>
        <LoginForm role={Role.ADMIN} />
      </Suspense>
    </AuthCard>
  );
}
