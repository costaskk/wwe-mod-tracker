
-- Optional cleanup migration
-- Run only if you want to remove unused wrestler target columns from the database.

alter table public.wrestlers
  drop column if exists target_attire_count,
  drop column if exists is_missing_target;
