create or replace function public.create_booking_request(
  p_listing_id uuid,
  p_schedule_id uuid,
  p_party_size integer,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking_id uuid;
  v_capacity integer;
  v_end_at timestamptz;
  v_listing_status text;
  v_price integer;
  v_provider_id uuid;
  v_provider_user_id uuid;
  v_reserved integer;
  v_start_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  if p_party_size < 1 then
    raise exception '参加人数は1人以上にしてください。';
  end if;

  if char_length(coalesce(p_message, '')) > 1000 then
    raise exception 'メッセージは1000文字以内で入力してください。';
  end if;

  if not exists (select 1 from public.users where id = (select auth.uid())) then
    raise exception '利用者プロフィールを確認できませんでした。';
  end if;

  select
    listing_schedules.capacity,
    listing_schedules.end_at,
    listings.status,
    listings.price,
    listings.provider_profile_id,
    provider_profiles.user_id,
    listing_schedules.start_at
  into
    v_capacity,
    v_end_at,
    v_listing_status,
    v_price,
    v_provider_id,
    v_provider_user_id,
    v_start_at
  from public.listing_schedules
  join public.listings on listings.id = listing_schedules.listing_id
  join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
  where listing_schedules.id = p_schedule_id
    and listings.id = p_listing_id
    and listings.deleted_at is null
  for update of listing_schedules;

  if not found or v_listing_status <> 'published' then
    raise exception 'このサービスは予約できません。';
  end if;

  if v_start_at <= now() then
    raise exception 'この日時枠はすでに開始されています。';
  end if;

  select coalesce(sum(party_size), 0)
  into v_reserved
  from public.bookings
  where schedule_id = p_schedule_id
    and status in ('pending', 'confirmed');

  if v_reserved + p_party_size > v_capacity then
    raise exception 'この日時枠の残席が不足しています。';
  end if;

  insert into public.bookings (
    listing_id, schedule_id, learner_id, provider_id, party_size, message,
    status, booked_price, start_at, end_at
  )
  values (
    p_listing_id, p_schedule_id, (select auth.uid()), v_provider_id, p_party_size,
    nullif(trim(p_message), ''), 'pending', v_price, v_start_at, v_end_at
  )
  returning id into v_booking_id;

  insert into public.notifications (user_id, type, booking_id)
  values (v_provider_user_id, 'booking_request', v_booking_id);

  return v_booking_id;
end;
$$;

create or replace function public.cancel_booking(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner_id uuid;
  v_provider_id uuid;
  v_provider_user_id uuid;
  v_status text;
  v_is_learner boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  select bookings.learner_id, bookings.provider_id, bookings.status, provider_profiles.user_id
  into v_learner_id, v_provider_id, v_status, v_provider_user_id
  from public.bookings
  join public.provider_profiles on provider_profiles.id = bookings.provider_id
  where bookings.id = p_booking_id
  for update of bookings;

  if not found then
    raise exception '予約が見つかりません。';
  end if;

  v_is_learner := v_learner_id = (select auth.uid());
  if not v_is_learner and v_provider_user_id <> (select auth.uid()) then
    raise exception 'この予約をキャンセルする権限がありません。';
  end if;

  if v_status <> 'confirmed' then
    raise exception '確定済みの予約のみキャンセルできます。';
  end if;

  update public.bookings
  set status = 'cancelled', updated_at = now()
  where id = p_booking_id;

  insert into public.notifications (user_id, type, booking_id)
  values (
    case when v_is_learner then v_provider_user_id else v_learner_id end,
    'booking_cancelled',
    p_booking_id
  );

  return p_booking_id;
end;
$$;

create or replace function public.get_learner_booking_summaries()
returns table (
  id uuid,
  status text,
  party_size integer,
  message text,
  booked_price integer,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz,
  listing_title text,
  listing_type text,
  provider_display_name text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  return query
  select
    bookings.id,
    bookings.status,
    bookings.party_size,
    bookings.message,
    bookings.booked_price,
    bookings.start_at,
    bookings.end_at,
    bookings.created_at,
    listings.title,
    listings.type,
    provider_profiles.display_name
  from public.bookings
  join public.listings on listings.id = bookings.listing_id
  join public.provider_profiles on provider_profiles.id = bookings.provider_id
  where bookings.learner_id = (select auth.uid())
  order by bookings.start_at asc;
end;
$$;

revoke update on public.notifications from public, anon;
grant update on public.notifications to authenticated;

create policy "Users update own notifications" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke execute on function public.create_booking_request(uuid, uuid, integer, text) from public, anon;
grant execute on function public.create_booking_request(uuid, uuid, integer, text) to authenticated;
revoke execute on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;
revoke execute on function public.get_learner_booking_summaries() from public, anon;
grant execute on function public.get_learner_booking_summaries() to authenticated;
