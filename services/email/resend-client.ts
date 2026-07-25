import { Resend } from "resend";

/** Singleton Resend client. The SDK's constructor throws when the key is
 *  undefined, which would crash `next build`'s page-data collection on any
 *  deploy without email configured — so fall back to a placeholder string.
 *  It is never actually used: sendEmail() checks RESEND_API_KEY and skips
 *  the send entirely when it isn't set. */
export const resendClient = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder_not_configured");
