/*
# Create Storage Bucket for Documents

1. New Storage
- `documents` bucket for KYC and startup document uploads
- Public access with ownership-based restrictions

2. Security
- RLS enabled on storage.objects
- Users can only upload to their own folder
- Admins can read all documents
*/

-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own folder
DROP POLICY IF EXISTS "users_upload_own_docs" ON storage.objects;
CREATE POLICY "users_upload_own_docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to read their own documents
DROP POLICY IF EXISTS "users_read_own_docs" ON storage.objects;
CREATE POLICY "users_read_own_docs" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own documents
DROP POLICY IF EXISTS "users_update_own_docs" ON storage.objects;
CREATE POLICY "users_update_own_docs" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own documents
DROP POLICY IF EXISTS "users_delete_own_docs" ON storage.objects;
CREATE POLICY "users_delete_own_docs" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow admins to read all documents
DROP POLICY IF EXISTS "admin_read_all_docs" ON storage.objects;
CREATE POLICY "admin_read_all_docs" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'reviewer'))
  );
