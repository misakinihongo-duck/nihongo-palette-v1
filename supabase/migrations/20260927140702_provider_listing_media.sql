insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

grant select, insert, update, delete on public.listing_images to authenticated;

create policy "Providers manage own listing images" on public.listing_images
  for all to authenticated
  using (
    exists (
      select 1
      from public.listings
      join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
      where listings.id = listing_images.listing_id
        and provider_profiles.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.listings
      join public.provider_profiles on provider_profiles.id = listings.provider_profile_id
      where listings.id = listing_images.listing_id
        and provider_profiles.user_id = (select auth.uid())
    )
  );

create policy "Authenticated users read published listing images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'listing-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or exists (
        select 1
        from public.listing_images
        join public.listings on listings.id = listing_images.listing_id
        where listing_images.image_url = storage.objects.name
          and listings.status = 'published'
          and listings.deleted_at is null
      )
    )
  );

create policy "Providers upload own listing images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Providers update own listing images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Providers delete own listing images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
