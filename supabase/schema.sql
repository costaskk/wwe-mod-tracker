create extension if not exists pgcrypto;

create table if not exists public.mods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wrestler_name text not null,
  mod_creator_name text not null default '',
  game_version text not null default '1.00',
  source_game text not null default 'WWE 2K25',
  mod_type text not null default 'original' check (mod_type in ('original', 'port', 'remake', 'update')),
  is_missing_target boolean not null default false,
  target_attire_count integer not null default 1 check (target_attire_count >= 0),
  notes text not null default '',
  tags text[] not null default '{}',
  image_urls text[] not null default '{}',
  download_links text[] not null default '{}',
  moveset_json jsonb,
  hype_profile_json jsonb,
  dc_profile_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attires (
  id text primary key,
  mod_id uuid not null references public.mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slot_name text not null default '',
  era text not null default '',
  creator_name text not null default '',
  image_url text not null default '',
  download_url text not null default '',
  notes text not null default '',
  status text not null default 'complete' check (status in ('complete', 'partial', 'needs_work', 'missing')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mods_user_id_idx on public.mods(user_id);
create index if not exists attires_mod_id_idx on public.attires(mod_id);
create index if not exists attires_user_id_idx on public.attires(user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_mod_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.handle_attire_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_mods_updated_at on public.mods;
drop trigger if exists trg_attires_updated_at on public.attires;
drop trigger if exists trg_mods_user_id on public.mods;
drop trigger if exists trg_attires_user_id on public.attires;

create trigger trg_mods_updated_at
before update on public.mods
for each row
execute function public.set_updated_at();

create trigger trg_attires_updated_at
before update on public.attires
for each row
execute function public.set_updated_at();

create trigger trg_mods_user_id
before insert on public.mods
for each row
execute function public.handle_mod_user_id();

create trigger trg_attires_user_id
before insert on public.attires
for each row
execute function public.handle_attire_user_id();

alter table public.mods enable row level security;
alter table public.attires enable row level security;

create policy "Users can view their own mods"
on public.mods
for select
using (auth.uid() = user_id);

create policy "Users can insert their own mods"
on public.mods
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own mods"
on public.mods
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own mods"
on public.mods
for delete
using (auth.uid() = user_id);

create policy "Users can view their own attires"
on public.attires
for select
using (auth.uid() = user_id);

create policy "Users can insert their own attires"
on public.attires
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own attires"
on public.attires
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own attires"
on public.attires
for delete
using (auth.uid() = user_id);
