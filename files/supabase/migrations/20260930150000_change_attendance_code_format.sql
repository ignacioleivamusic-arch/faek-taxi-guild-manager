-- Attendance codes are six uppercase alphanumeric characters. Existing codes are preserved;
-- NOT VALID lets the rule apply to new or updated rows without deleting legacy history.
alter table public.attendance_events drop constraint if exists attendance_events_code_check;
alter table public.attendance_events
  add constraint attendance_events_code_check
  check (code ~ '^[A-Z0-9]{6}$') not valid;

comment on column public.attendance_events.code is 'Six uppercase alphanumeric attendance characters, stored as text for Discord entry.';
