alter table public.guild_settings
  add column if not exists banner_path text;

comment on column public.guild_settings.banner_path is 'Private object path in profile-photos used as the authenticated global banner.';
