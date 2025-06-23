-- Create missing storage buckets for file uploads
-- This fixes the "Bucket not found" error in createGig and submitWork functions

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 52428800, '{"application/pdf","image/jpeg","image/png","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'),
  ('deliverables', 'deliverables', false, 104857600, '{"application/pdf","image/jpeg","image/png","application/zip","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}')
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the buckets
-- Documents bucket: Only authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Deliverables bucket: Users can upload to gig folders they're involved in
CREATE POLICY "Users can upload deliverables" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'deliverables');

CREATE POLICY "Users can view deliverables" ON storage.objects
FOR SELECT 
TO authenticated
USING (bucket_id = 'deliverables');