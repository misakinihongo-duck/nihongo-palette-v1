drop policy "Providers upload own listing images" on storage.objects;

create policy "Providers upload own listing images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1
      from public.listings
      join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
      where listings.id::text = (storage.foldername(name))[2]
        and provider_profiles.user_id = (select auth.uid())
    )
  );
