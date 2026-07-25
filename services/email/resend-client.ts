import { Resend } from "resend";

/** Singleton Resend client. Throws loudly at send-time (not import-time)
 *  if the API key is missing, so local dev without email configured can
 *  still boot the app. */
export const resendClient = new Resend(process.env.RESEND_API_KEY);
