-- Restore attendance_events.board_id and attendance_event_participants
-- that were removed in migration 20260930170000_rebuild_attendance.sql
-- but are still required by the application code.

-- 1. Restore attendance_events.board_id

alter table public.attendance_events
  add column if not exists board_id uuid;

alter table public.attendance_events
  drop constraint if exists attendance_events_board_id_fkey;

alter table public.attendance_events
  add constraint attendance_events_board_id_fkey
  foreign key (board_id) references public.boards(id) on delete restrict;

create index if not exists attendance_events_board_id_idx
  on public.attendance_events (board_id);

comment on column public.attendance_events.board_id is 'Board associated with this attendance event; required by attendance status and profile statistics.';

-- 2. Restore attendance_event_participants

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

create index if not exists attendance_event_participants_event_idx
  on public.attendance_event_participants (attendance_event_id, sort_order);

create index if not exists attendance_event_participants_roster_idx
  on public.attendance_event_participants (roster_member_id, attendance_event_id);

alter table public.attendance_event_participants enable row level security;

revoke all on table public.attendance_event_participants from anon, authenticated;

grant all on table public.attendance_event_participants to service_role;

comment on table public.attendance_event_participants is 'Attendance event participants snapshot; queried by profile statistics. RLS enabled, service_role only.';
