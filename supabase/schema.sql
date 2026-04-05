create extension if not exists pgcrypto;

create table if not exists public.mods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wrestler_name text not null,
  game_version text not null default '1.00',
  source_game text not null default 'WWE 2K25',
  mod_type text not null default 'original' check (mod_type in ('original', 'port', 'remake', 'update')),
  is_missing_target boolean not null default false,
  target_attire_count integer not null default 1 check (target_attire_count >= 0),
  notes text not null default '',
  tags text[] not null default '{}',
  moveset_json jsonb,
  profile_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mods add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.mods add column if not exists wrestler_name text;
alter table public.mods add column if not exists game_version text not null default '1.00';
alter table public.mods add column if not exists source_game text not null default 'WWE 2K25';
alter table public.mods add column if not exists mod_type text not null default 'original';
alter table public.mods add column if not exists is_missing_target boolean not null default false;
alter table public.mods add column if not exists target_attire_count integer not null default 1;
alter table public.mods add column if not exists notes text not null default '';
alter table public.mods add column if not exists tags text[] not null default '{}';
alter table public.mods add column if not exists moveset_json jsonb;
alter table public.mods add column if not exists profile_json jsonb;
alter table public.mods add column if not exists created_at timestamptz not null default now();
alter table public.mods add column if not exists updated_at timestamptz not null default now();

alter table public.mods drop column if exists mod_creator_name;
alter table public.mods drop column if exists image_urls;
alter table public.mods drop column if exists download_links;
alter table public.mods drop column if exists hype_profile_json;
alter table public.mods drop column if exists dc_profile_json;

create table if not exists public.attires (
  id text primary key,
  mod_id uuid not null references public.mods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slot_name text not null default '',
  era text not null default '',
  creator_name text not null default '',
  download_url text not null default '',
  preview_image_path text not null default '',
  preview_image_name text not null default '',
  render_dds_path text not null default '',
  render_dds_name text not null default '',
  notes text not null default '',
  status text not null default 'complete' check (status in ('complete', 'partial', 'needs_work', 'missing')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.attires add column if not exists mod_id uuid references public.mods(id) on delete cascade;
alter table public.attires add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.attires add column if not exists name text;
alter table public.attires add column if not exists slot_name text not null default '';
alter table public.attires add column if not exists era text not null default '';
alter table public.attires add column if not exists creator_name text not null default '';
alter table public.attires add column if not exists download_url text not null default '';
alter table public.attires add column if not exists preview_image_path text not null default '';
alter table public.attires add column if not exists preview_image_name text not null default '';
alter table public.attires add column if not exists render_dds_path text not null default '';
alter table public.attires add column if not exists render_dds_name text not null default '';
alter table public.attires add column if not exists notes text not null default '';
alter table public.attires add column if not exists status text not null default 'complete';
alter table public.attires add column if not exists sort_order integer not null default 0;
alter table public.attires add column if not exists created_at timestamptz not null default now();
alter table public.attires add column if not exists updated_at timestamptz not null default now();

alter table public.attires drop column if exists image_url;
alter table public.attires drop column if exists download_url_old;

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

create trigger trg_mods_updated_at before update on public.mods for each row execute function public.set_updated_at();
create trigger trg_attires_updated_at before update on public.attires for each row execute function public.set_updated_at();
create trigger trg_mods_user_id before insert on public.mods for each row execute function public.handle_mod_user_id();
create trigger trg_attires_user_id before insert on public.attires for each row execute function public.handle_attire_user_id();

alter table public.mods enable row level security;
alter table public.attires enable row level security;

drop policy if exists "Users can view their own mods" on public.mods;
drop policy if exists "Users can insert their own mods" on public.mods;
drop policy if exists "Users can update their own mods" on public.mods;
drop policy if exists "Users can delete their own mods" on public.mods;

drop policy if exists "Users can view their own attires" on public.attires;
drop policy if exists "Users can insert their own attires" on public.attires;
drop policy if exists "Users can update their own attires" on public.attires;
drop policy if exists "Users can delete their own attires" on public.attires;

create policy "Users can view their own mods" on public.mods for select using (auth.uid() = user_id);
create policy "Users can insert their own mods" on public.mods for insert with check (auth.uid() = user_id);
create policy "Users can update their own mods" on public.mods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own mods" on public.mods for delete using (auth.uid() = user_id);

create policy "Users can view their own attires" on public.attires for select using (auth.uid() = user_id);
create policy "Users can insert their own attires" on public.attires for insert with check (auth.uid() = user_id);
create policy "Users can update their own attires" on public.attires for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own attires" on public.attires for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('mod-assets', 'mod-assets', false)
on conflict (id) do nothing;

drop policy if exists "Users can view their own mod assets" on storage.objects;
drop policy if exists "Users can upload their own mod assets" on storage.objects;
drop policy if exists "Users can update their own mod assets" on storage.objects;
drop policy if exists "Users can delete their own mod assets" on storage.objects;

create policy "Users can view their own mod assets"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mod-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can upload their own mod assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mod-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own mod assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mod-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'mod-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own mod assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mod-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
