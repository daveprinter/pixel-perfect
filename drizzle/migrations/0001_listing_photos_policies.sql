
create policy "listing photos read" on storage.objects for select to anon, authenticated using (bucket_id = 'listing-photos');
create policy "listing photos admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'listing-photos' and public.is_admin());
create policy "listing photos admin delete" on storage.objects for delete to authenticated using (bucket_id = 'listing-photos' and public.is_admin());
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.has_role(uuid, app_role) to anon, authenticated;
