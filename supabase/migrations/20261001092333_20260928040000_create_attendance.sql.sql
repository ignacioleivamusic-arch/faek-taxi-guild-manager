create table if not exists public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  board_id uuid references public.boards(id) on delete restrict check (char_length(trim(name)) between 1 and 120),
  description text,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  status text not null default 'closed' check (status in ('active', 'closed')),
  created_by text not null references public.guild_users(discord_user_id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz,
  expires_at timestamptz,
  discord_channel_id text,
  discord_message_id text
);

create index if not exists attendance_events_status_created_idx on public.attendance_events (status, created_at desc);
create unique index if not exists attendance_events_discord_message_idx on public.attendance_events (discord_channel_id, discord_message_id) where discord_channel_id is not null and discord_message_id is not null;

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  attendance_event_id uuid not null references public.attendance_events(id) on delete cascade,
  roster_member_id uuid not null references public.roster_members(id) on delete restrict,
  discord_user_id text not null references public.guild_users(discord_user_id) on update cascade on delete restrict,
  registered_at timestamptz not null default now(),
  unique (attendance_event_id, roster_member_id)
);

create index if not exists attendance_records_event_registered_idx on public.attendance_records (attendance_event_id, registered_at desc);
create index if not exists attendance_records_discord_idx on public.attendance_records (discord_user_id);

alter table public.attendance_events enable row level security;
alter table public.attendance_records enable row level security;
revoke all on public.attendance_events, public.attendance_records from anon, authenticated;
grant all on public.attendance_events, public.attendance_records to service_role;

comment on table public.attendance_events is 'Web-managed attendance events; Discord registration endpoint will use this contract later.';
comment on table public.attendance_records is 'One attendance record per roster member and event.';