create table if not exists public.roster_members (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null references public.guild_users(discord_user_id) on update cascade on delete restrict,
  display_name text,
  class_name text,
  combat_role text not null check (combat_role in ('DPS', 'HEAL', 'TANK')),
  weapon_1 text,
  weapon_2 text,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (discord_user_id)
);

create index if not exists roster_members_discord_user_idx
  on public.roster_members (discord_user_id);

create index if not exists roster_members_active_role_idx
  on public.roster_members (is_active, combat_role);

alter table public.roster_members enable row level security;

revoke all on table public.roster_members from anon, authenticated;
grant all on table public.roster_members to service_role;

comment on table public.roster_members is 'Empty guild roster template; members are created by the server-side service role.';
comment on column public.roster_members.discord_user_id is 'Discord user ID linked to the guild user record.';
comment on column public.roster_members.combat_role is 'Combat role: DPS, HEAL, or TANK.';

-- The verified current table has no user-facing policies or table-specific triggers.
-- Runtime writes use the server-side service role, matching the existing application architecture.