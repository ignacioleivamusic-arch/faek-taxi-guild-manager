alter table public.guild_users drop constraint if exists guild_users_role_check;
alter table public.guild_users add constraint guild_users_role_check check (role in ('pending', 'member', 'staff', 'admin'));
comment on column public.guild_users.role is 'Guild role: pending, member, staff, or admin.';