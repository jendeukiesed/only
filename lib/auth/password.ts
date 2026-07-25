import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

/**
 * Shared password strength rule, enforced by both the Zod schema (client +
 * server validation) and any client-side strength meter. Kept here so the
 * rule only has to change in one place.
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
  description: "At least 8 characters, with an uppercase letter, a lowercase letter, and a number.",
};
