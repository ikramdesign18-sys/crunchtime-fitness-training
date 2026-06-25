-- Crunchtime Fitness Training Supabase setup.
-- Run this in the Supabase SQL editor after creating the project.
-- The mobile app uses only EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_trainer_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() in ('trainer', 'admin'), false)
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'user' check (role in ('user', 'trainer', 'admin')),
  age int,
  gender text,
  height numeric,
  weight numeric,
  fitness_goal text,
  activity_level text,
  training_types text[],
  profile_setup_completed boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bmi_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  height numeric not null,
  weight numeric not null,
  bmi numeric not null,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_id text,
  workout_title text,
  completed_at timestamptz not null default now(),
  duration_minutes int,
  calories_burned int
);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, trainer_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  attachment_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  session_type text not null,
  session_date date not null,
  session_time text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.video_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  exercise_name text not null,
  video_url text not null,
  note text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'feedback_received')),
  trainer_feedback text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.video_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  channel_name text not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'ended', 'missed')),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_video_submissions_updated_at on public.video_submissions;
create trigger set_video_submissions_updated_at
before update on public.video_submissions
for each row execute function public.set_updated_at();

drop trigger if exists set_video_calls_updated_at on public.video_calls;
create trigger set_video_calls_updated_at
before update on public.video_calls
for each row execute function public.set_updated_at();

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if old.role is distinct from new.role
    and auth.uid() is not null
    and public.current_user_role() is distinct from 'admin' then
    raise exception 'Profile role changes must be made by an admin from Supabase.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.bmi_records enable row level security;
alter table public.workout_progress enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.bookings enable row level security;
alter table public.video_submissions enable row level security;
alter table public.notifications enable row level security;
alter table public.video_calls enable row level security;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (id = auth.uid() and role = 'user');

drop policy if exists "profiles_select_own_or_trainer" on public.profiles;
create policy "profiles_select_own_or_trainer" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "bmi_insert_own" on public.bmi_records;
create policy "bmi_insert_own" on public.bmi_records
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "bmi_select_own_or_trainer" on public.bmi_records;
create policy "bmi_select_own_or_trainer" on public.bmi_records
for select to authenticated
using (user_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "workout_insert_own" on public.workout_progress;
create policy "workout_insert_own" on public.workout_progress
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "workout_select_own_or_trainer" on public.workout_progress;
create policy "workout_select_own_or_trainer" on public.workout_progress
for select to authenticated
using (user_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "threads_select_participants" on public.chat_threads;
create policy "threads_select_participants" on public.chat_threads
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid());

drop policy if exists "threads_insert_participants" on public.chat_threads;
create policy "threads_insert_participants" on public.chat_threads
for insert to authenticated
with check (user_id = auth.uid() or trainer_id = auth.uid());

drop policy if exists "threads_update_participants" on public.chat_threads;
create policy "threads_update_participants" on public.chat_threads
for update to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid())
with check (user_id = auth.uid() or trainer_id = auth.uid());

drop policy if exists "messages_select_participants" on public.chat_messages;
create policy "messages_select_participants" on public.chat_messages
for select to authenticated
using (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (t.user_id = auth.uid() or t.trainer_id = auth.uid())
  )
);

drop policy if exists "messages_insert_participants" on public.chat_messages;
create policy "messages_insert_participants" on public.chat_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (t.user_id = auth.uid() or t.trainer_id = auth.uid())
      and receiver_id in (t.user_id, t.trainer_id)
  )
);

drop policy if exists "bookings_insert_own" on public.bookings;
create policy "bookings_insert_own" on public.bookings
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "bookings_select_own_or_trainer" on public.bookings;
create policy "bookings_select_own_or_trainer" on public.bookings
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "bookings_update_trainer" on public.bookings;
create policy "bookings_update_trainer" on public.bookings
for update to authenticated
using (trainer_id = auth.uid() or public.is_trainer_or_admin())
with check (trainer_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "videos_insert_own" on public.video_submissions;
create policy "videos_insert_own" on public.video_submissions
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "videos_select_own_or_trainer" on public.video_submissions;
create policy "videos_select_own_or_trainer" on public.video_submissions
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "videos_update_trainer" on public.video_submissions;
create policy "videos_update_trainer" on public.video_submissions
for update to authenticated
using (trainer_id = auth.uid() or public.is_trainer_or_admin())
with check (trainer_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_insert_participants" on public.notifications;
create policy "notifications_insert_participants" on public.notifications
for insert to authenticated
with check (user_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "video_calls_insert_participants" on public.video_calls;
create policy "video_calls_insert_participants" on public.video_calls
for insert to authenticated
with check (user_id = auth.uid() or trainer_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "video_calls_select_participants" on public.video_calls;
create policy "video_calls_select_participants" on public.video_calls
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.is_trainer_or_admin());

drop policy if exists "video_calls_update_participants" on public.video_calls;
create policy "video_calls_update_participants" on public.video_calls
for update to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.is_trainer_or_admin())
with check (user_id = auth.uid() or trainer_id = auth.uid() or public.is_trainer_or_admin());

insert into storage.buckets (id, name, public)
values ('video-submissions', 'video-submissions', true)
on conflict (id) do update set public = true;

drop policy if exists "video_storage_insert_own_folder" on storage.objects;
create policy "video_storage_insert_own_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'video-submissions'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "video_storage_read_own_or_trainer" on storage.objects;
create policy "video_storage_read_own_or_trainer" on storage.objects
for select to authenticated
using (
  bucket_id = 'video-submissions'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_trainer_or_admin())
);

grant usage on schema public to anon, authenticated;
grant all on table public.profiles to authenticated;
grant all on table public.bmi_records to authenticated;
grant all on table public.workout_progress to authenticated;
grant all on table public.chat_threads to authenticated;
grant all on table public.chat_messages to authenticated;
grant all on table public.bookings to authenticated;
grant all on table public.video_submissions to authenticated;
grant all on table public.notifications to authenticated;
grant all on table public.video_calls to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_trainer_or_admin() to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.chat_threads;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.chat_messages;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.bookings;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.video_submissions;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.notifications;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.video_calls;
    exception
      when duplicate_object then null;
    end;
  end if;
end;
$$;

notify pgrst, 'reload schema';
