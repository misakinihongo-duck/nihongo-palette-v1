grant select, insert, update, delete on public.listing_schedules to authenticated;

create policy "Providers manage own listing schedules" on public.listing_schedules
  for all to authenticated
  using (
    exists (
      select 1
      from public.listings
      join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
      where listings.id = listing_schedules.listing_id
        and provider_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.listings
      join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
      where listings.id = listing_schedules.listing_id
        and provider_profiles.user_id = (select auth.uid())
    )
  );
