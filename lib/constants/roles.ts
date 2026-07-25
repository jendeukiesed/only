/**
 * Edge-safe role name union. Structurally identical to Prisma's generated
 * `Role` enum (which is a string-literal union, so the two are mutually
 * assignable) — but deliberately NOT imported from "@prisma/client":
 * this file is part of the middleware import graph, which runs in the
 * Edge runtime where Prisma's client entrypoint cannot load.
 */
export type Role = "BUYER" | "SELLER" | "ADMIN";

/** Where each role lands after a successful login / when hitting "/". */
export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  BUYER: "/buyer/dashboard",
  SELLER: "/seller/dashboard",
  ADMIN: "/admin/dashboard",
};

/** Which URL prefix each role's protected area lives under. Keep in sync
 *  with the app/ directory: app/buyer, app/seller, app/admin are real path
 *  segments (not route groups) precisely so this map can do prefix checks. */
export const ROLE_ROUTE_PREFIX: Record<Role, string> = {
  BUYER: "/buyer",
  SELLER: "/seller",
  ADMIN: "/admin",
};

export const ROLE_LOGIN_PATH: Record<Role, string> = {
  BUYER: "/buyer/login",
  SELLER: "/seller/login",
  ADMIN: "/admin/login",
};

export const ROLE_LABEL: Record<Role, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  ADMIN: "Admin",
};
