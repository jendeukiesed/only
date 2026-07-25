import { describe, it, expect } from "vitest";
import { registerSchema, credentialsAuthorizeSchema, resetPasswordSchema } from "@/schemas/auth.schema";

describe("registerSchema", () => {
  const base = {
    name: "Jane Doe",
    username: "jane_doe1",
    email: "jane@example.com",
    password: "Password1",
    confirmPassword: "Password1",
    role: "BUYER" as const,
    agreeToTerms: true as const,
  };

  it("accepts a valid buyer/seller registration payload", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, role: "SELLER" }).success).toBe(true);
  });

  it("rejects mismatched password/confirmPassword", () => {
    const result = registerSchema.safeParse({ ...base, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a weak password (no digit)", () => {
    const result = registerSchema.safeParse({ ...base, password: "Password", confirmPassword: "Password" });
    expect(result.success).toBe(false);
  });

  it("rejects usernames with disallowed characters", () => {
    const result = registerSchema.safeParse({ ...base, username: "jane doe!" });
    expect(result.success).toBe(false);
  });

  it("rejects registration attempting the ADMIN role", () => {
    // @ts-expect-error deliberately invalid input under test
    const result = registerSchema.safeParse({ ...base, role: "ADMIN" });
    expect(result.success).toBe(false);
  });
});

describe("credentialsAuthorizeSchema", () => {
  it("accepts a first-step email+password shape", () => {
    const result = credentialsAuthorizeSchema.safeParse({
      email: "jane@example.com",
      password: "Password1",
      role: "BUYER",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a second-step 2FA ticket+code shape with no email/password", () => {
    const result = credentialsAuthorizeSchema.safeParse({
      twoFactorTicket: "ticket-abc",
      twoFactorCode: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload with neither complete shape", () => {
    const result = credentialsAuthorizeSchema.safeParse({ email: "jane@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects a completely empty payload", () => {
    expect(credentialsAuthorizeSchema.safeParse({}).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "reset-token",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });
});
