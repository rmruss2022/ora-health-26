-- Migration 011: Voice logs session_id as TEXT
-- Frontend generates session IDs like "session-{timestamp}-{random}" which are not UUIDs

ALTER TABLE voice_conversation_logs
  ALTER COLUMN session_id TYPE TEXT USING session_id::text;
