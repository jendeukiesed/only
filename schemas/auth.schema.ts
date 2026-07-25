import { z } from "zod";
import { Role } from "@prisma/client";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/password";

const passwordField = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters.`)
  .regex(PASSWORD_REQUIREMENTS.pattern, PASSWORD_REQUIREMENTS.description);

const usernameField = z
  .string()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be at most 24 characters.")
  .regex(/^[a-z0-9_]+$/i, "Only letters, numbers, and underscores.");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name.").max(80),
    username: usernameField,
    email: z.string().email("Enter a valid email address."),
    password: passwordField,
    confirmPassword: z.string(),
    role: z.enum(["BUYER", "SELLER"]), // admins are never self-registered
    agreeToTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms to continue." }) }),
    referralCode: z.string().trim().max(32).optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  role: z.enum(["BUYER", "SELLER", "ADMIN"]),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** What actually reaches the Credentials provider's authorize(). Two
 *  disjoint shapes share this one object: step one (email + password,
 *  submitted from the login form) and step two of a 2FA challenge
 *  (twoFactorTicket + twoFactorCode, submitted with no email/password at
 *  all). Everything is optional here on purpose — authorize() itself
 *  enforces that at least one complete shape is present, since Zod's
 *  object-level `.refine` would otherwise reject the other valid shape. */
export const credentialsAuthorizeSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(1).optional(),
    role: z.enum(["BUYER", "SELLER", "ADMIN"]).optional(),
    twoFactorTicket: z.string().optional(),
    twoFactorCode: z.string().optional(),
  })
  .refine((data) => (data.twoFactorTicket && data.twoFactorCode) || (data.email && data.password), {
    message: "Missing credentials.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const twoFactorVerifySchema = z.object({
  ticket: z.string().min(1),
  code: z.string().length(6, "Enter the 6-digit code."),
});
export type TwoFactorVerifyInput = z.infer<typeof twoFactorVerifySchema>;

export const twoFactorSetupConfirmSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code."),
});

export const twoFactorDisableSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm."),
});

export { Role };
