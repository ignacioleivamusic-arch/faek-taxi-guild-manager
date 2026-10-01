alter table public.roster_members
  add column if not exists gear_score integer,
  add column if not exists build_type text;

alter table public.roster_members
  drop constraint if exists roster_members_gear_score_check,
  drop constraint if exists roster_members_build_type_check;

alter table public.roster_members
  add constraint roster_members_gear_score_check check (gear_score is null or gear_score between 0 and 10000),
  add constraint roster_members_build_type_check check (build_type is null or build_type in ('PvP', 'PvE', 'Hybrid'));

create index if not exists roster_members_profile_lookup_idx
  on public.roster_members (discord_user_id, is_active);

comment on column public.roster_members.gear_score is 'Optional player gear score used by the profile and roster views.';
comment on column public.roster_members.build_type is 'Optional build focus: PvP, PvE, or Hybrid.';