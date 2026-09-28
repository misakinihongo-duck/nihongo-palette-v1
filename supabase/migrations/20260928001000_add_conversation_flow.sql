create or replace function public.get_or_create_conversation(
  p_listing_id uuid default null,
  p_booking_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
  v_learner_id uuid;
  v_listing_id uuid;
  v_provider_id uuid;
  v_provider_user_id uuid;
  v_listing_status text;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  if p_booking_id is not null then
    select bookings.learner_id, bookings.listing_id, bookings.provider_id, provider_profiles.user_id
    into v_learner_id, v_listing_id, v_provider_id, v_provider_user_id
    from public.bookings
    join public.provider_profiles on provider_profiles.id = bookings.provider_id
    where bookings.id = p_booking_id;

    if not found then
      raise exception '予約が見つかりません。';
    end if;

    if v_learner_id <> (select auth.uid()) and v_provider_user_id <> (select auth.uid()) then
      raise exception 'この予約の会話を開始する権限がありません。';
    end if;
  elsif p_listing_id is not null then
    select listings.id, listings.provider_profile_id, provider_profiles.user_id, listings.status
    into v_listing_id, v_provider_id, v_provider_user_id, v_listing_status
    from public.listings
    join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
    where listings.id = p_listing_id
      and listings.deleted_at is null;

    if not found or v_listing_status <> 'published' then
      raise exception 'このサービスにはメッセージできません。';
    end if;

    if v_provider_user_id = (select auth.uid()) then
      raise exception '自分のサービスにはメッセージできません。';
    end if;

    v_learner_id := (select auth.uid());
  else
    raise exception 'サービスまたは予約を指定してください。';
  end if;

  insert into public.conversations (learner_id, provider_id, listing_id)
  values (v_learner_id, v_provider_id, v_listing_id)
  on conflict (learner_id, provider_id, listing_id)
  do update set updated_at = public.conversations.updated_at
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

create or replace function public.send_conversation_message(
  p_conversation_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message_id uuid;
  v_learner_id uuid;
  v_provider_user_id uuid;
  v_recipient_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'メッセージを入力してください。';
  end if;

  if char_length(p_body) > 2000 then
    raise exception 'メッセージは2000文字以内で入力してください。';
  end if;

  select conversations.learner_id, provider_profiles.user_id
  into v_learner_id, v_provider_user_id
  from public.conversations
  join public.provider_profiles on provider_profiles.id = conversations.provider_id
  where conversations.id = p_conversation_id
  for update of conversations;

  if not found then
    raise exception '会話が見つかりません。';
  end if;

  if (select auth.uid()) = v_learner_id then
    v_recipient_id := v_provider_user_id;
  elsif (select auth.uid()) = v_provider_user_id then
    v_recipient_id := v_learner_id;
  else
    raise exception 'この会話にメッセージを送る権限がありません。';
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (p_conversation_id, (select auth.uid()), trim(p_body))
  returning id into v_message_id;

  update public.conversations
  set updated_at = now()
  where id = p_conversation_id;

  insert into public.notifications (user_id, type, conversation_id)
  values (v_recipient_id, 'new_message', p_conversation_id);

  return v_message_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner_id uuid;
  v_provider_user_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  select conversations.learner_id, provider_profiles.user_id
  into v_learner_id, v_provider_user_id
  from public.conversations
  join public.provider_profiles on provider_profiles.id = conversations.provider_id
  where conversations.id = p_conversation_id;

  if not found or ((select auth.uid()) <> v_learner_id and (select auth.uid()) <> v_provider_user_id) then
    raise exception 'この会話を開く権限がありません。';
  end if;

  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> (select auth.uid())
    and read_at is null;
end;
$$;

create or replace function public.get_conversation_summaries()
returns table (
  id uuid,
  listing_id uuid,
  listing_title text,
  other_name text,
  other_photo text,
  latest_message text,
  latest_message_at timestamptz,
  unread_count bigint,
  updated_at timestamptz
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
    conversations.id,
    conversations.listing_id,
    listings.title,
    case when conversations.learner_id = (select auth.uid()) then provider_profiles.display_name else users.nickname end,
    case when conversations.learner_id = (select auth.uid()) then provider_profiles.profile_photo else users.profile_photo end,
    latest.body,
    latest.created_at,
    coalesce(unread.total, 0),
    conversations.updated_at
  from public.conversations
  join public.listings on listings.id = conversations.listing_id
  join public.provider_profiles on provider_profiles.id = conversations.provider_id
  join public.users on users.id = conversations.learner_id
  left join lateral (
    select messages.body, messages.created_at
    from public.messages
    where messages.conversation_id = conversations.id
    order by messages.created_at desc
    limit 1
  ) latest on true
  left join lateral (
    select count(*) as total
    from public.messages
    where messages.conversation_id = conversations.id
      and messages.sender_id <> (select auth.uid())
      and messages.read_at is null
  ) unread on true
  where conversations.learner_id = (select auth.uid())
    or provider_profiles.user_id = (select auth.uid())
  order by conversations.updated_at desc;
end;
$$;

create or replace function public.get_conversation_messages(p_conversation_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  body text,
  read_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_learner_id uuid;
  v_provider_user_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'ログインが必要です。';
  end if;

  select conversations.learner_id, provider_profiles.user_id
  into v_learner_id, v_provider_user_id
  from public.conversations
  join public.provider_profiles on provider_profiles.id = conversations.provider_id
  where conversations.id = p_conversation_id;

  if not found or ((select auth.uid()) <> v_learner_id and (select auth.uid()) <> v_provider_user_id) then
    raise exception 'この会話を開く権限がありません。';
  end if;

  return query
  select messages.id, messages.sender_id, messages.body, messages.read_at, messages.created_at
  from public.messages
  where messages.conversation_id = p_conversation_id
  order by messages.created_at asc;
end;
$$;

revoke execute on function public.get_or_create_conversation(uuid, uuid) from public, anon;
grant execute on function public.get_or_create_conversation(uuid, uuid) to authenticated;
revoke execute on function public.send_conversation_message(uuid, text) from public, anon;
grant execute on function public.send_conversation_message(uuid, text) to authenticated;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
revoke execute on function public.get_conversation_summaries() from public, anon;
grant execute on function public.get_conversation_summaries() to authenticated;
revoke execute on function public.get_conversation_messages(uuid) from public, anon;
grant execute on function public.get_conversation_messages(uuid) to authenticated;
