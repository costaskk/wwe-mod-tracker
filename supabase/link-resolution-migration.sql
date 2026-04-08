
-- Run this in Supabase SQL Editor on your existing database.
-- It keeps your data and only broadens update permissions so authenticated users
-- can fix download URLs and resolve link requests from the app.

drop policy if exists "Owners can update attires" on public.attires;
create policy "Authenticated can update attires" on public.attires
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Users can edit own requests" on public.mod_requests;
create policy "Authenticated can update requests" on public.mod_requests
for update
to authenticated
using (true)
with check (true);
