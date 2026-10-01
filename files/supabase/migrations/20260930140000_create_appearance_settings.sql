create table if not exists public.appearance_settings (
  id boolean primary key default true check (id),
  banner_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appearance_settings enable row level security;
revoke all on table public.appearance_settings from anon, authenticated;
grant all on table public.appearance_settings to service_role;

create or replace function public.set_appearance_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_appearance_settings_updated_at() from public, anon, authenticated;
grant execute on function public.set_appearance_settings_updated_at() to service_role;

drop trigger if exists appearance_settings_set_updated_at on public.appearance_settings;
create trigger appearance_settings_set_updated_at
before update on public.appearance_settings
for each row execute function public.set_appearance_settings_updated_at();

comment on table public.appearance_settings is 'Singleton appearance configuration. Stores private Storage object paths only.';
comment on column public.appearance_settings.banner_path is 'Private object path in profile-photos; never a signed URL.';

drop table if exists public.guild_settings;
drop function if exists public.set_guild_settings_updated_at();

-- The legacy guild_settings table is removed only after active runtime references
-- to its identity fields have been eliminated.
