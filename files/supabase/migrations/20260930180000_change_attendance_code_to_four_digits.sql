alter table public.attendance_events drop constraint if exists attendance_events_code_check;

alter table public.attendance_events
  add constraint attendance_events_code_check
  check (code ~ '^[0-9]{4}$') not valid;

comment on column public.attendance_events.code is 'Four numeric attendance digits stored as text for Discord entry.';
