# PawDrop — Architecture & Build Plan

Premium marketplace where creators upload dog photos and buyers spend internal
points to unlock random ("mystery box") photos. No real-money payments.

This repo is being built in **stages**, per the agreed process. Each stage
preserves everything from the stages before it. This document is updated at
the end of every stage.

## Stage status

- [x] Stage 1 — Folder structure & base config
- [x] Stage 2 — Database schema (Prisma)
- [x] Stage 3 — Authentication (Auth.js, 3 login surfaces, 2FA)
- [x] Stage 4 — UI system (design tokens, shadcn/ui primitives, theming)
- [x] Stage 5 — Shared components (cards, skeletons, empty/error states, layouts)
- [x] Stage 6 — Buyer module
- [x] Stage 7 — Seller module
- [x] Stage 8 — Marketplace (grid, filters, search, infinite scroll)
- [x] Stage 9 — AI scoring service (built ahead of Stage 8 — the seller upload flow in Stage 7 needed it)
- [x] Stage 10 — Social features (likes, comments, follows, collections)
- [x] Stage 11 — Admin panel
- [x] Stage 12 — Testing (unit, integration, e2e)
- [x] Stage 13 — Docker
- [x] Stage 14 — CI/CD & deployment (GitHub Actions, Vercel)
- [x] Stage 15 — Growth & engagement features (post-launch additions, see below)

Say **"Continue"** to move to the next unchecked stage.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion |
| Client state / data | Zustand (client state) + TanStack Query (server cache) |
| Backend | Next.js Server Actions + typed REST route handlers where needed |
| ORM / DB | Prisma + PostgreSQL |
| Cache / rate limit / jobs | Redis (ioredis) + Upstash Ratelimit |
| Auth | Auth.js (NextAuth v5), credentials + Google, JWT sessions, 2FA (TOTP) |
| Storage | Cloudinary (image upload, transforms, moderation hooks) |
| Validation | Zod (shared client/server schemas) |
| Email | Resend + react-email templates |
| Charts | Recharts |
| Testing | Vitest (unit/integration), Playwright (e2e) |
| Deployment | Docker (local + prod parity), Vercel, GitHub Actions |

## Folder structure & dependency map

The rule: **`app/` only orchestrates. Logic lives in `features/`, `services/`,
`actions/`, and `lib/`.** Nothing reaches directly into Prisma from a
component — everything goes through `actions/` (mutations, called from
client via Server Actions) or `services/` (pure server-side business logic,
called from actions and route handlers alike).

```
app/                        Route segments only. Thin. Composes features.
├─ (marketing)/              Public landing, FAQ, roadmap, leaderboard
├─ (auth)/                   buyer/seller/admin login+register, 2FA, password reset
├─ (buyer)/dashboard/        Buyer-only routes (role-guarded via middleware)
├─ (seller)/dashboard/       Seller-only routes
├─ (admin)/dashboard/        Admin-only routes
├─ marketplace/              Public browse + [category]
├─ mystery/[id]/             Unlock/reveal flow
├─ profile/[username]/       Public profile
└─ api/                      Route handlers: nextauth, webhooks, cron

components/
├─ ui/                       shadcn/ui primitives (button, dialog, input, ...)
├─ layout/                   header, footer, sidebar, navigation shells
└─ shared/                   cards, skeletons, empty-states, modals, charts
                             — reusable across features, no business logic

features/<domain>/           One folder per bounded context:
                             auth, buyer, seller, admin, marketplace,
                             mystery-box, social, gamification, ai-scoring,
                             points, search, notifications
  ├─ components/             Feature-specific UI (imports from components/ui)
  └─ hooks/                  TanStack Query hooks + Zustand slices for that domain

hooks/                       Cross-cutting hooks (useMediaQuery, useDebounce, ...)

services/<domain>/           Server-only business logic, framework-agnostic:
                             ai-scoring, cloudinary, email, redis, points,
                             notifications, search
                             — called by actions/ and app/api/*

lib/                         Infra singletons & config:
├─ auth/                     Auth.js config, session helpers, RBAC guards
├─ db/                       Prisma client singleton
├─ redis/                    ioredis client singleton
├─ cloudinary/               Cloudinary SDK config
├─ rate-limit/               Upstash ratelimit instances
├─ logger/                   Structured logger (pino-style)
└─ constants/                Enums, config values, point economy defaults

db/prisma/                   schema.prisma, migrations/, seed/

actions/<domain>/            "use server" Server Actions — the only way
                             client components mutate data. Each action:
                             validates (schemas/) → authorizes (lib/auth) →
                             calls services/ or Prisma → revalidates.

schemas/                     Zod schemas, shared between client forms,
                             Server Actions, and route handlers.

types/                       Shared TypeScript types/interfaces (incl.
                             Prisma-derived DTOs, API response envelopes).

emails/templates/            react-email templates (verification, welcome,
                             password reset, follower, achievement, purchase,
                             admin notice).

middleware/                  Composable middleware functions (auth guard,
                             role guard, rate limit) invoked from root
                             middleware.ts.

providers/                   App-wide client providers (QueryClientProvider,
                             ThemeProvider, SessionProvider, ToastProvider).

utils/                       Pure, framework-agnostic helper functions
                             (formatting, currency/points display, slugify).

docker/                      Dockerfile, docker-compose (postgres+redis+app).

tests/                       unit/, integration/, e2e/ (Playwright).
```

## Import boundary rules (enforced by convention, revisit with ESLint rules in Stage 12)

1. `app/**` may import from `features/**`, `components/**`, `providers/**` — never directly from `lib/db` or `@prisma/client`.
2. `features/**/components` may import `components/ui` and `components/shared`, never the other way around.
3. `actions/**` is the only layer allowed to import both `schemas/**` and `services/**`/Prisma together.
4. `services/**` never imports from `app/**` or `features/**` (keeps business logic UI-agnostic and unit-testable in isolation).
5. Cross-domain reads go through `services/`, not direct Prisma calls scattered in components.

## Environment variables

See `.env.example` for the full list: database, Redis, Auth.js (credentials +
Google OAuth + 2FA), Cloudinary, Resend email, AI scoring provider, Upstash
rate limiting, and point-economy defaults (starting balances, platform
commission %).

## Data model (Stage 2)

`db/prisma/schema.prisma` — 35 models, PostgreSQL. Grouped by concern:

| Group | Models |
|---|---|
| Auth | `User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`, `TwoFactorToken` |
| Taxonomy | `Category`, `Tag`, `PhotoTag` |
| Content | `Photo`, `PhotoScore` |
| Economy | `MysteryUnlock`, `PointTransaction` |
| Social | `Like`, `Comment`, `CommentReaction`, `Follow`, `Collection`, `CollectionItem`, `Bookmark`, `Wishlist` |
| Gamification | `Achievement`, `UserAchievement`, `Mission`, `UserMission`, `Badge`, `UserBadge` |
| Notifications | `Notification` |
| Admin / platform | `Report`, `AuditLog`, `Announcement`, `PlatformSetting`, `FeaturedCreator`, `SellerMonthlyStat`, `SearchQuery` |

Key design decisions:

- **Single `User` model, multi-role.** `roles Role[]` lets one account hold both `BUYER` and `SELLER` (common: a seller who also collects), while `primaryRole` drives which dashboard/login surface is default. Admin accounts are `roles: [ADMIN]` only — kept separate from the buyer/seller economy fields for a clean permission boundary.
- **Score is denormalized onto `Photo`.** `PhotoScore` holds the full AI breakdown (cuteness, composition, lighting, sharpness, emotion, color balance, confidence, explanation); `Photo.overallScore` / `Photo.scoreTier` are copies kept in sync so the marketplace can sort/filter without joining every card render.
- **`PointTransaction` is the ledger of record.** `User.pointsBalance` is a denormalized running total for fast reads; every mutation (unlock spend, sale earning, platform commission, admin adjustment, signup/daily/mission/achievement bonuses, refunds) writes an immutable transaction row first.
- **Mystery mechanic:** `MysteryUnlock` records which specific `Photo` a buyer's points revealed, plus the fee split (`pointsSpent` = `platformFee` + `sellerEarning`) at time of purchase, so historical commission-rate changes never rewrite past transactions.
- **`SellerMonthlyStat` is a cache table**, not a source of truth — rolled up from `Photo`/`MysteryUnlock`/`Follow` on a schedule so seller analytics charts don't run heavy aggregations on every dashboard load.
- **Moderation (`Report`) can target a photo, a comment, or a user** via three optional nullable FKs gated by `targetType`, rather than three separate report tables.

## Authentication (Stage 3)

Auth.js (NextAuth v5) with a deliberate **edge/node split**, because the
Credentials provider needs Prisma + bcrypt (not Edge-safe) while Next.js
middleware runs on the Edge runtime by default:

- `lib/auth/auth.config.ts` — edge-safe: Google provider only, JWT session
  config, no Prisma. Imported by `middleware.ts`.
- `lib/auth/auth.ts` — full config: spreads `auth.config.ts` and adds the
  Credentials provider (Prisma + bcrypt) and the `PrismaAdapter`. Used by
  `app/api/auth/[...nextauth]/route.ts` (Node runtime) and every Server
  Action. **Never** import this file from `middleware.ts`.

Three separate login/register surfaces, each a real path segment
(`/buyer/login`, `/seller/login`, `/admin/login` — no self-service register
for admin) rather than a route group, so the URLs can't collide and
`middleware/role-guard.ts` can pattern-match on the prefix. **This is also a
correction of a Stage 1 bug**: the original `app/(buyer)`, `app/(seller)`,
`app/(admin)` folders were route *groups*, which don't appear in the URL —
all three dashboards would have resolved to the identical `/dashboard` path
and collided. Renamed to plain `app/buyer`, `app/seller`, `app/admin`.

Login flow, per role:
1. `authenticateAction` validates + rate-limits, then calls Auth.js's
   `signIn("credentials", { email, password, role, redirect: false })`.
2. The Credentials provider's `authorize()` checks the password, account
   status (banned/suspended), that the account actually holds the role the
   user is logging in as (a buyer-only account is rejected on
   `/seller/login`), and email verification.
3. If the account has 2FA enabled, `authorize()` doesn't return a session —
   it creates a short-lived, single-use `TwoFactorToken` "ticket" and
   throws a typed signal carrying it. The action catches this and redirects
   to `/two-factor?ticket=...`.
4. The `/two-factor` page collects a 6-digit TOTP code (authenticator app;
   `otplib` + `qrcode` for enrollment) and calls `signIn("credentials", {
   twoFactorTicket, twoFactorCode })` — a second, disjoint shape through the
   same provider — which consumes the ticket and verifies the code against
   `user.twoFactorSecret`.

Two layers of authorization, deliberately not merged:
- `middleware.ts` + `middleware/role-guard.ts` — fast, JWT-only checks that
  decide whether a request can reach a route group at all, and bounce
  signed-in users away from login pages.
- `lib/auth/rbac.ts` (`requireRole`/`assertRole` etc.) — called again inside
  every protected Server Component/Action with a fresh read where needed,
  because the JWT can be up to 30 days stale on a mid-session ban/suspend.

Other pieces: `lib/rate-limit` (Upstash, login/email/2FA/mutation limiters,
no-ops locally without Upstash env vars set), `services/email` (Resend +
react-email — verification, welcome, password-reset templates; follower/
achievement/purchase/admin-notice templates arrive alongside the features
that trigger them), `schemas/auth.schema.ts` (Zod, shared by client forms
and the Credentials `authorize()`).

Known limitation to revisit: email verification and password reset tokens
are stored in Postgres (`VerificationToken`, `PasswordResetToken`) rather
than Redis — fine at current scale, worth moving to Redis with TTLs if
volume grows.

## UI system (Stage 4)

Design tokens (`app/globals.css`, `tailwind.config.ts`): a near-black/near-white
neutral base carries text and chrome (the Linear/Vercel/Arc school — content
and photos supply the color, not buttons everywhere), plus one warm amber
`brand` accent reserved for primary CTAs and the mystery-unlock glow so it
stays special. A separate `tier` color family (bronze → legendary, matching
`ScoreTier`) exists only for mystery-box tier badges — the two accent
systems never compete on the same screen. Every color token uses the
`hsl(var(--x) / <alpha-value>)` form (not a bare `hsl(var(--x))` wrap) so
opacity modifiers like `bg-brand/20` actually work instead of silently
rendering at full opacity — a common Tailwind CSS-variable gotcha, caught
and fixed here rather than shipped broken. Two fonts: Inter for body/UI
(`font-sans`), Sora for headings (`font-display`).

`components/ui/*` — hand-built shadcn/ui-convention primitives (no CLI/
network access in this environment, so these are written directly rather
than fetched): button, input, textarea, label, card, badge, avatar,
separator, switch, checkbox, radio-group, dialog, dropdown-menu, tabs,
tooltip, popover, select, accordion, scroll-area, progress, slider,
skeleton. All variants driven by `class-variance-authority`, all styled
purely off the design tokens above (no hardcoded colors) so a future theme
change only touches `globals.css`.

`lib/constants/motion.ts` — the one shared Framer Motion variants file
(`fadeInUp`, `scaleIn`, `staggerContainer`, `hoverLift`, a
`mysteryRevealVariants` preset for the eventual unlock animation, etc.) so
every animated surface uses the same easing curve instead of a dozen
one-off "smooth" tweaks. `components/shared/theme-toggle.tsx` — light/dark/
system switcher via `next-themes`.

The Stage 3 auth screens (login/register/forgot/reset/2FA + their shared
`AuthCard` shell) were refactored to consume these primitives instead of
raw Tailwind, both as a real integration test of the design system and so
Stage 3's work doesn't rot into a second, inconsistent visual language.

## Shared components & dashboard shells (Stage 5)

`utils/format.ts` centralizes every number/date/string formatter used across
buyer, seller, and admin surfaces (`formatPoints`, `formatCompactNumber`,
`formatRelativeTime`, `formatDate`, `formatPercent`, `titleCaseEnum`,
`pluralize`) so the same 1,234 doesn't render as "1234" in one dashboard and
"1.2K" in another.

`components/shared/cards/photo-card.tsx` is the single card component every
photo grid in the app renders — marketplace, collection, seller uploads,
profile — driven by a `variant: "locked" | "unlocked" | "seller"` prop rather
than three near-duplicate components. `types/photo.ts` defines the
`PhotoCardData` shape it (and the marketplace mapper in Stage 8) both agree
on. Alongside it: `stat-card.tsx` (dashboard KPI tiles), matching skeletons
for both, `score-tier-badge.tsx` and `points-display.tsx` for the small
recurring pieces of UI, `empty-states/empty-state.tsx` for every "nothing
here yet" screen, and `modals/confirm-dialog.tsx` — a generic confirm-then-
call-server-action dialog (later extended with an optional `children` slot
so admin actions like "suspend user" can collect a reason inline).

`components/layout/` holds the chrome shared by every authenticated screen:
`dashboard-sidebar.tsx` + `nav-link.tsx` (role-aware nav), `dashboard-header.tsx`
/ `site-header.tsx`, and `site-footer.tsx`. `app/buyer/layout.tsx`,
`app/seller/layout.tsx`, and `app/admin/layout.tsx` each call the matching
`requireBuyer`/`requireSeller`/`requireAdmin` RBAC guard before rendering
the shell, so route protection lives in one place per role instead of being
re-checked in every page.

## Buyer, seller, marketplace, AI scoring, social & admin (Stages 6-11)

**Buyer dashboard (Stage 6)** — overview, collection, wishlist, and settings
pages under `app/buyer/dashboard/`, all reading through the same
`photo-card.tsx` / `photoCardSelect` mapper the marketplace uses, so a photo
looks identical whether it's being browsed or already owned.

**Seller module (Stage 7)** — uploads go straight from the browser to
Cloudinary: `services/cloudinary/sign-upload.ts` signs the request
server-side, the client posts directly to Cloudinary's API, and
`actions/seller/upload.ts` only ever receives the resulting URL. Creating a
listing (`createPhotoAction`) writes the `Photo` row as `PENDING`,
immediately calls the AI scorer, persists the resulting `PhotoScore`, and
backfills `Photo.overallScore` / `scoreTier` / `price` in the same request so
the seller sees their score before the page even reloads. `editPhotoAction`
and `withdrawPhotoAction` (a soft-delete — withdrawn photos stay in the DB
for audit/history) round out listing management, and
`performance-chart.tsx` (Recharts) visualizes a seller's views/unlocks over
time.

**AI scoring (Stage 9, built alongside Stage 7)** — `services/ai-scoring/`
uses a pluggable provider interface: `openai-provider.ts` calls the OpenAI
vision API with a strict scoring rubric (`prompt.ts`), and the response is
validated against `schemas/ai-scoring.schema.ts` before it's trusted.
`mock-provider.ts` is a deterministic, seeded-PRNG fallback used
automatically when no OpenAI key is configured, and as a resilience
fallback if the real provider throws — so local dev and demo environments
never hard-depend on a paid API. `utils/score-tier.ts` is the single
`scoreTierFromScore()` implementation shared by both the service layer and
the `score-tier-badge` component.

**Marketplace & mystery unlocks (Stage 8)** — `actions/marketplace/list.ts`
paginates with a simple offset-based cursor (rather than Prisma keyset
cursors, which would need a different shape per sort field) so
newest/trending/highest-score/lowest-price all share one code path.
`actions/marketplace/unlock.ts` is the core money-shaped mutation: inside a
single `$transaction`, it conditionally decrements the buyer's balance with
`updateMany({ where: { pointsBalance: { gte: price } } })` so two concurrent
unlock attempts can't both succeed against a balance that only covers one,
credits the seller minus platform commission (rate read from
`PlatformSetting`, with an env-var default), writes a `MysteryUnlock` row,
and writes two immutable `PointTransaction` rows (one debit, one credit).
Gamification hooks (XP + achievement checks) run afterward as best-effort
side effects wrapped in their own try/catch, so a gamification hiccup never
turns an already-committed purchase into an error for the buyer.

**Social features (Stage 10)** — likes, bookmarks, follows, and threaded
comments (`actions/social/`) each fire a notification
(`services/notifications/create.ts`) to the relevant user, and comments
support one level of replies plus pinning (by the photo's seller or an
admin). `app/profile/[username]/page.tsx` and
`app/(marketing)/leaderboard/page.tsx` are the two new public-facing social
surfaces.

**Admin panel (Stage 11)** — every admin mutation
(`actions/admin/{moderation,users,reports,categories,announcements,settings,featured}.ts`)
writes an `AuditLog` row via `services/audit-log/create.ts`, since an admin
panel that can suspend accounts, adjust point balances, and change platform
economy settings without a paper trail isn't production-ready. Pages under
`app/admin/dashboard/` cover moderation, users, reports, categories,
analytics, economy settings, announcements, featured creators, audit logs,
and platform settings.

## Testing (Stage 12)

Two layers, deliberately: `vitest.config.ts` runs fast, mocked unit and
integration tests (`tests/unit/`, `tests/integration/`) against Node — no
real Postgres needed, since `@/lib/db/prisma` and the auth/gamification
service boundaries are mocked at the module level with `vi.mock`. The
riskiest mutation in the app, `unlockPhotoAction` (the mystery-unlock money
transfer), gets its own integration test in
`tests/integration/unlock.test.ts` exercising the commission split, the
race-safe insufficient-points path, and the best-effort gamification
fallback against a hand-built fake `tx` object that mirrors the real
`$transaction` callback shape. `playwright.config.ts` and `tests/e2e/`
cover the flows a mocked test can't meaningfully verify — real
Auth.js cookies/redirects (`auth.spec.ts`) and the full buyer purchase
journey from marketplace to collection (`unlock.spec.ts`) — run against a
real built app and a seeded database (`npm run build && npm run start`,
wired as Playwright's `webServer`).

Run `npm test` for the Vitest suite, `npm run test:e2e` for Playwright
(requires `npm run db:seed` first against whatever `DATABASE_URL` Playwright
is pointed at).

## Docker (Stage 13)

`next.config.mjs` sets `output: "standalone"` so `next build` emits a
pruned, self-contained server bundle. `docker/Dockerfile` is a four-stage
build (`deps` → `builder` → `runner`) — only the standalone output, static
assets, and the Prisma client/CLI needed to run migrations make it into the
final image, not the full `node_modules` or source tree. The image runs as
a non-root user and exposes a `HEALTHCHECK` against the new
`app/api/health` route, which does a real `SELECT 1` against Postgres
rather than just confirming the Node process is alive.
`docker/docker-entrypoint.sh` runs `prisma migrate deploy` (the
non-interactive, production-safe migration command) before starting the
server, so a container can never come up serving traffic against a stale
schema. `docker/docker-compose.yml` wires the app together with Postgres
and Redis for a single-VM/VPS deployment; `docker/docker-compose.dev.yml`
(from Stage 1) remains the local-dev-only Postgres+Redis pair used
alongside `npm run dev`.

## CI/CD & deployment (Stage 14)

`.github/workflows/ci.yml` runs on every PR and push to `main`: lint →
typecheck → unit/integration tests (with coverage) → production build →
(on `main` only) the full Playwright e2e suite against a seeded database,
each gated behind the previous job (`needs:`) so a lint failure fails in
seconds instead of after a multi-minute build. `.github/workflows/deploy.yml`
triggers only after CI reports success on `main` (`workflow_run`, not a bare
`push`, so a red build can never trigger a deploy), applies pending Prisma
migrations against production first, and only then deploys to Vercel via
the Vercel CLI's `pull` → `build` → `deploy --prebuilt` flow. `vercel.json`
configures the two scheduled routes (`/api/cron/daily-streak`,
`/api/cron/weekly-missions`) as native Vercel Crons; `.github/workflows/cron.yml`
is a GitHub Actions-native equivalent for the Docker/self-hosted path,
where there's no platform cron to lean on. Both cron routes are gated by a
shared-secret bearer token (`lib/cron/verify-cron-request.ts`) since they're
unauthenticated-by-necessity public HTTP endpoints.

Two previously-stubbed folders from the Stage 1 scaffold
(`app/api/cron/daily-streak`, `app/api/cron/weekly-missions`) are now real
route handlers: the daily job rolls each user's `streakCount`/`longestStreak`
forward or resets it based on `lastActiveDate`, and the weekly job rolls the
two `WEEKLY` `Mission` rows' date window forward and resets everyone's
`UserMission` progress for the new week.

## Growth & engagement features (Stage 15)

A follow-up round of additions on top of the original 14-stage spec, aimed
at retention and virality rather than the core transaction loop. Each one
reuses the existing architecture (Server Actions, the shared
`$transaction`-wrapped point-ledger pattern, `createNotification` as the
single notification fan-out point) rather than introducing a parallel
pattern.

**Streak calendar** — `ActivityLog` records one row per user per UTC
calendar day they did something streak-worthy (login, unlock, upload),
separate from the denormalized `User.streakCount`/`lastActiveDate`
columns those two only tell you the *current* streak length, not which
specific days were active, which is what `components/shared/streak-calendar.tsx`'s
30-day activity strip needs. `recordDailyActivity()` is called from all
three qualifying actions; `app/api/cron/daily-streak` (already built in
Stage 14) still owns the actual streak increment/reset.

**Wishlist match alerts** — `SavedSearchAlert` is a standing filter (breed/
age/energy/color/max price) distinct from `Wishlist` (which saves one
specific photo). `services/search-alerts/notify-matches.ts` runs once,
right after a photo is approved, and notifies every buyer whose alert
matches — built with exact null-handling (a blank alert field matches
anything; a *set* field only matches a photo that has a value for that
field too, never a vacuous match through Prisma's `undefined`-means-
no-constraint behavior).

**Seasonal leaderboard** — `SeasonScore` accumulates XP/unlocks per
calendar month (`lib/constants/season.ts`'s `currentSeasonKey()`)
alongside the existing all-time `User.xp`. No explicit "close the season"
job is needed — a new month simply has no rows yet. The leaderboard page
now has a season/all-time/sellers tab set instead of just two.

**Referral system** — every user gets a `referralCode` generated at the
Postgres level (`@default(dbgenerated(...))`, not application code)
specifically so it's populated even for accounts the Auth.js
`PrismaAdapter` creates directly on a Google sign-in, which never touches
the `register()` Server Action. The bonus (`services/referrals/grant-bonus.ts`)
pays out on the referred user's *first successful unlock*, not at
signup — tracking "this became an active user," not just "someone clicked
a link" — and is idempotency-guarded by `referralRewardedAt` checked
inside the same transaction as both point grants.

**Rewards catalog** — `RewardItem`/`RewardRedemption` let a user spend
points on something other than an unlock: a cosmetic profile badge, a
timed featured-creator boost, or a temporary reduction in the platform's
commission cut on that seller's future sales — never a cash-out, matching
the platform's internal-points-only design. `actions/rewards/redeem.ts`
validates each category's `Json` metadata with its own Zod schema before
trusting it, and `actions/marketplace/unlock.ts`'s commission calculation
now reads a seller's active discount (if any) alongside the platform
default.

**Real-photo contests** — `Contest`/`ContestEntry`/`ContestVote`. Entries
are always an existing, already-APPROVED `Photo` a seller already sells in
the marketplace — never a separate upload — so a contest can't become a
side channel for unmoderated content. One vote per user per contest
(`@@unique([contestId, voterId])`), one entry per seller per contest
(`@@unique([contestId, sellerId])`). `app/api/cron/close-contests` runs
hourly, promoting `UPCOMING` contests whose start time has arrived and
paying the top three entries their prize points the moment `endsAt`
passes.

**Mystery bundles** — an admin curates a `Bundle` of existing approved
photos sold together at a discount. `actions/marketplace/unlock-bundle.ts`
is the multi-photo sibling of the core unlock mutation: one purchase fans
out into one ordinary `MysteryUnlock` row per photo (linked via
`bundleUnlockId`), each with its own price share computed proportionally
to that photo's normal price (`services/marketplace/split-bundle-price.ts` —
a higher-value photo in the bundle earns its seller proportionally more,
not an even N-way split), so collection views, seller earnings, and the
point ledger all read a bundle purchase exactly like several individual
unlocks that happened to be bought together.

**Duplicate detection** — `services/moderation/perceptual-hash.ts`
computes a 64-bit average-hash (aHash) of every upload using `sharp`
(already a dependency — no new package needed) and flags a new photo as
`LIKELY_DUPLICATE` if its Hamming distance to any existing photo's hash is
below a threshold. It doesn't auto-reject; it raises `Photo.moderationFlag`
so an admin double-checks it in the moderation queue.

**AI content moderation** — the same vision-model call that scores a
photo (Stage 9) now also returns `isDogPhoto`/`moderationNote`, so an
upload that isn't clearly a real dog gets flagged (`LIKELY_NOT_A_DOG`/
`NEEDS_REVIEW`) instead of relying purely on human review to catch it.
The deterministic mock provider always reports "safe" (it never actually
looks at the image), so this only does real work when a real vision
provider is configured.

**Web push notifications** — `PushSubscription` stores one row per
device a user has granted permission on. `createNotification()` — already
the single place every in-app notification is created — now also fans out
to `services/push/send-to-user.ts` as a best-effort side channel; the
in-app `Notification` row stays the source of truth. `public/sw.js`
handles the `push`/`notificationclick` events; a subscription that comes
back 404/410 on send is pruned immediately rather than retried forever.

**PWA support** — `public/manifest.json` plus the service worker above
make the app installable. Deliberately minimal on the caching side (no
offline page shell beyond the bare essentials) since this is a mostly-
dynamic, database-backed app where a stale cached page would do more harm
than good — the value here is installability and push, not offline
browsing. The manifest references `/icons/icon-192.png` etc., which are
placeholder paths — no actual PNG assets were generated in this build
(there was no image-generation step in scope); add real icons before
shipping.

## Known limitations

This project was built in a sandboxed environment with no access to the
npm registry (installs return 403) and no real Postgres/Redis to connect
to, so nothing here has been run through a real `npm install`, `next build`,
`tsc --noEmit`, `prisma generate`, or the test suites themselves. Verification
was static instead: a project-wide script checking brace/paren/bracket
balance and that every `@/`-aliased import resolves to a real file (zero
unresolved imports across all 259 TypeScript files as of Stage 15), plus
careful manual review of every Prisma query shape, Server Action, and
cross-file type contract. Before treating this as production-ready, run
`npm install`, `npm run typecheck`, `npm run build`, `npm test`, and
`npm run test:e2e` locally or in CI and fix whatever that first real
compile turns up — there almost certainly will be a handful of small
issues (an off-by-one Prisma include/select mismatch, a subtly wrong
Auth.js v5 beta type) that no amount of static reading can guarantee
against.

Stage 15 adds two things worth knowing about before deploying: web push
requires a VAPID key pair (`npx web-push generate-vapid-keys`, then set
`NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` in
`.env`) or push sends silently no-op via `isVapidConfigured()`; and the
PWA manifest's icon paths (`/icons/icon-192.png`, etc.) are placeholders —
no actual icon image files were generated, so add real PNGs at those
paths before shipping or the manifest will 404 on those assets.

## Getting started

```bash
npm install
cp .env.example .env
docker compose -f docker/docker-compose.dev.yml up -d   # postgres + redis
npm run db:migrate
npm run db:seed
npm run dev
```

Seeding creates: 8 categories, 14 tags, 8 achievements, 3 badges, 5 missions,
2 platform settings, 1 admin (`admin@pawdrop.app` / see `.env` `ADMIN_SEED_PASSWORD`),
4 sellers and 3 buyers (password `Password123!`) with a realistic mix of
approved/pending/rejected photos, AI scores, follows, likes, comments, and a
handful of completed unlocks with full point-ledger entries. None of the
seeded accounts have 2FA enabled by default — enable it per-account from
`actions/auth/two-factor.ts` once the settings UI exists (Stage 6/7).

Without `RESEND_API_KEY` set, `sendEmail()` logs and skips instead of
throwing, so registration/login work end-to-end locally without email
configured. Without `AUTH_GOOGLE_ID`/`SECRET`, the Google button will error
if clicked — email/password auth is unaffected.
