create extension if not exists "pgcrypto";

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  nickname text,
  age smallint check (age is null or age > 0),
  profile_photo text,
  bio text,
  japanese_level text check (
    japanese_level is null
    or japanese_level in ('beginner_zero', 'beginner', 'intermediate', 'advanced')
  ),
  last_active_mode text not null default 'learner' check (last_active_mode in ('learner', 'provider')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.learner_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  things_to_do text[] not null default '{}',
  people_to_connect text[] not null default '{}',
  challenges text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.provider_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  profile_photo text,
  roles text[] not null,
  languages text[] not null,
  area text,
  bio text not null,
  experience text,
  expertise text[] not null,
  website text,
  social_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_roles_defined check (
    roles <@ array['teacher', 'conversation_host', 'local_guide', 'event_host']::text[]
  )
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.provider_profiles(id),
  type text not null check (type in ('lesson', 'experience', 'local_guide')),
  title text not null,
  description text not null,
  category text,
  themes text[] not null default '{}',
  target_levels text[],
  price integer not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  format text not null check (format in ('online', 'offline')),
  location text,
  capacity integer not null check (capacity >= 1),
  languages text[] not null default '{}',
  lesson_format text check (lesson_format is null or lesson_format in ('one_to_one', 'group')),
  materials text,
  meeting_point text,
  items_to_bring text,
  inclusions text,
  participation_requirements text,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint offline_listing_requires_location check (format = 'online' or location is not null)
);

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  sort_order smallint not null check (sort_order >= 0),
  unique (listing_id, sort_order)
);

create table public.listing_schedules (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity >= 1),
  created_at timestamptz not null default now(),
  constraint listing_schedule_time_order check (end_at > start_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  schedule_id uuid not null references public.listing_schedules(id),
  learner_id uuid not null references public.users(id),
  provider_id uuid not null references public.provider_profiles(id),
  party_size integer not null check (party_size >= 1),
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  booked_price integer not null check (booked_price >= 0),
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.users(id),
  provider_id uuid not null references public.provider_profiles(id),
  listing_id uuid not null references public.listings(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, provider_id, listing_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null check (length(trim(body)) > 0),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (
    type in ('booking_request', 'booking_accepted', 'booking_rejected', 'booking_cancelled', 'new_message')
  ),
  booking_id uuid references public.bookings(id),
  conversation_id uuid references public.conversations(id),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index listings_provider_profile_id_idx on public.listings(provider_profile_id);
create index listings_status_type_idx on public.listings(status, type);
create index listings_category_idx on public.listings(category);
create index listing_schedules_listing_id_start_at_idx on public.listing_schedules(listing_id, start_at);
create index bookings_learner_id_start_at_idx on public.bookings(learner_id, start_at);
create index bookings_provider_id_start_at_idx on public.bookings(provider_id, start_at);
create index bookings_schedule_id_status_idx on public.bookings(schedule_id, status);
create index conversations_learner_id_updated_at_idx on public.conversations(learner_id, updated_at);
create index conversations_provider_id_updated_at_idx on public.conversations(provider_id, updated_at);
create index messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at);
create index notifications_user_id_read_at_created_at_idx on public.notifications(user_id, read_at, created_at);

alter table public.users enable row level security;
alter table public.learner_preferences enable row level security;
alter table public.provider_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_schedules enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- SQL-created tables need explicit Data API privileges. RLS policies below
-- remain the source of truth for which authenticated users can access rows.
grant usage on schema public to authenticated;
grant select, insert, update on public.users to authenticated;
grant select, insert, update, delete on public.learner_preferences to authenticated;
grant select, insert, update on public.provider_profiles to authenticated;
grant select, insert, update on public.listings to authenticated;
grant select on public.listing_images to authenticated;
grant select on public.listing_schedules to authenticated;
grant select, insert on public.bookings to authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant select on public.notifications to authenticated;

create policy "Users can read own user row" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can insert own user row" on public.users
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update own user row" on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Learners manage own preferences" on public.learner_preferences
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authenticated users can read provider profiles" on public.provider_profiles
  for select to authenticated
  using (true);

create policy "Providers manage own profile" on public.provider_profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Authenticated users can read published listings" on public.listings
  for select to authenticated
  using (
    (status = 'published' and deleted_at is null)
    or exists (
      select 1 from public.provider_profiles
      where provider_profiles.id = listings.provider_profile_id
        and provider_profiles.user_id = (select auth.uid())
    )
  );

create policy "Providers manage own listings" on public.listings
  for all to authenticated
  using (
    exists (
      select 1 from public.provider_profiles
      where provider_profiles.id = listings.provider_profile_id
        and provider_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.provider_profiles
      where provider_profiles.id = listings.provider_profile_id
        and provider_profiles.user_id = (select auth.uid())
    )
  );

create policy "Listing images follow listing read access" on public.listing_images
  for select to authenticated
  using (exists (select 1 from public.listings where listings.id = listing_images.listing_id));

create policy "Listing schedules follow listing read access" on public.listing_schedules
  for select to authenticated
  using (exists (select 1 from public.listings where listings.id = listing_schedules.listing_id));

create policy "Learners and providers read own bookings" on public.bookings
  for select to authenticated
  using (
    learner_id = (select auth.uid())
    or exists (
      select 1 from public.provider_profiles
      where provider_profiles.id = bookings.provider_id
        and provider_profiles.user_id = (select auth.uid())
    )
  );

create policy "Learners create own bookings" on public.bookings
  for insert to authenticated
  with check (learner_id = (select auth.uid()));

create policy "Conversation participants can read conversations" on public.conversations
  for select to authenticated
  using (
    learner_id = (select auth.uid())
    or exists (
      select 1 from public.provider_profiles
      where provider_profiles.id = conversations.provider_id
        and provider_profiles.user_id = (select auth.uid())
    )
  );

create policy "Conversation participants can read messages" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
        and (
          conversations.learner_id = (select auth.uid())
          or exists (
            select 1 from public.provider_profiles
            where provider_profiles.id = conversations.provider_id
              and provider_profiles.user_id = (select auth.uid())
          )
        )
    )
  );

create policy "Users read own notifications" on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));
