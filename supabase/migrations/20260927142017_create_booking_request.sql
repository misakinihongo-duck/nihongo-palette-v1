revoke insert on public.bookings from authenticated;
drop policy "Learners create own bookings" on public.bookings;

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
    listing_schedules.start_at
  into
    v_capacity,
    v_end_at,
    v_listing_status,
    v_price,
    v_provider_id,
    v_start_at
  from public.listing_schedules
  join public.listings on listings.id = listing_schedules.listing_id
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
    listing_id,
    schedule_id,
    learner_id,
    provider_id,
    party_size,
    message,
    status,
    booked_price,
    start_at,
    end_at
  )
  values (
    p_listing_id,
    p_schedule_id,
    (select auth.uid()),
    v_provider_id,
    p_party_size,
    nullif(trim(p_message), ''),
    'pending',
    v_price,
    v_start_at,
    v_end_at
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke execute on function public.create_booking_request(uuid, uuid, integer, text) from public, anon;
grant execute on function public.create_booking_request(uuid, uuid, integer, text) to authenticated;
