-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (mirrors Supabase auth.users)
create table public.users (
  id uuid references auth.users primary key,
  name text not null,
  email text unique not null,
  avatar text,
  role text default 'user',
  is_pro boolean default false,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Public read" on public.users for select using (true);
create policy "Self update" on public.users for update using (auth.uid() = id);

-- Images
create table public.images (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  image_url text not null,
  prompt text not null,
  model text,
  style text,
  aspect_ratio text default '1:1',
  tags text[] default '{}',
  is_premium boolean default false,
  price numeric(10,2),
  likes_count integer default 0,
  is_published boolean default true,
  created_at timestamptz default now()
);
alter table public.images enable row level security;
create policy "Public read published" on public.images for select using (is_published = true);
create policy "Owner insert" on public.images for insert with check (auth.uid() = user_id);
create policy "Owner update" on public.images for update using (auth.uid() = user_id);

-- Collections
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  name text not null,
  is_public boolean default true,
  created_at timestamptz default now()
);
alter table public.collections enable row level security;
create policy "Public read" on public.collections for select using (is_public = true or auth.uid() = user_id);
create policy "Owner write" on public.collections for all using (auth.uid() = user_id);

-- Saved Items
create table public.saved_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users not null,
  image_id uuid references public.images not null,
  collection_id uuid references public.collections,
  created_at timestamptz default now(),
  unique(user_id, image_id, collection_id)
);
alter table public.saved_items enable row level security;
create policy "Owner access" on public.saved_items for all using (auth.uid() = user_id);

-- Follows
create table public.follows (
  follower_id uuid references public.users not null,
  following_id uuid references public.users not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "Public read" on public.follows for select using (true);
create policy "Auth insert" on public.follows for insert with check (auth.uid() = follower_id);
create policy "Auth delete" on public.follows for delete using (auth.uid() = follower_id);

-- Likes
create table public.likes (
  user_id uuid references public.users not null,
  image_id uuid references public.images not null,
  created_at timestamptz default now(),
  primary key (user_id, image_id)
);
alter table public.likes enable row level security;
create policy "Public read likes" on public.likes for select using (true);
create policy "Owner modify likes" on public.likes for all using (auth.uid() = user_id);

-- Prompt Copies (rate limiting)
create table public.prompt_copies (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null, -- can be IP for guest, or user UUID
  image_id uuid references public.images not null,
  copied_at timestamptz default now()
);
alter table public.prompt_copies enable row level security;
create policy "Owner read copies" on public.prompt_copies for select using (auth.uid()::text = user_id);
create policy "Owner insert copies" on public.prompt_copies for insert with check (auth.uid()::text = user_id);
create index prompt_copies_user_id_copied_at_idx on public.prompt_copies (user_id, copied_at);


-- Subscriptions
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users unique not null,
  plan text not null,
  status text not null,
  stripe_id text,
  created_at timestamptz default now(),
  expires_at timestamptz
);
alter table public.subscriptions enable row level security;
create policy "Owner read" on public.subscriptions for select using (auth.uid() = user_id);

-- Transactions
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  buyer_id uuid references public.users not null,
  seller_id uuid references public.users not null,
  image_id uuid references public.images not null,
  amount numeric(10,2) not null,
  platform_cut numeric(10,2) not null,
  created_at timestamptz default now()
);

-- Helper functions for likes
create or replace function increment_likes(img_id uuid)
returns void language sql as $$
  update images set likes_count = likes_count + 1 where id = img_id;
$$;

create or replace function decrement_likes(img_id uuid)
returns void language sql as $$
  update images set likes_count = likes_count - 1 where id = img_id;
$$;

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
