---
name: OfferLoots Architecture
description: Key decisions, data shape quirks, and invariants for the OfferLoots rewards platform.
---

## Auth
JWT (HS256), signed with `SESSION_SECRET`. Stored as `offerloots_token` in localStorage. Injected via `setAuthTokenGetter` from `@workspace/api-client-react/custom-fetch`. Token payload: `{ userId, role }`.

## API shape mismatches
- `GET /api/withdrawals` (user route) → returns a **direct array**, not `{ data, total, page, limit }`.
- `GET /api/admin/withdrawals` → returns `{ data, total, page, limit }` (paginated).
- All other list endpoints (offers, transactions, conversions, admin/users, admin/offers) → paginated `{ data, total, page, limit }`.

**Why:** User withdrawals were simpler to return as an array since there's no server-side pagination needed. Front-end must cast with `(withdrawalsData as any[])` when mapping.

## Rank tiers
Computed from `total_earned` (not current balance): Bronze → Silver ($50+) → Gold ($200+) → Platinum ($500+) → Diamond ($1000+). Implemented in `artifacts/api-server/src/lib/auth.ts → computeRank()`.

## Postback / S2S
`GET /api/postback` is **public** (no auth). Deduplication via `txid` unique constraint in `conversions` table. Network stats updated atomically on each successful postback.

## Withdrawal flow
Balance deducted immediately on `POST /api/withdrawals`. If admin rejects → balance refunded. If approved → `total_withdrawn` incremented. Minimum $5.

## Package export
`@workspace/api-client-react` must export `"./custom-fetch": "./src/custom-fetch.ts"` in `package.json` exports — required for JWT injection in the frontend.

## Seeding
Seed users via `POST /api/auth/register` (they come in as `role: "user"`). Then `UPDATE users SET role = 'admin' WHERE username = 'admin'`. Seed earnings via `GET /api/postback` with the user's `id` as `subid`.
