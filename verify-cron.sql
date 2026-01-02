-- ============================================
-- VERIFICATION SCRIPT FOR WORK PROGRESS CRON
-- ============================================

-- 1. Check if the cron job exists and view its schedule
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job 
WHERE jobname = 'work-progress-daily-reminder';

-- Expected output:
-- You should see 1 row with:
-- - schedule: '0 12 * * *' (12 PM UTC = 8 PM SGT)
-- - active: true
-- - jobname: 'work-progress-daily-reminder'

-- ============================================

-- 2. Check the last run and next scheduled run
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'work-progress-daily-reminder')
ORDER BY start_time DESC 
LIMIT 5;

-- Expected output:
-- If it hasn't run yet: No rows (that's normal if you just set it up)
-- After it runs: You'll see entries with status and return_message

-- ============================================

-- 3. Check if any users have notifications enabled
SELECT 
  id,
  user_id,
  device_fingerprint,
  is_enabled,
  created_at,
  updated_at
FROM work_progress_notifications
WHERE is_enabled = true;

-- Expected output:
-- You should see at least 1 row if you've enabled notifications in the app
-- If empty: Enable notifications in the app first (click the bell icon)

-- ============================================

-- 4. Test the edge function manually (optional)
-- Run this in your terminal (not in SQL editor):
-- 
-- curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/work-progress-reminder \
--   -H "Authorization: Bearer YOUR_ANON_KEY" \
--   -H "Content-Type: application/json"
--
-- Replace YOUR_PROJECT_REF and YOUR_ANON_KEY with your actual values

-- ============================================

-- 5. If you need to update the schedule time:
-- Example: Change to 9 PM SGT (1 PM UTC)
-- 
-- SELECT cron.alter_job(
--   job_id := (SELECT jobid FROM cron.job WHERE jobname = 'work-progress-daily-reminder'),
--   schedule := '0 13 * * *'
-- );

-- ============================================

-- 6. If you need to unschedule (delete) the job:
-- 
-- SELECT cron.unschedule('work-progress-daily-reminder');

-- ============================================

-- TIMEZONE REFERENCE:
-- Singapore Time (SGT) = UTC+8
-- 6 PM SGT = 10 AM UTC = '0 10 * * *'
-- 7 PM SGT = 11 AM UTC = '0 11 * * *'
-- 8 PM SGT = 12 PM UTC = '0 12 * * *' ← CURRENT
-- 9 PM SGT = 1 PM UTC  = '0 13 * * *'
-- 10 PM SGT = 2 PM UTC = '0 14 * * *'

