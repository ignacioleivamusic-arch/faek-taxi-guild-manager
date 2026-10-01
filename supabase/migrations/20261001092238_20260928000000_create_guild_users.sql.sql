create table if not exists public.guild_users (
  discord_user_id text primary key,
  username text not null,
  email text,
  role text not null default 'pending' check (role in ('pending', 'member', 'officer', 'admin')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guild_users_role_idx
  on public.guild_users (role);

alter table public.guild_users enable row level security;

revoke all on table public.guild_users from anon, authenticated;

grant all on table public.guild_users to service_role;

comment on table public.guild_users is 'Discord guild roster and approval roles managed by the server-side service role.';
comment on column public.guild_users.discord_user_id is 'Discord user snowflake represented as text to preserve its full identifier.';
comment on column public.guild_users.role is 'Roster role: pending, member, officer, or admin.';
comment on column public.guild_users.approved_by is 'Discord user ID of the admin who approved the current non-pending role.';
comment on column public.guild_users.updated_at is 'Last timestamp written by a roster update.';