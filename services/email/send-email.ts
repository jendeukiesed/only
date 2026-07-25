import "server-only";
import type { ReactElement } from "react";
import { resendClient } from "./resend-client";

interface SendEmailArgs {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

/**
 * The single choke point every email in the app goes through — verification,
 * welcome, password reset, and (in later stages) follower/achievement/
 * purchase/admin notices. Keeping one function here means retry policy,
 * logging, and the "from" address only need to be right in one place.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailArgs) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send of "${subject}" to ${to}`);
    return { skipped: true } as const;
  }

  const { data, error } = await resendClient.emails.send({
    from: process.env.EMAIL_FROM ?? "PawDrop <hello@pawdrop.app>",
    to,
    subject,
    react,
    replyTo,
  });

  if (error) {
    console.error("[email] send failed", { subject, to, error });
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data?.id, skipped: false } as const;
}
