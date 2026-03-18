-- ═══════════════════════════════════════════════════════
-- 1. TABLES & BASE SCHEMA
-- ═══════════════════════════════════════════════════════

-- USERS: Extends Supabase auth.users
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  friend_code text unique not null,
  birthday date,
  theme_mode text not null default 'light' check (theme_mode in ('light', 'dark')),
  theme_color text not null default 'zinc' check (theme_color in ('zinc', 'rose', 'blue', 'green', 'orange', 'violet')),
  onboarded boolean not null default false,
  time_format text not null default '12h' check (time_format in ('12h', '24h')),
  created_at timestamptz not null default now()
);

-- COLLECTIONS: Groups of wishlist items with privacy settings
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  emoji text default null,
  banner_url text default null,
  is_system boolean not null default false,
  visibility text not null default 'public' check (visibility in ('public', 'exclusive')),
  allowed_users uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ITEMS: Individual wishlist items
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  price numeric,
  image_url text,
  link text not null,
  custom_links jsonb not null default '[]'::jsonb,
  is_claimed boolean not null default false,
  claimed_by uuid references public.users(id) on delete set null,
  gifted_at timestamptz default null,
  bought_at timestamptz default null,
  created_at timestamptz not null default now()
);

-- JUNCTION: Item <-> Collection
create table public.item_collections (
  item_id uuid not null references public.items(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  primary key (item_id, collection_id)
);

-- EVENTS: Date-based occasions
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  collection_id uuid references public.collections(id) on delete set null,
  title text not null,
  description text,
  date date not null,
  time time,
  location text,
  banner_url text default null,
  visibility text not null default 'public' check (visibility in ('public', 'exclusive')),
  allowed_users uuid[] not null default '{}',
  custom_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- FRIENDSHIPS: Two-way connections
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  addressee_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint unique_friendship unique (requester_id, addressee_id),
  constraint no_self_friend check (requester_id != addressee_id)
);

-- FRIEND GROUPS: User-defined clusters of friends
create table public.friend_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.friend_group_members (
  group_id uuid not null references public.friend_groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (group_id, user_id)
);

-- ═══════════════════════════════════════════════════════
-- 2. INDEXES
-- ═══════════════════════════════════════════════════════

create index idx_users_friend_code on public.users(friend_code);
create index idx_collections_user on public.collections(user_id);
create index idx_items_user on public.items(user_id);
create index idx_items_bought_at on public.items(bought_at);
create index idx_events_user on public.events(user_id);
create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);
create index idx_friend_groups_user on public.friend_groups(user_id);
create index idx_friend_group_members_group on public.friend_group_members(group_id);

-- ═══════════════════════════════════════════════════════
-- 3. CORE FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════

-- Friend Check Utility
create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = user_a and addressee_id = user_b) or (requester_id = user_b and addressee_id = user_a))
  );
$$;

-- Friend Code Generator: LIEB-XXXX-XXXX
create or replace function public.generate_friend_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  part1 text; part2 text; code text;
begin
  loop
    part1 := ''; part2 := '';
    for i in 1..4 loop
      part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
      part2 := part2 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    code := 'LIEB-' || part1 || '-' || part2;
    if not exists (select 1 from public.users where friend_code = code) then return code; end if;
  end loop;
end; $$;

-- Signup Handler
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.users (id, display_name, avatar_url, friend_code)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'User'), new.raw_user_meta_data ->> 'avatar_url', public.generate_friend_code());
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- System Collection Protections
create or replace function prevent_system_collection_mutation()
returns trigger language plpgsql as $$
begin
  if old.is_system = true then raise exception 'Cannot modify or delete a system collection.'; end if;
  return old;
end; $$;

create trigger trg_prevent_system_collection_delete before delete on collections for each row execute function prevent_system_collection_mutation();

-- ═══════════════════════════════════════════════════════
-- 4. VIEW (The Primary Data Interface)
-- ═══════════════════════════════════════════════════════

create or replace view public.items_visible
with (security_invoker = true)
as
select
  i.id, i.user_id, i.name, i.price, i.image_url, i.link, i.custom_links, i.gifted_at, i.bought_at, i.created_at,
  case when i.user_id = auth.uid() then false else i.is_claimed end as is_claimed,
  case
    when i.user_id = auth.uid() then null
    when i.claimed_by = auth.uid() then i.claimed_by
    else null
  end as claimed_by,
  coalesce(array_agg(ic.collection_id) filter (where ic.collection_id is not null), '{}') as collection_ids
from public.items i
left join public.item_collections ic on ic.item_id = i.id
group by i.id;

-- ═══════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════

alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.collections enable row level security;
alter table public.events enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_groups enable row level security;
alter table public.friend_group_members enable row level security;

-- Users
create policy "Users: public read, self update" on public.users for select using (true);
create policy "Users: self update" on public.users for update using (id = auth.uid());

-- Friendships & Groups
create policy "Friendships: access" on public.friendships for select using (requester_id = auth.uid() or addressee_id = auth.uid());
create policy "Friend Groups: select access" on public.friend_groups for select using (user_id = auth.uid() or exists (select 1 from public.friend_group_members where group_id = id and user_id = auth.uid()));
create policy "Friend Groups: owner manage" on public.friend_groups for insert, update, delete using (user_id = auth.uid());
create policy "Friend Group Members: select access" on public.friend_group_members for select using (user_id = auth.uid() or exists (select 1 from public.friend_groups where id = group_id and user_id = auth.uid()));
create policy "Friend Group Members: owner manage" on public.friend_group_members for insert, update, delete using (exists (select 1 from public.friend_groups where id = group_id and user_id = auth.uid()));

-- Collections (Privacy Aware)
create policy "Collections: owner manage" on public.collections for all using (user_id = auth.uid());
create policy "Collections: select access" on public.collections for select using (
  user_id = auth.uid() OR (
    public.are_friends(auth.uid(), user_id) AND (
      visibility = 'public' OR auth.uid() = ANY(allowed_users)
    )
  )
);

-- Events (Privacy Aware)
create policy "Events: owner manage" on public.events for all using (user_id = auth.uid());
create policy "Events: select access" on public.events for select using (
  user_id = auth.uid() OR (
    public.are_friends(auth.uid(), user_id) AND (
      visibility = 'public' OR auth.uid() = ANY(allowed_users)
    )
  )
);

-- Items
create policy "Items: read access" on public.items for select using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "Items: owner manage" on public.items for all using (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════
-- 6. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true), ('banners', 'banners', true) on conflict do nothing;

create policy "Storage: owner manage" on storage.objects for all using (bucket_id in ('avatars', 'banners') and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Storage: public read" on storage.objects for select using (bucket_id in ('avatars', 'banners'));

-- ═══════════════════════════════════════════════════════
-- 7. APPLICATION LOGIC (RPC)
-- ═══════════════════════════════════════════════════════

create or replace function public.claim_item(item_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.items set is_claimed = true, claimed_by = auth.uid()
  where id = item_id and is_claimed = false and user_id != auth.uid() and public.are_friends(auth.uid(), user_id);
  if not found then raise exception 'Cannot claim item.'; end if;
end; $$;

create or replace function public.unclaim_item(item_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.items set is_claimed = false, claimed_by = null, bought_at = null where id = item_id and claimed_by = auth.uid();
  if not found then raise exception 'Only the claimer can unclaim.'; end if;
end; $$;

create or replace function public.mark_item_bought(item_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.items set bought_at = now() where id = item_id and claimed_by = auth.uid() and bought_at is null;
  if not found then raise exception 'Cannot mark as bought.'; end if;
end; $$;

create or replace function public.unmark_item_bought(item_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.items set bought_at = null where id = item_id and claimed_by = auth.uid() and bought_at is not null;
  if not found then raise exception 'Cannot unmark.'; end if;
end; $$;