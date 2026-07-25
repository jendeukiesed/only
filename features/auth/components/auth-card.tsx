"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { fadeInUp } from "@/lib/constants/motion";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared shell for every auth screen (login/register/forgot/reset/2FA),
 *  built on the Stage 4 design-system Card rather than raw divs. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            🐾 PawDrop
          </Link>
        </div>
        <Card className="p-8">
          <CardHeader className="p-0">
            <CardTitle>{title}</CardTitle>
            {subtitle && <CardDescription className="mt-1.5">{subtitle}</CardDescription>}
          </CardHeader>
          <CardContent className="mt-6 p-0">{children}</CardContent>
        </Card>
        {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </motion.div>
    </div>
  );
}
