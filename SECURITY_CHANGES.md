# PromptPin — Security & Feature Changes

## ACTION REQUIRED (one time)
1. Run `supabase/security_fixes.sql` in the Supabase SQL editor (idempotent, safe to re-run). Do this BEFORE deploying the new backend — it fixes open RLS policies and creates the `ai_usage` table the backend now uses.
2. In production, set `ALLOWED_ORIGINS` in `backend/.env` to your real frontend URL (e.g. `https://promptpin.vercel.app`). It defaults to `http://localhost:3000`.

## Security fixes (backend)
| Issue | Severity | Fix |
|---|---|---|
| `CORS allow_origins=["*"]` with credentials | Critical | Origin allowlist via `ALLOWED_ORIGINS` env var (`app/main.py`) |
| Broken auth checks — `sb.auth.get_user()` failures could pass, duplicated in every route | Critical | New `app/core/auth.py` with `get_current_user` / `get_optional_user` FastAPI dependencies; used by all protected routes |
| Unvalidated image upload — trusted client `content_type`, no size cap, SVG/HTML uploadable (stored XSS via storage) | Critical | `app/core/storage.py` now verifies magic bytes with Pillow, allows only JPEG/PNG/WEBP, enforces 10MB + dimension limits, derives extension/content-type from actual bytes, removed `x-upsert` |
| Premium prompt leak — logged-in non-pro users could copy premium prompts free | High | `/prompts/{id}/copy` rewritten: premium gate checked for every non-pro identity; rate limit applies to signed-in free users too (was guests-only) |
| Rate-limit key collision — guest IPs stored in same namespace as user IDs | High | Guest keys prefixed `ip:`; honors `X-Forwarded-For` behind proxies |
| Groq endpoints had no usage cap (cost abuse) | High | Per-user daily quota (`AI_DAILY_LIMIT`, default 20) via new `ai_usage` table; prompt length capped; anti-prompt-injection system prompts |
| Public `/users/{id}` returned **email** of any user | High | Public endpoint returns only `id, name, avatar, role, is_pro, created_at` |
| `/users/{id}/images` leaked unpublished images | Medium | Now filters `is_published = true` |
| Unbounded `page`/`limit` params (DoS) | Medium | Clamped everywhere (max 60/page) |
| `%`/`_` unescaped in search (ILIKE wildcard injection) | Low | `escape_like()` in feed + search |
| Upload errors returned as `200` to the client (`api.ts` skipped `res.ok`) | Medium | `uploadImage` now throws on non-OK with server detail |

## Security fixes (database — `supabase/security_fixes.sql`)
- **likes**: was `using (true)` for ALL — anyone could like/unlike as anyone. Now owner-scoped insert/delete, public read.
- **prompt_copies**: was `using (true)` — rate-limit rows readable (IP harvesting) & deletable (limit bypass). Now service-role only.
- **transactions**: had NO RLS — financial rows publicly readable. Now buyer/seller-only select.
- **users**: public read exposed emails. Column-level grant hides `email` from anon/authenticated API access.
- **images**: added owner DELETE policy.
- **Atomic like counts**: DB trigger replaces racy check-then-RPC `increment_likes`/`decrement_likes` (old RPCs revoked from public).
- **Indexes**: feed, top-sort, trigram prompt search (`pg_trgm`), tags GIN, per-user, rate-limit lookups — there were none before.

## New features
- **Hot / New / Top tabs now actually work** — feed accepts `?sort=new|top|trending` (trending = most-liked last 7 days, falls back to all-time top when quiet). Frontend tabs wired to it; no visual change.
- **DELETE /api/v1/images/{id}** — owners can delete their image; cleans up likes/saves/copies and the storage object. Frontend helper: `api.deleteImage(id, token)`.
- **POST /api/v1/prompts/chat** — the ChatBot/DM sidebar previously called `api.chatPrompt(...)` which didn't exist anywhere; both ends now implemented (Groq-backed, quota-limited, works for guests via IP limit).
- **DELETE /collections/{id}/save/{image_id}** — un-save an image from a collection.
- **PNG metadata width/height** captured at upload (`width`/`height` columns) — enables layout-shift-free rendering later.
- **Client-side upload validation** — type/size checked before hitting the API (toast errors only; upload page visuals untouched).

## Files changed
Backend: `main.py`, `core/config.py`, `core/auth.py` (new), `core/storage.py`, all 5 route files, `schemas/image.py`, `schemas/user.py`
Database: `supabase/security_fixes.sql` (new)
Frontend (wiring only, no redesign): `lib/api.ts`, `app/feed/page.tsx` (sort param), `app/upload/page.tsx` (file validation), `app/search/page.tsx` (repaired truncated file)

## Verification done
- All backend files compile (`python -m py_compile`)
- `npx tsc --noEmit` passes with zero errors
- Repaired pre-existing corruption: NUL bytes embedded in 7 source files and truncated endings in `lib/api.ts`, `app/search/page.tsx`, `app/upload/page.tsx` (these would have broken any build)

---

## MVP feature work (session 2) — creator/social layer

Implemented the top MVP items from `PRODUCT_ROADMAP.md` that ride on existing schema. No visual redesign — the frontend components for these already existed and were calling endpoints that didn't exist yet; this session built the missing backend + reconciled the API layer.

### New / wired endpoints
- **GET `/users/{id}/profile`** — public creator profile: name, avatar, images_count, followers, following, plus `is_me` / `is_following` for the viewer. Powers the profile page.
- **POST `/users/{id}/follow`** — toggle follow, returns `{following: bool}`. Uses existing `follows` table; blocks self-follow; 404s unknown users.
- **POST `/images/{id}/save`** + **GET `/images/{id}/save-status`** + **GET `/images/saved/list`** — one-tap save into an auto-created private "Saved" collection (these already existed in images.py from prior work; confirmed correct and de-duplicated).
- **Creator attribution** — feed, trending fallback, image detail, and user-images queries now `select("*, users(id, name, avatar)")` so cards can show the real creator instead of the "PromptPin" placeholder. `ImageOut` schema carries an optional `users` (CreatorInfo) object.

### Database (`security_fixes.sql` — item #10)
- Created **`direct_messages`** table with RLS (participants-only read, sender-only insert), index, and realtime publication. The DMPanel component queries this table but it was never created — DMs would have thrown at runtime.
- Removed `email` from the DMPanel user-search select (was fetched but unused; avoids leaking PII into the client).

### Verification
- All backend files compile (`py_compile`).
- `npx tsc --noEmit` passes with zero errors.
- De-duplicated save endpoints (an appended set collided with pre-existing ones — removed the duplicates, kept the default-collection implementation).
- Orphaned scratch files `routes/social.py` and `routes/saved.py` are not registered in `main.py` (logic merged into users.py / images.py); left with header comments since sandbox blocks deletion — safe to delete manually.

---

## Monetization layer (session 3) — Pro subscription

### Stripe integration (`backend/app/api/routes/billing.py`)
- **POST `/billing/checkout`** — server-side Stripe Checkout session for the Pro plan (client never sees price IDs); reuses existing Stripe customer when present.
- **POST `/billing/portal`** — Stripe customer portal (self-serve cancel/payment method).
- **GET `/billing/status`** — `{is_pro, subscription}` for the current user.
- **POST `/billing/webhook`** — signature-verified; the ONLY code path that flips `is_pro`. Handles `checkout.session.completed`, `customer.subscription.updated/deleted` (auto-downgrade on cancel/past_due).
- `stripe==9.12.0` added to requirements; new env vars in `backend/.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, success/cancel URLs.

### Critical security fixes found during this work
1. **`is_pro` was self-serviceable**: the `"Self update"` RLS policy let any user update their own row — including `is_pro` and `role` — with the public anon key. Anyone could grant themselves Pro for free. Fixed in `security_fixes.sql` #11: users may now update only `name` and `avatar`.
2. **Premium prompts leaked in full** via GET feed/detail/search/saved/user-images — the paywall only guarded the copy button. New `core/redact.py` truncates premium prompts to a 60-char teaser server-side unless the viewer is Pro or the owner; responses carry `prompt_locked: true` so the UI can show a lock state.

### Frontend (new page + wiring, no redesign)
- **`/pro` pricing page** — Free vs Pro comparison in the existing dark amber theme; starts checkout, shows "Manage subscription" (portal) for existing subscribers, handles `?status=success|cancelled` returns.
- `api.ts`: `createCheckout`, `openBillingPortal`, `getBillingStatus`.
- Copy-limit (429) and premium (403) error toasts now include a **"Go Pro"** action button → `/pro` — the natural conversion moment.

### Stripe setup checklist (one time)
1. Create a product "PromptPin Pro" with a $6/mo recurring price → copy the `price_...` id into `STRIPE_PRICE_ID`.
2. Copy the secret key into `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint `https://<your-backend>/api/v1/billing/webhook` with events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` → copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Update success/cancel URLs to the production frontend.
5. Re-run `supabase/security_fixes.sql` (adds `stripe_customer_id` + locks down `is_pro`).
6. `pip install -r requirements.txt` (adds stripe).
