-- ============================================================
-- PromptPin security fixes — run ONCE in the Supabase SQL editor
-- Safe to re-run (idempotent). Run BEFORE deploying the new backend.
-- ============================================================

-- ── 1. LIKES: was `using (true)` for ALL ops → anyone with the anon key
--       could insert/delete likes for any user. Now owner-scoped.
drop policy if exists "Auth all" on public.likes;
drop policy if exists "Public read likes" on public.likes;
drop policy if exists "Own like insert" on public.likes;
drop policy if exists "Own like delete" on public.likes;
create policy "Public read likes" on public.likes for select using (true);
create policy "Own like insert" on public.likes for insert with check (auth.uid()::text = user_id);
create policy "Own like delete" on public.likes for delete using (auth.uid()::text = user_id);

-- ── 2. PROMPT_COPIES: was `using (true)` → rate-limit rows could be read
--       (IP harvesting) or deleted (limit bypass). Now service-role only.
drop policy if exists "Auth all" on public.prompt_copies;
-- No policies remain: anon/authenticated are blocked; the backend's
-- service-role key bypasses RLS, which is the only intended writer.

-- ── 3. TRANSACTIONS: had NO RLS → financial data publicly readable.
alter table public.transactions enable row level security;
drop policy if exists "Own transactions" on public.transactions;
create policy "Own transactions" on public.transactions
  for select using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ── 4. USERS: `Public read using (true)` exposed every user's EMAIL.
--       Column-level grants hide email from the public API.
revoke select on public.users from anon, authenticated;
grant select (id, name, avatar, role, is_pro, created_at) on public.users to anon, authenticated;

-- ── 5. IMAGES: owners could not delete their own content (GDPR issue).
drop policy if exists "Owner delete" on public.images;
create policy "Owner delete" on public.images for delete using (auth.uid() = user_id);

-- ── 6. ATOMIC LIKE COUNTS: replaces racy check-then-RPC pattern.
--       Trigger keeps likes_count consistent no matter who writes.
create or replace function public.sync_likes_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.images set likes_count = likes_count + 1 where id = new.image_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.images set likes_count = greatest(0, likes_count - 1) where id = old.image_id;
    return old;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_likes_count on public.likes;
create trigger trg_likes_count
  after insert or delete on public.likes
  for each row execute procedure public.sync_likes_count();

-- Old RPCs are no longer used by the backend; block public invocation.
revoke execute on function public.increment_likes(uuid) from anon, authenticated;
revoke execute on function public.decrement_likes(uuid) from anon, authenticated;

-- ── 7. AI USAGE QUOTA TABLE (per-user daily cap on Groq endpoints).
create table if not exists public.ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  created_at timestamptz default now()
);
alter table public.ai_usage enable row level security;
-- service-role only (no policies)

-- ── 8. IMAGE DIMENSIONS (populated by the new upload validator;
--       enables CLS-free rendering + real masonry later).
alter table public.images
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists title text;

-- ── 9. INDEXES (there were none beyond primary keys).
create index if not exists idx_images_feed on public.images (is_published, created_at desc);
create index if not exists idx_images_top on public.images (is_published, likes_count desc);
create extension if not exists pg_trgm;
create index if not exists idx_images_prompt_trgm on public.images using gin (prompt gin_trgm_ops);
create index if not exists idx_images_tags on public.images using gin (tags);
create index if not exists idx_images_user on public.images (user_id, created_at desc);
create index if not exists idx_prompt_copies_lookup on public.prompt_copies (user_id, copied_at desc);
create index if not exists idx_ai_usage_lookup on public.ai_usage (user_id, created_at desc);
create index if not exists idx_likes_image on public.likes (image_id);
create index if not exists idx_saved_items_user on public.saved_items (user_id);

-- ── 10. DIRECT MESSAGES (DMPanel uses this table; it was never created).
create table if not exists public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  room_id text not null,
  sender_id uuid references public.users not null,
  receiver_id uuid references public.users not null,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz default now()
);
alter table public.direct_messages enable row level security;
drop policy if exists "DM participants read" on public.direct_messages;
create policy "DM participants read" on public.direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "DM sender insert" on public.direct_messages;
create policy "DM sender insert" on public.direct_messages
  for insert with check (auth.uid() = sender_id);
create index if not exists idx_dm_room on public.direct_messages (room_id, created_at);
-- Realtime for live chat (safe if already added)
do $$ begin
  alter publication supabase_realtime add table public.direct_messages;
exception when duplicate_object then null; end $$;

-- ── 11. BILLING (Stripe Pro subscription).
alter table public.users add column if not exists stripe_customer_id text;
create index if not exists idx_users_stripe_customer on public.users (stripe_customer_id);
-- is_pro must never be client-writable: the "Self update" policy allows users
-- to update their own row, which includes is_pro/role. Lock those columns down.
revoke update on public.users from anon, authenticated;
grant update (name, avatar) on public.users to anon, authenticated;
