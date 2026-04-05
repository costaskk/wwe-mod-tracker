drop table if exists public.user_installed_attires cascade;
drop table if exists public.mod_requests cascade;
drop table if exists public.attire_images cascade;
drop table if exists public.attires cascade;
drop table if exists public.creators cascade;
drop table if exists public.wrestlers cascade;

create extension if not exists pgcrypto;

create table if not exists public.wrestlers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  wrestler_name text not null,
  target_attire_count integer not null default 1 check (target_attire_count >= 0),
  is_missing_target boolean not null default false,
  notes text not null default '',
  tags text[] not null default '{}',
  moveset_json jsonb,
  profile_json jsonb,
  headshot_path text not null default '',
  headshot_name text not null default '',
  headshot_external_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists wrestlers_name_unique_idx on public.wrestlers (lower(wrestler_name));

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.attires (
  id uuid primary key default gen_random_uuid(),
  wrestler_id uuid not null references public.wrestlers(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  era text not null default '',
  creator_name text not null default '',
  download_url text not null default '',
  source_game text not null default 'WWE 2K25',
  mod_type text not null default 'original' check (mod_type in ('original','port','remake','update')),
  render_dds_path text not null default '',
  render_dds_name text not null default '',
  notes text not null default '',
  status text not null default 'complete' check (status in ('complete','partial','needs_work','missing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attire_images (
  id uuid primary key default gen_random_uuid(),
  attire_id uuid not null references public.attires(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  image_path text not null,
  image_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.user_installed_attires (
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  attire_id uuid not null references public.attires(id) on delete cascade,
  installed_at timestamptz not null default now(),
  primary key (user_id, attire_id)
);

create table if not exists public.mod_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  wrestler_id uuid not null references public.wrestlers(id) on delete cascade,
  attire_id uuid references public.attires(id) on delete cascade,
  request_type text not null check (request_type in ('missing_link', 'dead_link', 'general_request')),
  status text not null default 'open' check (status in ('open', 'fulfilled', 'closed')),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists attires_wrestler_idx on public.attires (wrestler_id);
create index if not exists attire_images_attire_idx on public.attire_images (attire_id);
create index if not exists requests_wrestler_idx on public.mod_requests (wrestler_id);
create index if not exists requests_attire_idx on public.mod_requests (attire_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wrestlers_updated_at on public.wrestlers;
drop trigger if exists trg_attires_updated_at on public.attires;

create trigger trg_wrestlers_updated_at
before update on public.wrestlers
for each row
execute function public.set_updated_at();

create trigger trg_attires_updated_at
before update on public.attires
for each row
execute function public.set_updated_at();

alter table public.wrestlers enable row level security;
alter table public.creators enable row level security;
alter table public.attires enable row level security;
alter table public.attire_images enable row level security;
alter table public.user_installed_attires enable row level security;
alter table public.mod_requests enable row level security;

drop policy if exists "Public can read wrestlers" on public.wrestlers;
drop policy if exists "Authenticated can create wrestlers" on public.wrestlers;
drop policy if exists "Owners can update wrestlers" on public.wrestlers;
drop policy if exists "Owners can delete wrestlers" on public.wrestlers;

create policy "Public can read wrestlers" on public.wrestlers for select using (true);
create policy "Authenticated can create wrestlers" on public.wrestlers for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update wrestlers" on public.wrestlers for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owners can delete wrestlers" on public.wrestlers for delete to authenticated using (auth.uid() = owner_id);

drop policy if exists "Public can read creators" on public.creators;
drop policy if exists "Authenticated can create creators" on public.creators;
create policy "Public can read creators" on public.creators for select using (true);
create policy "Authenticated can create creators" on public.creators for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Public can read attires" on public.attires;
drop policy if exists "Authenticated can create attires" on public.attires;
drop policy if exists "Owners can update attires" on public.attires;
drop policy if exists "Owners can delete attires" on public.attires;

create policy "Public can read attires" on public.attires for select using (true);
create policy "Authenticated can create attires" on public.attires for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can update attires" on public.attires for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Owners can delete attires" on public.attires for delete to authenticated using (auth.uid() = owner_id);

drop policy if exists "Public can read attire images" on public.attire_images;
drop policy if exists "Authenticated can create attire images" on public.attire_images;
drop policy if exists "Owners can delete attire images" on public.attire_images;
create policy "Public can read attire images" on public.attire_images for select using (true);
create policy "Authenticated can create attire images" on public.attire_images for insert to authenticated with check (auth.uid() = owner_id);
create policy "Owners can delete attire images" on public.attire_images for delete to authenticated using (auth.uid() = owner_id);

drop policy if exists "Users can read own installs" on public.user_installed_attires;
drop policy if exists "Users can manage own installs" on public.user_installed_attires;
create policy "Users can read own installs" on public.user_installed_attires for select to authenticated using (auth.uid() = user_id);
create policy "Users can manage own installs" on public.user_installed_attires for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Public can read requests" on public.mod_requests;
drop policy if exists "Users can create own requests" on public.mod_requests;
drop policy if exists "Users can edit own requests" on public.mod_requests;
drop policy if exists "Users can delete own requests" on public.mod_requests;
create policy "Public can read requests" on public.mod_requests for select using (true);
create policy "Users can create own requests" on public.mod_requests for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can edit own requests" on public.mod_requests for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own requests" on public.mod_requests for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('mod-assets', 'mod-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read mod assets" on storage.objects;
drop policy if exists "Users can upload own mod assets" on storage.objects;
drop policy if exists "Users can update own mod assets" on storage.objects;
drop policy if exists "Users can delete own mod assets" on storage.objects;

create policy "Public can read mod assets" on storage.objects for select using (bucket_id = 'mod-assets');
create policy "Users can upload own mod assets" on storage.objects for insert to authenticated with check (
  bucket_id = 'mod-assets' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can update own mod assets" on storage.objects for update to authenticated using (
  bucket_id = 'mod-assets' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'mod-assets' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users can delete own mod assets" on storage.objects for delete to authenticated using (
  bucket_id = 'mod-assets' and auth.uid()::text = (storage.foldername(name))[1]
);
