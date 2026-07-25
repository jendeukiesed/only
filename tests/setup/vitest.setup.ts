import "@testing-library/jest-dom/vitest";

// Server Action files start with `"use server"`, and library code that's
// meant to run only on the server imports the `server-only` package as a
// tripwire against accidental client bundling. That package is a no-op at
// runtime in Next.js's webpack build (it only throws via a custom loader),
// but plain Node/Vitest has no such loader, so without a stub it throws
// "This module cannot be imported from a Client Component module" the
// instant any service file is imported in a test. Stubbing it to a no-op
// here lets unit tests import real server/service code directly.
vi.mock("server-only", () => ({}));

// Keep test output readable — services intentionally console.error on
// caught failures (e.g. gamification side-effects in unlockPhotoAction);
// individual tests assert on behavior, not on console output, so silence
// it globally rather than repeating a spy in every file.
vi.spyOn(console, "error").mockImplementation(() => undefined);
