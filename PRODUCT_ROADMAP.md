# PromptPin — Feature Strategy & Roadmap (2026-07)

Scores 1–10. Difficulty: lower = easier. Priority = Value + Virality + Revenue − Difficulty.
Ratings account for infrastructure that ALREADY exists in the codebase (follows table, collections API,
subscriptions/transactions tables, is_premium/price fields, Groq integration, prompt_copies tracking).

| # | Feature | Value | Diff | Viral | Rev | Pri | Notes |
|---|---------|-------|------|-------|-----|-----|-------|
| 1 | Creator profiles + follow | 9 | 3 | 7 | 4 | 17 | `follows` table already exists; feed shows "PromptPin" instead of creators today — biggest retention gap |
| 2 | Collections / boards UI | 9 | 2 | 6 | 3 | 16 | Backend API already built & secured; just needs a save button + boards page |
| 3 | "Open in model" deep links | 8 | 2 | 8 | 3 | 17 | Copy → opens Midjourney/web UI with prompt prefilled; closes the loop that brings users here |
| 4 | Full metadata auto-extraction on upload | 9 | 3 | 6 | 3 | 15 | PNG parameter parsing already started; extend to seed/steps/CFG/negative prompt + auto-tags via Groq |
| 5 | Share cards w/ OG images | 6 | 2 | 9 | 2 | 15 | Every shared link becomes an ad; pairs with SEO work |
| 6 | Comments on images | 8 | 4 | 7 | 3 | 14 | First true community feature; needs moderation basics (report + owner delete) |
| 7 | Leaderboards + creator badges | 6 | 3 | 8 | 3 | 14 | Weekly top creators/prompts; cheap gamification on existing likes data |
| 8 | Weekly prompt challenges | 8 | 4 | 9 | 5 | 18 | Theme + submissions + voting; strongest organic-growth engine; sponsorable later |
| 9 | Notifications (likes/follows/comments) | 7 | 4 | 6 | 3 | 12 | Page already stubbed; Supabase realtime makes this cheap; retention driver |
| 10 | Personalized "For You" feed | 9 | 5 | 5 | 6 | 15 | Rule-based v1: affinity from likes/saves/copies (copies = strongest intent signal); no ML needed |
| 11 | Pro subscription | 7 | 4 | 3 | 9 | 15 | `subscriptions` table + `is_pro` + copy limits already enforced; add Stripe checkout + webhook |
| 12 | Prompt marketplace (sell prompts) | 7 | 7 | 5 | 10 | 15 | `is_premium`/`price`/`transactions` schema ready; needs Stripe Connect + payout flow + premium gating UI |
| 13 | Email digest ("prompts you'll love") | 6 | 3 | 7 | 5 | 15 | Weekly personalized email; re-activation channel; use Resend/Loops |
| 14 | Tag & model landing pages (SEO hubs) | 6 | 2 | 5 | 5 | 14 | /t/cyberpunk, /m/midjourney — massive long-tail keyword surface, near-zero build cost |
| 15 | Remix trees / lineage | 7 | 5 | 8 | 3 | 13 | Remix button exists; add parent_id + "remixed from" chain; makes creation social |
| 16 | Prompt quality score | 6 | 3 | 5 | 4 | 12 | Groq rubric at upload; gamifies better submissions; feeds ranking signal |
| 17 | Creator analytics dashboard | 6 | 4 | 3 | 6 | 11 | Views/copies/saves per image; the carrot that attracts serious creators (data already tracked) |
| 18 | Saved-search & follow-tag alerts | 5 | 4 | 5 | 4 | 10 | "Notify me for new 'cinematic portrait' prompts"; niche retention |
| 19 | Public API + embeds | 5 | 5 | 6 | 7 | 13 | Embeddable prompt cards for blogs; API tier under Pro/Enterprise |
| 20 | In-browser generation ("Try this prompt") | 10 | 8 | 9 | 8 | 19 | Run prompt via Flux/SDXL API with credits; the endgame differentiator — expensive, do last |

## Roadmap

### MVP (Weeks 1–2) — activate what's already built
- Collections UI (#2) — save button on cards, /saved boards page
- Creator attribution + profiles + follow (#1) — join users into feed query, follow button
- "Open in model" links (#3) + share OG cards (#5)
- Deploy security_fixes.sql, Stripe test keys groundwork
**Goal: a visitor can follow a creator, save to a board, and share — the retention loop exists.**

### Phase 1 (Weeks 3–6) — engagement & growth
- Comments (#6) + notifications (#9)
- Full metadata extraction + auto-tagging (#4), prompt quality score (#16)
- Leaderboards (#7), first weekly challenge (#8)
- Tag/model SEO pages (#14)
**Goal: DAU/WAU up; organic acquisition compounding via SEO + shares.**

### Phase 2 (Months 2–3) — monetization
- Pro subscription w/ Stripe (#11): unlimited copies, AI tools, badge, analytics
- Creator analytics (#17) as Pro carrot
- Personalized feed v1 (#10) + email digest (#13)
**Goal: first revenue; conversion target 2–4% of WAU to Pro.**

### Phase 3 (Months 4–6) — marketplace & moat
- Prompt marketplace with Stripe Connect payouts (#12), 80/20 split
- Remix trees (#15), saved-search alerts (#18), public API (#19)
- Scope in-browser generation (#20) behind credits — validate cost model first
**Goal: two-sided marketplace; creators earn → best creators stay exclusive.**

### Sequencing logic
1. Weeks 1–2 ship almost entirely on top of code that already exists (follows table, collections API, premium fields) — maximum output per engineering hour.
2. Community features before monetization: paying users churn without a daily habit.
3. Marketplace after Pro: Stripe Connect, payouts, fraud and support burden are 5× a simple subscription — earn the right to that complexity with proven demand (track copy-limit 429s and premium-gate 403s as demand signals; both are already logged in prompt_copies).
