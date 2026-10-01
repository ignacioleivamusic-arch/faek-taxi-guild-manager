create table if not exists public.guild_settings (
  id boolean primary key default true check (id),
  guild_name text not null check (char_length(btrim(guild_name)) between 1 and 100),
  guild_tag text check (guild_tag is null or char_length(btrim(guild_tag)) between 1 and 32),
  discord_server_id text not null check (discord_server_id ~ '^[0-9]{17,20}$'),
  attendance_channel_id text not null check (attendance_channel_id ~ '^[0-9]{17,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guild_settings enable row level security;
revoke all on table public.guild_settings from anon, authenticated;
grant all on table public.guild_settings to service_role;

comment on table public.guild_settings is 'Single installation-level guild configuration. Contains no secrets or guild application data.';
comment on column public.guild_settings.id is 'Singleton guard: the only valid row has id=true.';
comment on column public.guild_settings.guild_name is 'User-provided display name for this installation.';
comment on column public.guild_settings.guild_tag is 'Optional user-provided short guild tag.';
comment on column public.guild_settings.discord_server_id is 'Discord server snowflake for this installation.';
comment on column public.guild_settings.attendance_channel_id is 'Discord channel snowflake used by attendance.';

create or replace function public.set_guild_settings_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_guild_settings_updated_at() from public, anon, authenticated;
grant execute on function public.set_guild_settings_updated_at() to service_role;

drop trigger if exists guild_settings_set_updated_at on public.guild_settings;
create trigger guild_settings_set_updated_at
before update on public.guild_settings
for each row execute function public.set_guild_settings_updated_at();

-- Intentionally no seed row: every deployment supplies its own configuration through the approved setup flow.