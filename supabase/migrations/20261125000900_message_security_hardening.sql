-- Beaura message security hardening
-- Only authenticated participants can read or send messages.
-- Recipients may update only the is_read flag on messages sent by the other participant.

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Remove broad table and column privileges from browser roles.
REVOKE ALL PRIVILEGES (
  id, conversation_id, sender_id, content, created_at, seen, is_read, image_url
)
ON TABLE public.messages
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES
ON TABLE public.messages
FROM PUBLIC, anon, authenticated;

-- Browser clients can read messages and insert only the fields used by chat.
-- They cannot delete messages or update message content/ownership/timestamps.
GRANT SELECT
ON TABLE public.messages
TO authenticated;

GRANT INSERT (conversation_id, sender_id, content, image_url, is_read)
ON TABLE public.messages
TO authenticated;

GRANT UPDATE (is_read)
ON TABLE public.messages
TO authenticated;

-- Remove overlapping policies, including policies that checked only sender_id.
DROP POLICY IF EXISTS "Allow authenticated users to send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "messages insert" ON public.messages;

DROP POLICY IF EXISTS "Bride can read messages" ON public.messages;
DROP POLICY IF EXISTS "MUA can read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Users see own messages" ON public.messages;
DROP POLICY IF EXISTS "messages select" ON public.messages;

DROP POLICY IF EXISTS "Sender can update read state" ON public.messages;

-- One clear read policy: either participant in the conversation can view messages.
CREATE POLICY "Conversation participants can read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations AS c
    WHERE c.id = messages.conversation_id
      AND (c.bride_id = (SELECT auth.uid()) OR c.mua_id = (SELECT auth.uid()))
  )
);

-- A sender can insert only as themselves and only into their own conversation.
CREATE POLICY "Conversation participants can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.conversations AS c
    WHERE c.id = messages.conversation_id
      AND (c.bride_id = (SELECT auth.uid()) OR c.mua_id = (SELECT auth.uid()))
  )
);

-- A participant can mark the other participant's message as read, but cannot
-- change read state on their own messages or revert a message to unread.
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  sender_id <> (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.conversations AS c
    WHERE c.id = messages.conversation_id
      AND (c.bride_id = (SELECT auth.uid()) OR c.mua_id = (SELECT auth.uid()))
  )
)
WITH CHECK (
  sender_id <> (SELECT auth.uid())
  AND is_read IS TRUE
  AND EXISTS (
    SELECT 1
    FROM public.conversations AS c
    WHERE c.id = messages.conversation_id
      AND (c.bride_id = (SELECT auth.uid()) OR c.mua_id = (SELECT auth.uid()))
  )
);
