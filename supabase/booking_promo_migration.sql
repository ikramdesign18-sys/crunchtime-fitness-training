begin;

alter table public.bookings
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

revoke all on function public.redeem_booking_promo(uuid, uuid, text, text, date, text, text)
from public, anon, authenticated;

grant execute on function public.redeem_booking_promo(uuid, uuid, text, text, date, text, text)
to service_role;

commit;

notify pgrst, 'reload schema';
