create or replace function public.respond_to_booking_request(
  p_booking_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status text;
  v_learner_id uuid;
  v_provider_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  if p_status not in ('confirmed', 'rejected') then
    raise exception 'この操作は実行できません。';
  end if;

  select status, learner_id, provider_id
  into v_current_status, v_learner_id, v_provider_id
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception '予約リクエストが見つかりません。';
  end if;

  if not exists (
    select 1
    from public.provider_profiles
    where id = v_provider_id
      and user_id = (select auth.uid())
  ) then
    raise exception 'この予約リクエストを処理する権限がありません。';
  end if;

  if v_current_status <> 'pending' then
    raise exception 'この予約リクエストはすでに処理されています。';
  end if;

  update public.bookings
  set status = p_status, updated_at = now()
  where id = p_booking_id;

  insert into public.notifications (user_id, type, booking_id)
  values (
    v_learner_id,
    case when p_status = 'confirmed' then 'booking_accepted' else 'booking_rejected' end,
    p_booking_id
  );

  return p_booking_id;
end;
$$;

revoke execute on function public.respond_to_booking_request(uuid, text) from public, anon;
grant execute on function public.respond_to_booking_request(uuid, text) to authenticated;

create or replace function public.get_provider_booking_summaries()
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
  learner_name text,
  learner_nickname text
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
    users.name,
    users.nickname
  from public.bookings
  join public.provider_profiles on provider_profiles.id = bookings.provider_id
  join public.listings on listings.id = bookings.listing_id
  join public.users on users.id = bookings.learner_id
  where provider_profiles.user_id = (select auth.uid())
  order by bookings.start_at asc;
end;
$$;

revoke execute on function public.get_provider_booking_summaries() from public, anon;
grant execute on function public.get_provider_booking_summaries() to authenticated;
