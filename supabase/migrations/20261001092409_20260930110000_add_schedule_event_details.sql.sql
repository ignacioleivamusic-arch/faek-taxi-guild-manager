alter table public.schedules
  add column event_type text not null default 'OTRO',
  add column vs_guild text,
  add column stone_boss text;

alter table public.schedules
  add constraint schedules_event_type_check
  check (event_type in ('WARGAME', 'BOONSTONE', 'RIFTSTONE', 'OTRO'));