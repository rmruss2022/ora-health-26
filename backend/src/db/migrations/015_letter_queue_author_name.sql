-- Add author_name to letter_queue for letters from community members
ALTER TABLE letter_queue ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
