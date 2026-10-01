create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  is_current boolean not null default false,
  created_by text not null references public.guild_users(discord_user_id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists boards_one_current_idx on public.boards (is_current) where is_current;

create table if not exists public.board_parties (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_parties_board_order_idx on public.board_parties (board_id, sort_order, created_at);

create table if not exists public.board_party_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  party_id uuid not null references public.board_parties(id) on delete cascade,
  roster_member_id uuid not null references public.roster_members(id) on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (board_id, roster_member_id)
);

create index if not exists board_party_members_party_order_idx on public.board_party_members (party_id, sort_order, created_at);

create or replace function public.validate_board_party_member()
returns trigger language plpgsql as $$
declare party_board_id uuid; member_count integer;
begin
  select board_id into party_board_id from public.board_parties where id = new.party_id;
  if party_board_id is null or party_board_id <> new.board_id then raise exception 'Party does not belong to board'; end if;
  select count(*) into member_count from public.board_party_members where party_id = new.party_id and id <> coalesce(new.id, gen_random_uuid());
  if member_count >= 6 then raise exception 'A party cannot contain more than 6 members'; end if;
  return new;
end;
$$;

drop trigger if exists board_party_member_limit on public.board_party_members;
create trigger board_party_member_limit before insert or update on public.board_party_members for each row execute function public.validate_board_party_member();

alter table public.boards enable row level security;
alter table public.board_parties enable row level security;
alter table public.board_party_members enable row level security;
revoke all on public.boards, public.board_parties, public.board_party_members from anon, authenticated;
grant all on public.boards, public.board_parties, public.board_party_members to service_role;

comment on table public.boards is 'Guild planning boards; roster remains the source of player details.';
comment on table public.board_party_members is 'Board assignments with one assignment per roster member per board and a six-member party limit.';

create or replace function public.set_board_current(board_id_to_set uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.boards set is_current = false, updated_at = now() where is_current;
  update public.boards set is_current = true, updated_at = now() where id = board_id_to_set;
end;
$$;
revoke all on function public.set_board_current(uuid) from public, anon, authenticated;
grant execute on function public.set_board_current(uuid) to service_role;

create or replace function public.validate_party_board()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.boards where id = new.board_id) then raise exception 'Board does not exist'; end if;
  return new;
end;
$$;
revoke all on function public.validate_party_board() from public, anon, authenticated;

update public.boards set is_current = false where is_current and id not in (select min(id::text)::uuid from public.boards where is_current);

-- Keep assignment rows aligned if a party is moved; application never exposes this mutation.
create or replace function public.validate_board_party_member_board()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.board_parties where id = new.party_id and board_id = new.board_id) then raise exception 'Party does not belong to board'; end if;
  return new;
end;
$$;

drop trigger if exists board_party_member_board_match on public.board_party_members;
create trigger board_party_member_board_match before insert or update on public.board_party_members for each row execute function public.validate_board_party_member_board();
revoke all on function public.validate_board_party_member_board() from public, anon, authenticated;
revoke all on function public.validate_board_party_member() from public, anon, authenticated;
revoke all on function public.validate_party_board() from public, anon, authenticated;