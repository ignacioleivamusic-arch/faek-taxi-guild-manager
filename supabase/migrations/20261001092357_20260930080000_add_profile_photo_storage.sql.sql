alter table public.roster_members
  add column if not exists profile_image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile photos service role access"
on storage.objects
for all
to service_role
using (bucket_id = 'profile-photos')
with check (bucket_id = 'profile-photos');

comment on column public.roster_members.profile_image_url is 'Private profile photo object path in the profile-photos bucket.';