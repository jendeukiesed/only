# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# PawDrop production image — four stages so the final image only carries a
# pruned Next.js standalone server, never a full node_modules or the source
# tree. Build from the repo root: `docker build -f docker/Dockerfile .`
# ---------------------------------------------------------------------------

ARG NODE_VERSION=20-alpine

# --- Stage 1: deps ----------------------------------------------------------
# Installs the full dependency tree (incl. devDependencies, since the build
# stage needs the TypeScript compiler, Tailwind, etc.) into its own layer so
# it's only invalidated when package*.json actually change.
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci

# --- Stage 2: builder --------------------------------------------------------
# Generates the Prisma client (needs the real schema on disk, not just the
# generated types) and runs the production Next.js build, which emits the
# pruned `.next/standalone` output because next.config.mjs sets
# `output: "standalone"`.
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# A syntactically-valid but non-functional DATABASE_URL is enough for
# `prisma generate` (it only needs the schema, not a live connection) and
# for `next build` to statically analyze pages — no real secrets belong in
# a build-time layer.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"

RUN npm run db:generate
RUN npm run build

# --- Stage 3: runner ---------------------------------------------------------
# The image that actually ships: a non-root user, only the standalone
# server + static assets + Prisma client/migrations needed to run
# `migrate deploy` on boot.
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/db/prisma ./db/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY docker/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown nextjs:nodejs /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
