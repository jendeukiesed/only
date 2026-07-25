// Full Auth.js route handler — runs in the Node.js runtime (default for
// route handlers), which is required because lib/auth/auth.ts pulls in
// Prisma + bcrypt for the Credentials provider. Do NOT add
// `export const runtime = "edge"` here.
export { GET, POST } from "@/lib/auth/auth";
