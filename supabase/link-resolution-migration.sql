
-- Non-destructive migration for community link fixing
-- Run this in Supabase SQL Editor on your existing project.

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
