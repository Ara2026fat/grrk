-- =====================================================================
-- GRRK — Row Level Security
--
-- IMPORTANT CONTEXT: Supabase Auth is not yet wired into this
-- application. Authentication is currently a client-side-only stub
-- (src/services/auth/authContext.ts — isAuthenticated()/currentUser()),
-- NOT enforced by Postgres/Supabase at the database level. Blueprint
-- Section 12 explicitly documents this as a known, intentional interim
-- state ("stubbed single-role gate from day one"), and the project's
-- own audit log records this as an unresolved item ("authorization is
-- not enforced anywhere in the application").
--
-- Enabling RLS with a permissive "allow all" policy below matches the
-- application's REAL current security posture — it does not pretend to
-- add protection that doesn't actually exist yet. When real Supabase
-- Auth is introduced, these policies must be revisited and narrowed
-- (e.g. scoped to auth.uid(), role claims, etc.) — tracked as a
-- Missing Design Decision.
-- =====================================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'masterData',
      'companies',
      'organizations',
      'contacts',
      'persons',
      'attachments',
      'documents',
      'communicationEntries',
      'conversations',
      'messages',
      'notifications',
      'auditLog'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "allow_all" on %I;', t);
    execute format(
      'create policy "allow_all" on %I for all using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------
-- Storage: attachments bucket (AttachmentRepository.ts uploads/
-- downloads/removes directly against storage.objects).
-- -----------------------------------------------------------------
drop policy if exists "attachments_allow_all" on storage.objects;
create policy "attachments_allow_all" on storage.objects
  for all using (bucket_id = 'attachments')
  with check (bucket_id = 'attachments');
