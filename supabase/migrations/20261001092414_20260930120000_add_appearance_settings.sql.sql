alter table public.guild_settings
  add column if not exists logo_path text,
  add column if not exists background_path text;

comment on column public.guild_settings.logo_path is 'Private object path in profile-photos used as the guild logo.';
comment on column public.guild_settings.background_path is 'Private object path in profile-photos used as the global application background.';