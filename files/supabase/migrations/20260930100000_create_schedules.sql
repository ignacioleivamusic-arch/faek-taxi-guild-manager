create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text,
  event_date date not null,
  start_time time not null,
  end_time time,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_by text not null references public.guild_users(discord_user_id) on update cascade on delete restrict,
  discord_channel_id text,
  discord_message_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedules_end_after_start check (end_time is null or end_time > start_time)
);

create index if not exists schedules_status_date_idx on public.schedules (status, event_date, start_time);
create index if not exists schedules_created_by_idx on public.schedules (created_by);

alter table public.schedules enable row level security;
revoke all on table public.schedules from anon, authenticated;
grant all on table public.schedules to service_role;

comment on table public.schedules is 'Guild schedule entries published to Inicio and Discord.';
