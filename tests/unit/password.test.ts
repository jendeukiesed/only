import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, PASSWORD_REQUIREMENTS } from "@/lib/auth/password";

describe("password hashing", () => {
  it("hashes a password to a bcrypt digest distinct from the plaintext", async () => {
    const hashed = await hashPassword("Sup3rSecret!");
    expect(hashed).not.toBe("Sup3rSecret!");
    expect(hashed).toMatch(/^\$2[aby]\$/);
  });

  it("verifies the correct password against its hash", async () => {
    const hashed = await hashPassword("Sup3rSecret!");
    await expect(verifyPassword("Sup3rSecret!", hashed)).resolves.toBe(true);
  });

  it("rejects an incorrect password against an existing hash", async () => {
    const hashed = await hashPassword("Sup3rSecret!");
    await expect(verifyPassword("WrongPassword1", hashed)).resolves.toBe(false);
  });

  it("produces a different salt (and therefore hash) for the same input each time", async () => {
    const a = await hashPassword("Sup3rSecret!");
    const b = await hashPassword("Sup3rSecret!");
    expect(a).not.toBe(b);
  });
});

describe("PASSWORD_REQUIREMENTS.pattern", () => {
  const cases: Array<[string, boolean]> = [
    ["Password1", true],
    ["password1", false], // no uppercase
    ["PASSWORD1", false], // no lowercase
    ["Password", false], // no digit
    ["Pw1", true], // pattern itself doesn't enforce length (min length is separate)
  ];

  it.each(cases)("evaluates %s as valid=%s", (value, expected) => {
    expect(PASSWORD_REQUIREMENTS.pattern.test(value)).toBe(expected);
  });
});
