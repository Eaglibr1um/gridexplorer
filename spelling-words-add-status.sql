-- ============================================
-- ADD STATUS COLUMN TO SPELLING WORDS
-- ============================================

-- Add status column to spelling_words table
ALTER TABLE spelling_words 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed'));

-- Set all existing words to 'active'
UPDATE spelling_words 
SET status = 'active' 
WHERE status IS NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_spelling_words_status ON spelling_words(status);

-- ============================================
-- VERIFY THE CHANGE
-- ============================================

-- Check the schema
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'spelling_words' 
  AND column_name = 'status';

-- Check existing words
SELECT 
  student_name,
  status,
  COUNT(*) as word_count
FROM spelling_words
GROUP BY student_name, status
ORDER BY student_name, status;

-- ============================================
