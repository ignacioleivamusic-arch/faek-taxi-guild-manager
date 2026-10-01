-- Clean Attendance contract. Existing Attendance rows are preserved; only obsolete
-- Attendance-only columns/table are removed.

alter table public.attendance_events
  add column if not exists duration_minutes integer;

update public.attendance_events
set duration_minutes = greatest(1, round(extract(epoch from (expires_at - opened_at)) / 60)::integer)
where duration_minutes is null and opened_at is not null and expires_at is not null;

update public.attendance_events
set duration_minutes = 15
where duration_minutes is null;

alter table public.attendance_events
  alter column duration_minutes set not null,
  alter column duration_minutes set default 15;

alter table public.attendance_events drop constraint if exists attendance_events_duration_minutes_check;
alter table public.attendance_events
  add constraint attendance_events_duration_minutes_check check (duration_minutes between 1 and 1440);

alter table public.attendance_events drop constraint if exists attendance_events_board_id_fkey;
alter table public.attendance_events drop column if exists board_id;

alter table public.attendance_records drop constraint if exists attendance_records_event_roster_member_key;
alter table public.attendance_records drop constraint if exists attendance_records_event_user_key;
alter table public.attendance_records
  add constraint attendance_records_event_user_key unique (attendance_event_id, discord_user_id);

alter table public.attendance_records rename column registered_at to created_at;

create index if not exists attendance_events_active_expiration_idx
  on public.attendance_events (status, expires_at);

create index if not exists attendance_records_event_created_idx
  on public.attendance_records (attendance_event_id, created_at desc);

drop table if exists public.attendance_event_participants;

comment on column public.attendance_events.duration_minutes is 'Configured duration from activation, in minutes.';
comment on table public.attendance_records is 'One Discord user attendance record per event.';
