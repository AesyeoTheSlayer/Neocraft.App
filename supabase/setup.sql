-- ZephyrCraft community account, forum, and issue-tracker setup.
-- Run this entire file once in the Supabase SQL Editor.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default 'Member' check (char_length(trim(display_name)) between 2 and 40),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create or replace function private.handle_new_neocraft_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when char_length(trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''))) between 2 and 40
        then trim(new.raw_user_meta_data ->> 'display_name')
      else 'Member'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_neocraft_user_created on auth.users;
create trigger on_neocraft_user_created
after insert on auth.users
for each row execute procedure private.handle_new_neocraft_user();

-- Community roles. Change a trusted account to "moderator" or "admin"
-- in the profiles table when moderation access is needed.
alter table public.profiles
add column if not exists role text not null default 'member';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
    add constraint profiles_role_check check (role in ('member', 'moderator', 'admin'));
  end if;
end $$;

create or replace function private.is_neocraft_moderator()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('moderator', 'admin')
  );
$$;

create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null check (char_length(title) between 2 and 60),
  description text not null check (char_length(description) between 2 and 300),
  accent text not null default 'green' check (accent in ('green', 'gold', 'aqua', 'amethyst')),
  locked boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete restrict,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  title text not null check (char_length(title) between 4 and 140),
  body text not null check (char_length(body) between 10 and 12000),
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  body text not null check (char_length(body) between 2 and 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  issue_number bigint generated always as identity unique,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_email text not null,
  type text not null check (type in ('game_bug', 'performance', 'compatibility', 'save_data', 'account', 'website', 'security', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null check (char_length(title) between 5 and 160),
  build text,
  browser text,
  operating_system text,
  device text,
  summary text not null check (char_length(summary) between 20 and 8000),
  steps text,
  expected text,
  actual text,
  evidence_url text,
  contact_permission boolean not null default false,
  status text not null default 'new' check (status in ('new', 'triaged', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_threads_category_activity_idx on public.forum_threads(category_id, updated_at desc);
create index if not exists forum_posts_thread_created_idx on public.forum_posts(thread_id, created_at);
create index if not exists issues_reporter_created_idx on public.issues(reporter_id, created_at desc);
create index if not exists issues_status_created_idx on public.issues(status, created_at desc);

create or replace function private.set_neocraft_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_forum_thread_updated_at on public.forum_threads;
create trigger set_forum_thread_updated_at before update on public.forum_threads
for each row execute procedure private.set_neocraft_updated_at();

drop trigger if exists set_forum_post_updated_at on public.forum_posts;
create trigger set_forum_post_updated_at before update on public.forum_posts
for each row execute procedure private.set_neocraft_updated_at();

drop trigger if exists set_issue_updated_at on public.issues;
create trigger set_issue_updated_at before update on public.issues
for each row execute procedure private.set_neocraft_updated_at();

create or replace function private.set_neocraft_forum_author()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  profile_name text;
begin
  select display_name into profile_name
  from public.profiles
  where id = (select auth.uid());

  if profile_name is null then
    raise exception 'A ZephyrCraft profile is required to post.';
  end if;

  new.author_id := (select auth.uid());
  new.author_name := profile_name;
  return new;
end;
$$;

create or replace function private.set_neocraft_issue_reporter()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  profile_email text;
begin
  select email into profile_email
  from public.profiles
  where id = (select auth.uid());

  if profile_email is null then
    raise exception 'A ZephyrCraft profile is required to submit an issue.';
  end if;

  new.reporter_id := (select auth.uid());
  new.reporter_email := profile_email;
  return new;
end;
$$;

create or replace function private.protect_neocraft_thread_fields()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.author_id := old.author_id;
  new.author_name := old.author_name;
  if not private.is_neocraft_moderator() then
    new.is_pinned := old.is_pinned;
    new.is_locked := old.is_locked;
  end if;
  return new;
end;
$$;

create or replace function private.protect_neocraft_post_fields()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.author_id := old.author_id;
  new.author_name := old.author_name;
  new.thread_id := old.thread_id;
  return new;
end;
$$;

drop trigger if exists set_neocraft_thread_author on public.forum_threads;
create trigger set_neocraft_thread_author
before insert on public.forum_threads
for each row execute procedure private.set_neocraft_forum_author();

drop trigger if exists protect_neocraft_thread_fields on public.forum_threads;
create trigger protect_neocraft_thread_fields
before update on public.forum_threads
for each row execute procedure private.protect_neocraft_thread_fields();

drop trigger if exists set_neocraft_post_author on public.forum_posts;
create trigger set_neocraft_post_author
before insert on public.forum_posts
for each row execute procedure private.set_neocraft_forum_author();

drop trigger if exists set_neocraft_issue_reporter on public.issues;
create trigger set_neocraft_issue_reporter
before insert on public.issues
for each row execute procedure private.set_neocraft_issue_reporter();

drop trigger if exists protect_neocraft_post_fields on public.forum_posts;
create trigger protect_neocraft_post_fields
before update on public.forum_posts
for each row execute procedure private.protect_neocraft_post_fields();

create or replace function private.touch_neocraft_thread()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.forum_threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists touch_thread_after_reply on public.forum_posts;
create trigger touch_thread_after_reply
after insert on public.forum_posts
for each row execute procedure private.touch_neocraft_thread();

alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.issues enable row level security;

drop policy if exists "Anyone can read forum categories" on public.forum_categories;
create policy "Anyone can read forum categories" on public.forum_categories
for select to anon, authenticated using (true);

drop policy if exists "Anyone can read forum threads" on public.forum_threads;
create policy "Anyone can read forum threads" on public.forum_threads
for select to anon, authenticated using (true);

drop policy if exists "Members can create forum threads" on public.forum_threads;
create policy "Members can create forum threads" on public.forum_threads
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and not exists (select 1 from public.forum_categories where id = category_id and locked)
);

drop policy if exists "Authors and moderators can update forum threads" on public.forum_threads;
create policy "Authors and moderators can update forum threads" on public.forum_threads
for update to authenticated
using (author_id = (select auth.uid()) or (select private.is_neocraft_moderator()))
with check (author_id = (select auth.uid()) or (select private.is_neocraft_moderator()));

drop policy if exists "Authors and moderators can delete forum threads" on public.forum_threads;
create policy "Authors and moderators can delete forum threads" on public.forum_threads
for delete to authenticated
using (author_id = (select auth.uid()) or (select private.is_neocraft_moderator()));

drop policy if exists "Anyone can read forum replies" on public.forum_posts;
create policy "Anyone can read forum replies" on public.forum_posts
for select to anon, authenticated using (true);

drop policy if exists "Members can create forum replies" on public.forum_posts;
create policy "Members can create forum replies" on public.forum_posts
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and not exists (select 1 from public.forum_threads where id = thread_id and is_locked)
);

drop policy if exists "Authors and moderators can update forum replies" on public.forum_posts;
create policy "Authors and moderators can update forum replies" on public.forum_posts
for update to authenticated
using (author_id = (select auth.uid()) or (select private.is_neocraft_moderator()))
with check (author_id = (select auth.uid()) or (select private.is_neocraft_moderator()));

drop policy if exists "Authors and moderators can delete forum replies" on public.forum_posts;
create policy "Authors and moderators can delete forum replies" on public.forum_posts
for delete to authenticated
using (author_id = (select auth.uid()) or (select private.is_neocraft_moderator()));

drop policy if exists "Members can submit issues" on public.issues;
create policy "Members can submit issues" on public.issues
for insert to authenticated
with check (reporter_id = (select auth.uid()));

drop policy if exists "Members can read their own issues" on public.issues;
create policy "Members can read their own issues" on public.issues
for select to authenticated
using (reporter_id = (select auth.uid()) or (select private.is_neocraft_moderator()));

drop policy if exists "Moderators can update issues" on public.issues;
create policy "Moderators can update issues" on public.issues
for update to authenticated
using ((select private.is_neocraft_moderator()))
with check ((select private.is_neocraft_moderator()));

insert into public.forum_categories (slug, title, description, accent, locked, sort_order)
values
  ('announcements', 'Announcements', 'Official ZephyrCraft development, testing, and service announcements.', 'gold', true, 1),
  ('general', 'General discussion', 'Talk about ZephyrCraft, historical versions, browser gameplay, and the project.', 'green', false, 2),
  ('alpha-testing', 'Alpha testing', 'Share testing results, compare behavior, and discuss the current Alpha build.', 'aqua', false, 3),
  ('support', 'Help and support', 'Ask for help with setup, local resources, browsers, worlds, and accounts.', 'amethyst', false, 4)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  accent = excluded.accent,
  locked = excluded.locked,
  sort_order = excluded.sort_order;

-- Privileged helpers stay outside the exposed API schema. Only the role check
-- is callable by signed-in API users, and only from policies.
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_neocraft_moderator() to authenticated;

-- Remove legacy exposed helpers if an earlier draft of this setup was run.
drop function if exists public.handle_new_neocraft_user();
drop function if exists public.is_neocraft_moderator();
drop function if exists public.set_neocraft_updated_at();
drop function if exists public.set_neocraft_forum_author();
drop function if exists public.set_neocraft_issue_reporter();
drop function if exists public.protect_neocraft_thread_fields();
drop function if exists public.protect_neocraft_post_fields();
drop function if exists public.touch_neocraft_thread();
