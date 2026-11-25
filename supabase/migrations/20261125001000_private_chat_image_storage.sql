-- Keep chat attachments private and restrict access to the two conversation participants.
-- File paths must follow: chat/<conversation_id>/<file_name>

UPDATE storage.buckets
SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'chat-images';

DROP POLICY IF EXISTS "Authenticated users can read chat images"
ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload chat images"
ON storage.objects;

CREATE POLICY "Conversation participants can read chat images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-images'
  AND (storage.foldername(name))[1] = 'chat'
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (c.bride_id = auth.uid() OR c.mua_id = auth.uid())
  )
);

CREATE POLICY "Conversation participants can upload chat images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-images'
  AND (storage.foldername(name))[1] = 'chat'
  AND EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id::text = (storage.foldername(name))[2]
      AND (c.bride_id = auth.uid() OR c.mua_id = auth.uid())
  )
);
