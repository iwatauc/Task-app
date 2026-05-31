-- AI下絵工房 Supabase schema
-- Supabase SQL Editor でそのまま実行できます。

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  parent_image_id uuid references public.images(id) on delete set null,
  title text,
  image_url text not null,
  thumbnail_url text,
  source_type text not null check (source_type in ('generated', 'uploaded', 'edited')),
  prompt_ja text,
  prompt_en text,
  purpose text,
  output_type text,
  style_preset text,
  tags text[] not null default '{}',
  favorite boolean not null default false,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.edit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete cascade,
  paint_overlay_url text,
  mask_url text not null,
  instruction text not null,
  instruction_en text,
  result_image_id uuid references public.images(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.prompt_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  prompt_ja text not null,
  prompt_en text,
  negative_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();

drop trigger if exists set_images_updated_at on public.images;
create trigger set_images_updated_at before update on public.images for each row execute function public.set_updated_at();

drop trigger if exists set_prompt_presets_updated_at on public.prompt_presets;
create trigger set_prompt_presets_updated_at before update on public.prompt_presets for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.images enable row level security;
alter table public.edit_requests enable row level security;
alter table public.prompt_presets enable row level security;

drop policy if exists "projects are owned by user" on public.projects;
create policy "projects are owned by user" on public.projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "images are owned by user" on public.images;
create policy "images are owned by user" on public.images for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "edit requests are owned by user" on public.edit_requests;
create policy "edit requests are owned by user" on public.edit_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "prompt presets are owned by user" on public.prompt_presets;
create policy "prompt presets are owned by user" on public.prompt_presets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('images', 'images', true), ('overlays', 'overlays', true), ('masks', 'masks', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "authenticated users can read own image objects" on storage.objects;
create policy "authenticated users can read own image objects" on storage.objects for select using (
  bucket_id in ('images', 'overlays', 'masks') and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated users can upload own image objects" on storage.objects;
create policy "authenticated users can upload own image objects" on storage.objects for insert with check (
  bucket_id in ('images', 'overlays', 'masks') and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated users can update own image objects" on storage.objects;
create policy "authenticated users can update own image objects" on storage.objects for update using (
  bucket_id in ('images', 'overlays', 'masks') and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id in ('images', 'overlays', 'masks') and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "authenticated users can delete own image objects" on storage.objects;
create policy "authenticated users can delete own image objects" on storage.objects for delete using (
  bucket_id in ('images', 'overlays', 'masks') and auth.uid()::text = (storage.foldername(name))[1]
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists images_user_created_idx on public.images(user_id, created_at desc);
create index if not exists images_project_idx on public.images(project_id);
create index if not exists images_parent_idx on public.images(parent_image_id);
create index if not exists images_tags_idx on public.images using gin(tags);
create index if not exists edit_requests_image_idx on public.edit_requests(image_id);
create index if not exists prompt_presets_user_idx on public.prompt_presets(user_id);
