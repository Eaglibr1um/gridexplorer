# Work Progress Notification Setup Guide

## 🔔 Daily Reminders at 8 PM SGT

Your work progress tracker now sends motivational notifications at **8:00 PM Singapore Time** every day!

## 📋 Setup Instructions

### Step 1: Deploy the Edge Function

```bash
cd /path/to/gridexplorer
supabase functions deploy work-progress-reminder
```

### Step 2: Set Up Cron Job in Supabase

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the function to run at 8 PM SGT (12 PM UTC)
-- SGT is UTC+8, so 8 PM SGT = 12 PM UTC
SELECT cron.schedule(
  'work-progress-daily-reminder',
  '0 12 * * *', -- Every day at 12:00 PM UTC (8:00 PM SGT)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/work-progress-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference (found in project URL)
- `YOUR_SERVICE_ROLE_KEY` with your service role key (Settings → API → service_role)

### Step 3: Verify the Cron Job

Check if it's scheduled:

```sql
SELECT * FROM cron.job;
```

You should see `work-progress-daily-reminder` in the list.

### Step 4: Test Manually (Optional)

Test the function immediately without waiting for 8 PM:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/work-progress-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 🎯 How It Works

1. **Every day at 8 PM SGT**, the cron job triggers the edge function
2. The function **calculates your current streak**
3. It **checks if you've logged today**
4. It sends a **personalized motivational message** based on:
   - Your streak length
   - Whether you've logged today
   - Milestone achievements
5. If you've already logged, you get **praise** instead of a reminder!

## 📱 Notification Types

### No Streak
- "Ready to start a streak? 🔥"
- "Time to build momentum! 💫"

### Building (1-2 days)
- "Keep yesterday's momentum! 🚀"
- "2 days in a row! 🎯"

### Growing (3-9 days)
- "X days! Keep it going! 💪"
- "Your streak is growing! 🌱"

### Strong (10+ days)
- "Don't lose your X-day streak! 🔥"
- "Protect your X-day streak! 🛡️"

### Milestones
- Day 7: "One week streak! 🎊"
- Day 14: "TWO WEEKS! 🏆"
- Day 30: "30 day streak! 🌟"

### Already Logged (Praise)
- "Amazing! X day streak! 🔥"
- "Streak champion! X days 🏆"
- "You're crushing it! 💪"

## 🔧 Troubleshooting

### Notifications not sending?

1. **Check cron job is active:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'work-progress-daily-reminder';
   ```

2. **Check function logs:**
   - Go to Supabase Dashboard → Edge Functions → work-progress-reminder → Logs

3. **Verify subscriptions exist:**
   ```sql
   SELECT * FROM work_progress_notifications WHERE is_enabled = true;
   ```

4. **Test function manually:**
   ```bash
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/work-progress-reminder \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

### Wrong timezone?

The cron is set for **12 PM UTC = 8 PM SGT**.

If you need a different time:
- 7 PM SGT = `0 11 * * *` (11 AM UTC)
- 9 PM SGT = `0 13 * * *` (1 PM UTC)

Update the cron schedule:
```sql
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'work-progress-daily-reminder'),
  schedule := '0 13 * * *' -- New time
);
```

### Delete/Recreate cron job

```sql
-- Delete existing
SELECT cron.unschedule('work-progress-daily-reminder');

-- Create new one
SELECT cron.schedule(...); -- Use the schedule command from Step 2
```

## 🎨 Features

✅ **Streak-aware messages** - Different messages based on your progress  
✅ **Milestone celebrations** - Special messages at 7, 14, 30 days  
✅ **Praise when logged** - Positive reinforcement  
✅ **Loss aversion** - "Don't lose your streak!" for high streaks  
✅ **Random variety** - Multiple messages per category  
✅ **Rich notifications** - Action buttons and icons  
✅ **Auto-cleanup** - Removes invalid subscriptions  

## 📊 Monitoring

Check notification stats:
```sql
SELECT 
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE is_enabled = true) as active_subscriptions
FROM work_progress_notifications;
```

View recent function invocations in Supabase Dashboard → Edge Functions → work-progress-reminder → Invocations

## 🚀 Next Steps

1. Deploy the function
2. Set up the cron job
3. Enable notifications in the app (click the bell icon)
4. Wait for 8 PM or test manually
5. Enjoy motivational reminders! 🎉

---

**Note:** Users control notifications via the bell button in the app. When enabled, they'll receive reminders at 8 PM SGT daily.

