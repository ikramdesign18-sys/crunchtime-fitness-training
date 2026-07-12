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
  trainer_id uuid references public.profiles(id) on delete set null,
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

create table if not exists public.workout_videos (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null check (category in ('Strength', 'Cardio', 'Full Body', 'Weight Loss', 'Muscle Gain', 'Yoga')),
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  duration int not null default 0,
  calories int not null default 0,
  exercises int not null default 1,
  thumbnail_url text,
  video_url text,
  instructions text,
  tips text,
  common_mistakes text,
  is_paid boolean not null default false,
  price_cents int,
  access_type text not null default 'free' check (access_type in ('free', 'paid', 'membership')),
  stripe_price_id text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  assigned_user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null default '',
  goal text,
  duration_days int,
  calories_per_day int,
  protein int,
  carbs int,
  fats int,
  breakfast text,
  lunch text,
  dinner text,
  snacks text,
  notes text,
  visibility text not null default 'all' check (visibility in ('all', 'assigned')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  requires_purchase boolean not null default false,
  price_cents int,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  progress_date date not null,
  breakfast_completed boolean not null default false,
  lunch_completed boolean not null default false,
  dinner_completed boolean not null default false,
  snacks_completed boolean not null default false,
  completed_count int,
  total_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists meal_progress_user_plan_date_idx
on public.meal_progress (user_id, meal_plan_id, progress_date);

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
  promo_code_used text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id text primary key,
  name text not null unique,
  stripe_price_id_monthly text,
  stripe_price_id_yearly text,
  monthly_price int,
  yearly_price int,
  features text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pricing_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text not null default '',
  amount_cents int not null default 0,
  currency text not null default 'usd',
  stripe_price_id text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_name text,
  status text not null default 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_type text not null check (access_type in ('free_first_100', 'trial', 'paid_membership', 'free_code')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  promo_source text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_access_user_status_idx
on public.app_access (user_id, status, ends_at);

create index if not exists app_access_first_100_idx
on public.app_access (user_id)
where access_type = 'free_first_100';

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null check (type in ('discount', 'free_membership')),
  discount_percent int,
  discount_amount_cents int,
  free boolean not null default false,
  applies_to text not null default 'membership' check (applies_to in ('booking', 'membership', 'meal_plan', 'workout_video', 'all')),
  grants_free_membership boolean not null default false,
  duration_days int,
  max_uses int,
  used_count int not null default 0,
  allow_multiple_per_user boolean not null default false,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promo_codes_code_lower_idx
on public.promo_codes (lower(code));

create table if not exists public.promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  applies_to text,
  redeemed_at timestamptz not null default now()
);

drop index if exists public.promo_code_redemptions_code_user_idx;

create index if not exists promo_code_redemptions_code_user_idx
on public.promo_code_redemptions (promo_code_id, user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text unique,
  amount int not null,
  currency text not null default 'usd',
  payment_type text not null check (payment_type in ('booking', 'subscription', 'membership', 'access_fee')),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('workout_video', 'meal_plan', 'booking', 'membership')),
  content_id uuid,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents int not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_purchases_user_content_idx
on public.content_purchases (user_id, content_type, content_id, status);

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
  thread_id uuid references public.chat_threads(id) on delete set null,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete cascade,
  related_id uuid,
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

drop trigger if exists set_subscription_plans_updated_at on public.subscription_plans;
create trigger set_subscription_plans_updated_at
before update on public.subscription_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_pricing_config_updated_at on public.pricing_config;
create trigger set_pricing_config_updated_at
before update on public.pricing_config
for each row execute function public.set_updated_at();

drop trigger if exists set_user_subscriptions_updated_at on public.user_subscriptions;
create trigger set_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_app_access_updated_at on public.app_access;
create trigger set_app_access_updated_at
before update on public.app_access
for each row execute function public.set_updated_at();

drop trigger if exists set_promo_codes_updated_at on public.promo_codes;
create trigger set_promo_codes_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_content_purchases_updated_at on public.content_purchases;
create trigger set_content_purchases_updated_at
before update on public.content_purchases
for each row execute function public.set_updated_at();

drop trigger if exists set_workout_videos_updated_at on public.workout_videos;
create trigger set_workout_videos_updated_at
before update on public.workout_videos
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_plans_updated_at on public.meal_plans;
create trigger set_meal_plans_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_progress_updated_at on public.meal_progress;
create trigger set_meal_progress_updated_at
before update on public.meal_progress
for each row execute function public.set_updated_at();

drop trigger if exists set_video_submissions_updated_at on public.video_submissions;
create trigger set_video_submissions_updated_at
before update on public.video_submissions
for each row execute function public.set_updated_at();

drop trigger if exists set_video_calls_updated_at on public.video_calls;
create trigger set_video_calls_updated_at
before update on public.video_calls
for each row execute function public.set_updated_at();

alter table public.profiles
add column if not exists trainer_id uuid references public.profiles(id) on delete set null;

alter table public.notifications
add column if not exists thread_id uuid references public.chat_threads(id) on delete set null;

alter table public.notifications
add column if not exists sender_id uuid references public.profiles(id) on delete set null;

alter table public.notifications
add column if not exists receiver_id uuid references public.profiles(id) on delete cascade;

alter table public.notifications
add column if not exists related_id uuid;

alter table public.workout_videos
add column if not exists instructions text,
add column if not exists tips text,
add column if not exists common_mistakes text,
add column if not exists is_paid boolean not null default false,
add column if not exists price_cents int,
add column if not exists access_type text not null default 'free',
add column if not exists stripe_price_id text;

alter table public.meal_plans
add column if not exists assigned_user_id uuid references public.profiles(id) on delete set null,
add column if not exists description text not null default '',
add column if not exists goal text,
add column if not exists duration_days int,
add column if not exists calories_per_day int,
add column if not exists protein int,
add column if not exists carbs int,
add column if not exists fats int,
add column if not exists breakfast text,
add column if not exists lunch text,
add column if not exists dinner text,
add column if not exists snacks text,
add column if not exists notes text,
add column if not exists visibility text not null default 'all',
add column if not exists status text not null default 'draft',
add column if not exists requires_purchase boolean not null default false,
add column if not exists price_cents int,
add column if not exists stripe_price_id text;

alter table public.bookings
add column if not exists payment_status text not null default 'unpaid',
add column if not exists payment_id uuid references public.payments(id) on delete set null,
add column if not exists amount_paid int not null default 0,
add column if not exists promo_code_used text;

alter table public.promo_codes
add column if not exists free boolean not null default false,
add column if not exists applies_to text not null default 'membership';

alter table public.promo_codes
drop constraint if exists promo_codes_applies_to_check;

alter table public.promo_codes
add constraint promo_codes_applies_to_check
check (applies_to in ('booking', 'membership', 'meal_plan', 'workout_video', 'all'));

alter table public.promo_code_redemptions
add column if not exists booking_id uuid references public.bookings(id) on delete set null,
add column if not exists applies_to text;

update public.bookings
set payment_status = 'unpaid'
where payment_status is null
  or payment_status not in ('unpaid', 'paid', 'failed', 'refunded', 'free_promo', 'waived');

alter table public.bookings
drop constraint if exists bookings_payment_status_check;

alter table public.bookings
add constraint bookings_payment_status_check
check (payment_status in ('unpaid', 'paid', 'failed', 'refunded', 'free_promo', 'waived'));

alter table public.subscription_plans
add column if not exists stripe_price_id_monthly text,
add column if not exists stripe_price_id_yearly text,
add column if not exists monthly_price int,
add column if not exists yearly_price int,
add column if not exists features text[] not null default '{}',
add column if not exists is_active boolean not null default true;

alter table public.payments
drop constraint if exists payments_payment_type_check;

alter table public.payments
add constraint payments_payment_type_check
check (payment_type in ('booking', 'subscription', 'membership', 'access_fee', 'meal_plan', 'workout_video'));

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'workout_videos_access_type_check'
      and conrelid = 'public.workout_videos'::regclass
  ) then
    alter table public.workout_videos
    add constraint workout_videos_access_type_check
    check (access_type in ('free', 'paid', 'membership'));
  end if;
end;
$$;

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

create or replace function public.prevent_client_booking_payment_change()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role'
    and (
      old.payment_status is distinct from new.payment_status
      or old.payment_id is distinct from new.payment_id
      or old.amount_paid is distinct from new.amount_paid
    ) then
    raise exception 'Booking payment fields can only be updated by the payment server.';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

drop trigger if exists prevent_client_booking_payment_change on public.bookings;
create trigger prevent_client_booking_payment_change
before update on public.bookings
for each row execute function public.prevent_client_booking_payment_change();

create or replace function public.ensure_app_access(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  active_access public.app_access%rowtype;
  free_count int := 0;
  free_limit int := 100;
begin
  update public.app_access
  set status = 'expired'
  where user_id = p_user_id
    and status = 'active'
    and ends_at is not null
    and ends_at <= now();

  select *
  into active_access
  from public.app_access
  where user_id = p_user_id
    and status = 'active'
    and (ends_at is null or ends_at > now())
  order by created_at desc
  limit 1;

  if active_access.id is not null then
    select count(distinct user_id)
    into free_count
    from public.app_access
    where access_type = 'free_first_100';

    return jsonb_build_object(
      'active', true,
      'access_type', active_access.access_type,
      'status', active_access.status,
      'starts_at', active_access.starts_at,
      'ends_at', active_access.ends_at,
      'promo_source', active_access.promo_source,
      'first_100_slots_remaining', greatest(free_limit - free_count, 0),
      'trial_available', false,
      'membership_price_key', 'membership_monthly'
    );
  end if;

  perform pg_advisory_xact_lock(hashtext('app_access_first_100'));

  select count(distinct user_id)
  into free_count
  from public.app_access
  where access_type = 'free_first_100';

  if free_count < free_limit then
    insert into public.app_access (user_id, access_type, status, promo_source, starts_at)
    values (p_user_id, 'free_first_100', 'active', 'automatic_first_100', now())
    returning * into active_access;

    return jsonb_build_object(
      'active', true,
      'access_type', active_access.access_type,
      'status', active_access.status,
      'starts_at', active_access.starts_at,
      'ends_at', active_access.ends_at,
      'promo_source', active_access.promo_source,
      'first_100_slots_remaining', greatest(free_limit - free_count - 1, 0),
      'trial_available', false,
      'membership_price_key', 'membership_monthly'
    );
  end if;

  return jsonb_build_object(
    'active', false,
    'status', 'inactive',
    'first_100_slots_remaining', 0,
    'trial_available', true,
    'membership_price_key', 'membership_monthly'
  );
end;
$$;

create or replace function public.redeem_promo_code(p_user_id uuid, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(coalesce(p_code, '')));
  promo public.promo_codes%rowtype;
  access_row public.app_access%rowtype;
begin
  if normalized_code = '' then
    return jsonb_build_object('ok', false, 'message', 'Enter a promo code first.');
  end if;

  perform pg_advisory_xact_lock(hashtext('promo_code:' || normalized_code));

  select *
  into promo
  from public.promo_codes
  where upper(code) = normalized_code
  limit 1;

  if promo.id is null then
    return jsonb_build_object('ok', false, 'message', 'This code is not valid.');
  end if;

  if promo.is_active is not true then
    return jsonb_build_object('ok', false, 'message', 'This code is no longer active.');
  end if;

  if promo.expires_at is not null and promo.expires_at <= now() then
    return jsonb_build_object('ok', false, 'message', 'This code has expired.');
  end if;

  if promo.max_uses is not null and promo.used_count >= promo.max_uses then
    return jsonb_build_object('ok', false, 'message', 'This code has already been fully redeemed.');
  end if;

  if promo.applies_to not in ('membership', 'all') then
    return jsonb_build_object('ok', false, 'message', 'This promo code does not apply to membership.');
  end if;

  if promo.allow_multiple_per_user is not true
    and exists (
      select 1
      from public.promo_code_redemptions
      where promo_code_id = promo.id
        and user_id = p_user_id
    ) then
    return jsonb_build_object('ok', false, 'message', 'You have already redeemed this code.');
  end if;

  insert into public.promo_code_redemptions (promo_code_id, user_id)
  values (promo.id, p_user_id);

  update public.promo_codes
  set used_count = used_count + 1
  where id = promo.id
  returning * into promo;

  if promo.grants_free_membership then
    insert into public.app_access (
      user_id,
      access_type,
      status,
      promo_source,
      starts_at,
      ends_at
    )
    values (
      p_user_id,
      'free_code',
      'active',
      promo.code,
      now(),
      case
        when promo.duration_days is null then null
        else now() + make_interval(days => promo.duration_days)
      end
    )
    returning * into access_row;
  end if;

  return jsonb_build_object(
    'ok', true,
    'message',
      case
        when promo.grants_free_membership then 'Free membership code redeemed.'
        else 'Promo code redeemed.'
      end,
    'type', promo.type,
    'discount_percent', promo.discount_percent,
    'discount_amount_cents', promo.discount_amount_cents,
    'grants_free_membership', promo.grants_free_membership,
    'duration_days', promo.duration_days,
    'access',
      case
        when access_row.id is null then null
        else jsonb_build_object(
          'active', true,
          'access_type', access_row.access_type,
          'status', access_row.status,
          'starts_at', access_row.starts_at,
          'ends_at', access_row.ends_at,
          'promo_source', access_row.promo_source
        )
      end
  );
end;
$$;

create or replace function public.redeem_booking_promo(
  p_user_id uuid,
  p_trainer_id uuid,
  p_code text,
  p_session_type text,
  p_session_date date,
  p_session_time text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(coalesce(p_code, '')));
  promo public.promo_codes%rowtype;
  booking_row public.bookings%rowtype;
begin
  if normalized_code = '' then
    return jsonb_build_object('ok', false, 'message', 'Enter a promo code first.');
  end if;

  if trim(coalesce(p_session_type, '')) = ''
    or p_session_date is null
    or trim(coalesce(p_session_time, '')) = '' then
    return jsonb_build_object('ok', false, 'message', 'Choose a session type, date, and time first.');
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    return jsonb_build_object('ok', false, 'message', 'Your account could not be found.');
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_trainer_id and role in ('trainer', 'admin')
  ) then
    return jsonb_build_object('ok', false, 'message', 'A trainer is not available for this booking.');
  end if;

  perform pg_advisory_xact_lock(hashtext('promo_code:' || normalized_code));

  select *
  into promo
  from public.promo_codes
  where upper(code) = normalized_code
  limit 1;

  if promo.id is null then
    return jsonb_build_object('ok', false, 'message', 'This promo code is not valid.');
  end if;

  if promo.is_active is not true then
    return jsonb_build_object('ok', false, 'message', 'This promo code is no longer active.');
  end if;

  if promo.expires_at is not null and promo.expires_at <= now() then
    return jsonb_build_object('ok', false, 'message', 'This promo code has expired.');
  end if;

  if promo.max_uses is not null and promo.used_count >= promo.max_uses then
    return jsonb_build_object('ok', false, 'message', 'This promo code has already been fully redeemed.');
  end if;

  if promo.applies_to not in ('booking', 'all') then
    return jsonb_build_object('ok', false, 'message', 'This promo code does not apply to bookings.');
  end if;

  if promo.free is not true and coalesce(promo.discount_percent, 0) < 100 then
    return jsonb_build_object('ok', false, 'message', 'This promo code does not fully cover the booking price.');
  end if;

  if promo.allow_multiple_per_user is not true
    and exists (
      select 1
      from public.promo_code_redemptions
      where promo_code_id = promo.id
        and user_id = p_user_id
    ) then
    return jsonb_build_object('ok', false, 'message', 'You have already redeemed this promo code.');
  end if;

  insert into public.bookings (
    user_id,
    trainer_id,
    session_type,
    session_date,
    session_time,
    note,
    status,
    payment_status,
    amount_paid,
    promo_code_used
  )
  values (
    p_user_id,
    p_trainer_id,
    trim(p_session_type),
    p_session_date,
    trim(p_session_time),
    nullif(trim(coalesce(p_note, '')), ''),
    'pending',
    'free_promo',
    0,
    promo.code
  )
  returning * into booking_row;

  insert into public.promo_code_redemptions (promo_code_id, user_id, booking_id, applies_to)
  values (promo.id, p_user_id, booking_row.id, 'booking');

  update public.promo_codes
  set used_count = used_count + 1
  where id = promo.id;

  return jsonb_build_object(
    'ok', true,
    'message', 'Promo code applied. Your booking was created without online payment.',
    'code', promo.code,
    'booking', to_jsonb(booking_row)
  );
end;
$$;

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
alter table public.workout_videos enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_progress enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.pricing_config enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.app_access enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_code_redemptions enable row level security;
alter table public.payments enable row level security;
alter table public.content_purchases enable row level security;
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
using (
  id = auth.uid()
  or role in ('trainer', 'admin')
  or public.current_user_role() = 'admin'
  or trainer_id = auth.uid()
  or exists (
    select 1
    from public.bookings b
    where b.user_id = profiles.id
      and b.trainer_id = auth.uid()
  )
);

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
using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.profiles p
    where p.id = bmi_records.user_id
      and p.trainer_id = auth.uid()
  )
  or exists (
    select 1
    from public.bookings b
    where b.user_id = bmi_records.user_id
      and b.trainer_id = auth.uid()
      and b.status = 'accepted'
  )
);

drop policy if exists "workout_insert_own" on public.workout_progress;
create policy "workout_insert_own" on public.workout_progress
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "workout_select_own_or_trainer" on public.workout_progress;
create policy "workout_select_own_or_trainer" on public.workout_progress
for select to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1
    from public.profiles p
    where p.id = workout_progress.user_id
      and p.trainer_id = auth.uid()
  )
  or exists (
    select 1
    from public.bookings b
    where b.user_id = workout_progress.user_id
      and b.trainer_id = auth.uid()
      and b.status = 'accepted'
  )
);

drop policy if exists "workout_videos_insert_trainer" on public.workout_videos;
create policy "workout_videos_insert_trainer" on public.workout_videos
for insert to authenticated
with check (trainer_id = auth.uid() and public.is_trainer_or_admin());

drop policy if exists "workout_videos_select_published_or_trainer" on public.workout_videos;
create policy "workout_videos_select_published_or_trainer" on public.workout_videos
for select to authenticated
using (
  trainer_id = auth.uid()
  or public.current_user_role() = 'admin'
  or (
    published = true
    and (
      coalesce(is_paid, false) = false
      or exists (
        select 1
        from public.content_purchases cp
        where cp.user_id = auth.uid()
          and cp.content_type = 'workout_video'
          and cp.content_id = workout_videos.id
          and cp.status = 'succeeded'
      )
    )
  )
);

drop policy if exists "workout_videos_update_trainer" on public.workout_videos;
create policy "workout_videos_update_trainer" on public.workout_videos
for update to authenticated
using ((trainer_id = auth.uid() or public.current_user_role() = 'admin') and public.is_trainer_or_admin())
with check ((trainer_id = auth.uid() or public.current_user_role() = 'admin') and public.is_trainer_or_admin());

drop policy if exists "workout_videos_delete_trainer" on public.workout_videos;
create policy "workout_videos_delete_trainer" on public.workout_videos
for delete to authenticated
using ((trainer_id = auth.uid() or public.current_user_role() = 'admin') and public.is_trainer_or_admin());

drop policy if exists "meal_plans_insert_trainer" on public.meal_plans;
create policy "meal_plans_insert_trainer" on public.meal_plans
for insert to authenticated
with check (trainer_id = auth.uid() and public.is_trainer_or_admin());

drop policy if exists "meal_plans_select_visible" on public.meal_plans;
create policy "meal_plans_select_visible" on public.meal_plans
for select to authenticated
using (
  (
    status = 'published'
    and visibility = 'all'
    and (
      coalesce(requires_purchase, false) = false
      or exists (
        select 1
        from public.content_purchases cp
        where cp.user_id = auth.uid()
          and cp.content_type = 'meal_plan'
          and (cp.content_id = meal_plans.id or cp.content_id is null)
          and cp.status = 'succeeded'
      )
    )
  )
  or (status = 'published' and visibility = 'assigned' and assigned_user_id = auth.uid())
  or trainer_id = auth.uid()
  or public.current_user_role() = 'admin'
);

drop policy if exists "meal_plans_update_trainer" on public.meal_plans;
create policy "meal_plans_update_trainer" on public.meal_plans
for update to authenticated
using ((trainer_id = auth.uid() or public.current_user_role() = 'admin') and public.is_trainer_or_admin())
with check ((trainer_id = auth.uid() or public.current_user_role() = 'admin') and public.is_trainer_or_admin());

drop policy if exists "meal_plans_delete_trainer" on public.meal_plans;
create policy "meal_plans_delete_trainer" on public.meal_plans
for delete to authenticated
using ((trainer_id = auth.uid() or public.current_user_role() = 'admin') and public.is_trainer_or_admin());

drop policy if exists "meal_progress_select_own_or_trainer" on public.meal_progress;
create policy "meal_progress_select_own_or_trainer" on public.meal_progress
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.meal_plans mp
    where mp.id = meal_plan_id
      and (mp.trainer_id = auth.uid() or public.current_user_role() = 'admin')
  )
);

drop policy if exists "meal_progress_insert_own" on public.meal_progress;
create policy "meal_progress_insert_own" on public.meal_progress
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "meal_progress_update_own" on public.meal_progress;
create policy "meal_progress_update_own" on public.meal_progress
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

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
with check (false);

drop policy if exists "bookings_select_own_or_trainer" on public.bookings;
create policy "bookings_select_own_or_trainer" on public.bookings
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "bookings_update_trainer" on public.bookings;
create policy "bookings_update_trainer" on public.bookings
for update to authenticated
using (trainer_id = auth.uid() or public.current_user_role() = 'admin')
with check (
  (trainer_id = auth.uid() or public.current_user_role() = 'admin')
  and (
    status <> 'accepted'
    or payment_status in ('paid', 'free_promo', 'waived')
  )
);

drop policy if exists "subscription_plans_select_active" on public.subscription_plans;
create policy "subscription_plans_select_active" on public.subscription_plans
for select to authenticated
using (is_active = true or public.current_user_role() = 'admin');

drop policy if exists "pricing_config_select_active" on public.pricing_config;
create policy "pricing_config_select_active" on public.pricing_config
for select to authenticated
using (is_active = true or public.current_user_role() = 'admin');

drop policy if exists "user_subscriptions_select_own_or_admin" on public.user_subscriptions;
create policy "user_subscriptions_select_own_or_admin" on public.user_subscriptions
for select to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "app_access_select_own_or_admin" on public.app_access;
create policy "app_access_select_own_or_admin" on public.app_access
for select to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "promo_codes_select_admin" on public.promo_codes;
create policy "promo_codes_select_admin" on public.promo_codes
for select to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists "promo_redemptions_select_own_or_admin" on public.promo_code_redemptions;
create policy "promo_redemptions_select_own_or_admin" on public.promo_code_redemptions
for select to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "payments_select_own_or_trainer" on public.payments;
create policy "payments_select_own_or_trainer" on public.payments
for select to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (b.user_id = auth.uid() or b.trainer_id = auth.uid())
  )
);

drop policy if exists "content_purchases_select_own_or_admin" on public.content_purchases;
create policy "content_purchases_select_own_or_admin" on public.content_purchases
for select to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "videos_insert_own" on public.video_submissions;
create policy "videos_insert_own" on public.video_submissions
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "videos_select_own_or_trainer" on public.video_submissions;
create policy "videos_select_own_or_trainer" on public.video_submissions
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "videos_update_trainer" on public.video_submissions;
create policy "videos_update_trainer" on public.video_submissions
for update to authenticated
using (trainer_id = auth.uid() or public.current_user_role() = 'admin')
with check (trainer_id = auth.uid() or public.current_user_role() = 'admin');

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
with check (
  user_id = auth.uid()
  or public.current_user_role() = 'admin'
  or (
    sender_id = auth.uid()
    and receiver_id = user_id
    and (
      thread_id is null
      or exists (
        select 1 from public.chat_threads t
        where t.id = thread_id
          and auth.uid() in (t.user_id, t.trainer_id)
          and user_id in (t.user_id, t.trainer_id)
      )
    )
  )
);

drop policy if exists "video_calls_insert_participants" on public.video_calls;
create policy "video_calls_insert_participants" on public.video_calls
for insert to authenticated
with check (user_id = auth.uid() or trainer_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "video_calls_select_participants" on public.video_calls;
create policy "video_calls_select_participants" on public.video_calls
for select to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "video_calls_update_participants" on public.video_calls;
create policy "video_calls_update_participants" on public.video_calls
for update to authenticated
using (user_id = auth.uid() or trainer_id = auth.uid() or public.current_user_role() = 'admin')
with check (user_id = auth.uid() or trainer_id = auth.uid() or public.current_user_role() = 'admin');

insert into storage.buckets (id, name, public)
values ('video-submissions', 'video-submissions', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('workout-videos', 'workout-videos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('workout-thumbnails', 'workout-thumbnails', true)
on conflict (id) do update set public = true;

insert into public.subscription_plans (
  id,
  name,
  monthly_price,
  yearly_price,
  features,
  is_active
)
values
  ('bronze', 'Bronze', 2900, 29000, array['Starter training access', 'Basic progress tracking', 'One monthly video review'], true),
  ('silver', 'Silver', 5900, 59000, array['Everything in Bronze', 'Monthly coaching check-in', 'Workout and meal guidance'], true),
  ('gold', 'Gold', 9900, 99000, array['Everything in Silver', 'Priority video reviews', 'Two coaching sessions per month'], true),
  ('platinum', 'Platinum', 14900, 149000, array['Everything in Gold', 'Weekly coaching support', 'Premium package access'], true)
on conflict (id) do update set
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  yearly_price = excluded.yearly_price,
  features = excluded.features,
  is_active = excluded.is_active;

insert into public.pricing_config (
  key,
  title,
  description,
  amount_cents,
  currency,
  is_active,
  metadata
)
values
  (
    'membership_monthly',
    'Membership Access',
    'First 100 users receive free promotional membership access. After that, users get a 7-day free trial, then $8/month.',
    800,
    'usd',
    true,
    '{"interval":"month","trial_days":7,"first_100_free":true}'::jsonb
  ),
  (
    'booking_one_hour',
    '1-hour Trainer Session',
    'Separate paid one-hour trainer/video session booking.',
    5000,
    'usd',
    true,
    '{"duration_minutes":60}'::jsonb
  ),
  (
    'custom_meal_plan',
    'Custom Meal Plan',
    'Separate paid custom meal plan request.',
    2500,
    'usd',
    true,
    '{}'::jsonb
  ),
  (
    'premium_workout_video',
    'Premium Workout Video',
    'Separate paid premium workout video unlock.',
    800,
    'usd',
    true,
    '{}'::jsonb
  )
on conflict (key) do nothing;

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
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.current_user_role() = 'admin'
    or exists (
      select 1
      from public.video_submissions vs
      where vs.user_id::text = (storage.foldername(name))[1]
        and vs.trainer_id = auth.uid()
    )
  )
);

drop policy if exists "workout_media_insert_trainer_folder" on storage.objects;
create policy "workout_media_insert_trainer_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id in ('workout-videos', 'workout-thumbnails')
  and public.is_trainer_or_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workout_media_update_trainer_folder" on storage.objects;
create policy "workout_media_update_trainer_folder" on storage.objects
for update to authenticated
using (
  bucket_id in ('workout-videos', 'workout-thumbnails')
  and public.is_trainer_or_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('workout-videos', 'workout-thumbnails')
  and public.is_trainer_or_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workout_media_delete_trainer_folder" on storage.objects;
create policy "workout_media_delete_trainer_folder" on storage.objects
for delete to authenticated
using (
  bucket_id in ('workout-videos', 'workout-thumbnails')
  and public.is_trainer_or_admin()
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "workout_media_read_authenticated" on storage.objects;
create policy "workout_media_read_authenticated" on storage.objects
for select to authenticated
using (bucket_id in ('workout-videos', 'workout-thumbnails'));

grant usage on schema public to anon, authenticated;
grant all on table public.profiles to authenticated;
grant all on table public.bmi_records to authenticated;
grant all on table public.workout_progress to authenticated;
grant all on table public.workout_videos to authenticated;
grant all on table public.meal_plans to authenticated;
grant all on table public.meal_progress to authenticated;
grant select on table public.subscription_plans to authenticated;
grant select on table public.pricing_config to authenticated;
grant select on table public.user_subscriptions to authenticated;
grant select on table public.app_access to authenticated;
grant select on table public.promo_codes to authenticated;
grant select on table public.promo_code_redemptions to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.content_purchases to authenticated;
grant all on table public.chat_threads to authenticated;
grant all on table public.chat_messages to authenticated;
grant all on table public.bookings to authenticated;
grant all on table public.video_submissions to authenticated;
grant all on table public.notifications to authenticated;
grant all on table public.video_calls to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_trainer_or_admin() to authenticated;
revoke all on function public.ensure_app_access(uuid) from public, anon, authenticated;
revoke all on function public.redeem_promo_code(uuid, text) from public, anon, authenticated;
revoke all on function public.redeem_booking_promo(uuid, uuid, text, text, date, text, text) from public, anon, authenticated;
grant execute on function public.ensure_app_access(uuid) to service_role;
grant execute on function public.redeem_promo_code(uuid, text) to service_role;
grant execute on function public.redeem_booking_promo(uuid, uuid, text, text, date, text, text) to service_role;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.workout_videos;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.meal_plans;
    exception
      when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.meal_progress;
    exception
      when duplicate_object then null;
    end;

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
