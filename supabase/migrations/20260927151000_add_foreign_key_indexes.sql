create index if not exists bookings_listing_id_idx on public.bookings(listing_id);
create index if not exists conversations_listing_id_idx on public.conversations(listing_id);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists notifications_booking_id_idx on public.notifications(booking_id);
create index if not exists notifications_conversation_id_idx on public.notifications(conversation_id);
