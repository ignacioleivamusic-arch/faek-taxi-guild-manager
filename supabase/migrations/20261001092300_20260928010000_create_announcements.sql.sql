create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_discord_user_id text not null references public.guild_users(discord_user_id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists announcements_created_at_idx
  on public.announcements (created_at desc);

create index if not exists announcements_author_idx
  on public.announcements (author_discord_user_id);

alter table public.announcements enable row level security;
revoke all on table public.announcements from anon, authenticated;
grant all on table public.announcements to service_role;

comment on table public.announcements is 'Guild announcements managed server-side by staff and administrators.';
comment on column public.announcements.author_discord_user_id is 'Discord user ID of the staff member or administrator who published the announcement.';