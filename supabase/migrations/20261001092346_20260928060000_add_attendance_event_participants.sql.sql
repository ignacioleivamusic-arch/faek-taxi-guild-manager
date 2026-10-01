create table if not exists public.attendance_event_participants (
  id uuid primary key default gen_random_uuid(),
  attendance_event_id uuid not null references public.attendance_events(id) on delete cascade,
  roster_member_id uuid not null references public.roster_members(id) on delete restrict,
  board_party_id uuid references public.board_parties(id) on delete set null,
  party_name text,
  player_name text not null,
  discord_user_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (attendance_event_id, roster_member_id)
);
create index if not exists attendance_event_participants_event_idx on public.attendance_event_participants (attendance_event_id, sort_order);
create index if not exists attendance_event_participants_roster_idx on public.attendance_event_participants (roster_member_id, attendance_event_id);
alter table public.attendance_event_participants enable row level security;
revoke all on public.attendance_event_participants from anon, authenticated;
grant all on public.attendance_event_participants to service_role;