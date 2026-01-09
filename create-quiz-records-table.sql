-- ============================================
-- CREATE SPELLING QUIZ RECORDS TABLE
-- ============================================

-- This table stores quiz history in Supabase instead of localStorage
-- Benefits:
-- - Never lose data
-- - Access from any device
-- - Better analytics
-- - Remote viewing for parents/teachers

CREATE TABLE IF NOT EXISTS spelling_quiz_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutee_id TEXT NOT NULL,
  student_name TEXT, -- 'rayne', 'jeffrey', or tutee name
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  time_spent INTEGER, -- Time spent in seconds
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  questions_attempted JSONB, -- Array of question IDs or words answered
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_quiz_records_tutee 
  ON spelling_quiz_records(tutee_id);

CREATE INDEX IF NOT EXISTS idx_quiz_records_student 
  ON spelling_quiz_records(tutee_id, student_name);

CREATE INDEX IF NOT EXISTS idx_quiz_records_created 
  ON spelling_quiz_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_records_tutee_student_date 
  ON spelling_quiz_records(tutee_id, student_name, created_at DESC);

-- Add RLS (Row Level Security) policies
ALTER TABLE spelling_quiz_records ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read quiz records (for public access)
CREATE POLICY "Allow public read access" 
  ON spelling_quiz_records 
  FOR SELECT 
  USING (true);

-- Policy: Anyone can insert quiz records
CREATE POLICY "Allow public insert" 
  ON spelling_quiz_records 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Anyone can update their own records (in case of corrections)
CREATE POLICY "Allow public update" 
  ON spelling_quiz_records 
  FOR UPDATE 
  USING (true);

-- Add helpful comment
COMMENT ON TABLE spelling_quiz_records IS 'Stores spelling quiz completion records for tracking student progress over time';

-- ============================================
-- VERIFY THE TABLE
-- ============================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'spelling_quiz_records'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'spelling_quiz_records';

-- Check policies
SELECT 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'spelling_quiz_records';

-- ============================================
-- SAMPLE QUERIES (after implementation)
-- ============================================

-- Get all quiz records for a student
/*
SELECT 
  id,
  student_name,
  score,
  total_questions,
  percentage,
  time_spent,
  created_at AT TIME ZONE 'Asia/Singapore' as quiz_date_sgt
FROM spelling_quiz_records
WHERE tutee_id = 'primary-school'
  AND student_name = 'rayne'
ORDER BY created_at DESC
LIMIT 10;
*/

-- Get average score over time
/*
SELECT 
  DATE(created_at AT TIME ZONE 'Asia/Singapore') as date,
  student_name,
  AVG(percentage) as avg_percentage,
  COUNT(*) as quiz_count
FROM spelling_quiz_records
WHERE tutee_id = 'primary-school'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at AT TIME ZONE 'Asia/Singapore'), student_name
ORDER BY date DESC;
*/

-- Get best score
/*
SELECT 
  student_name,
  MAX(percentage) as best_percentage,
  MAX(score) as best_score,
  COUNT(*) as total_attempts
FROM spelling_quiz_records
WHERE tutee_id = 'primary-school'
GROUP BY student_name;
*/

-- Get recent improvement trend
/*
WITH recent_quizzes AS (
  SELECT 
    student_name,
    percentage,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY student_name ORDER BY created_at DESC) as quiz_rank
  FROM spelling_quiz_records
  WHERE tutee_id = 'primary-school'
)
SELECT 
  student_name,
  AVG(CASE WHEN quiz_rank <= 5 THEN percentage END) as recent_5_avg,
  AVG(CASE WHEN quiz_rank > 5 AND quiz_rank <= 10 THEN percentage END) as previous_5_avg,
  AVG(CASE WHEN quiz_rank <= 5 THEN percentage END) - 
    AVG(CASE WHEN quiz_rank > 5 AND quiz_rank <= 10 THEN percentage END) as improvement
FROM recent_quizzes
GROUP BY student_name;
*/

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- After creating this table:
-- 1. Deploy the updated code that saves to Supabase
-- 2. Run migration script to import localStorage data (see migration code in app)
-- 3. Keep localStorage as backup for a few weeks
-- 4. Eventually remove localStorage code

-- ============================================
