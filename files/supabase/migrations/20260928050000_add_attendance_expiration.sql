alter table public.attendance_events add column if not exists expires_at timestamptz;
comment on column public.attendance_events.expires_at is 'Attendance expiration timestamp; set to opened_at plus exactly 15 minutes.';
create index if not exists attendance_events_expires_idx on public.attendance_events (status, expires_at) where expires_at is not null;
alter table public.attendance_events add column if not exists board_id uuid;
alter table public.attendance_events drop constraint if exists attendance_events_board_id_fkey;
alter table public.attendance_events add constraint attendance_events_board_id_fkey foreign key (board_id) references public.boards(id) on delete restrict;
create index if not exists attendance_events_board_id_idx on public.attendance_events (board_id);
