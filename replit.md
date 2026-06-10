# OfferLoots

A full GPT (Get-To-Paid) rewards platform where users complete offerwalls to earn real cash. Features user auth, multiple offerwall network integrations, postback/S2S tracking, admin panel, withdrawal system, referrals, and a competitive leaderboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/offerloots run dev` — run the frontend (proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (Bearer token, stored as `offerloots_token` in localStorage)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (users, networks, offers, conversions, transactions, withdrawals, apikeys)
- `lib/api-spec/openapi.yaml` — OpenAPI 3.0 spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks
- `lib/api-zod/src/generated/` — Orval-generated Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/auth.ts` — JWT + bcrypt helpers, rank computation
- `artifacts/offerloots/src/` — React frontend (pages, layouts, components)
- `artifacts/offerloots/src/lib/auth.tsx` — AuthContext with JWT management

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks and validators
- JWT auth (not sessions) — stateless, Bearer token in `Authorization` header
- Postback endpoint (`GET /api/postback`) is public for offerwall network callbacks
- Balance deducted immediately on withdrawal request; refunded on rejection
- Rank computed from `total_earned` (not current balance): Bronze→Silver→Gold→Platinum→Diamond

## Product

Users register (optionally with referral code), complete offers from integrated offerwalls (OfferToro, AdGate, CPX Research, Lootably, RevenueWall, AdGem, Monlix, Ayet Studios), earn cash credited via S2S postback, then withdraw via PayPal/Crypto/Wise/etc. Admin panel covers users, offers, networks, withdrawals queue, conversions log, and revenue analytics.

## Test accounts

- Admin: `admin@offerloots.com` / `admin123`
- Users: `cashking@example.com` / `user123`, `topearner@example.com` / `user123`

## Postback URL format

`/api/postback?network={slug}&subid={user_id}&amount={payout}&txid={txid}&status=approved`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/db run push` after schema changes before restarting the API server
- `@workspace/api-client-react` exports `./custom-fetch` as a subpath — required for JWT injection
- Postback deduplication uses `txid` unique constraint in the `conversions` table
- `pnpm run typecheck:libs` must run before leaf artifact typechecks when lib schemas change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
