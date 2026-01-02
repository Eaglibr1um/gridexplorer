# Work Progress Tracker - Daily Reminder Notifications

## Overview
The work progress tracker now sends daily reminder notifications at 8pm to users who have enabled notifications, if they haven't filled their entry for the day.

## Setup

### 1. Deploy Edge Function
Deploy the `work-progress-reminder` edge function to Supabase:

```bash
supabase functions deploy work-progress-reminder
```

### 2. Schedule the Function
You need to set up a cron job to call this function daily at 8pm. You can do this in several ways:

#### Option A: Using Supabase Cron (pg_cron extension)
If you have pg_cron enabled, you can schedule it directly in the database:

```sql
SELECT cron.schedule(
  'work-progress-daily-reminder',
  '0 20 * * *', -- 8pm every day (UTC)
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

#### Option B: Using External Cron Service
Use a service like:
- **Vercel Cron Jobs** (if deployed on Vercel)
- **GitHub Actions** (scheduled workflows)
- **Cloudflare Workers** (scheduled events)
- **Any cron service** that can make HTTP requests

Example cron expression: `0 20 * * *` (8pm UTC daily)

#### Option C: Using Supabase Database Webhooks
Set up a database webhook that triggers on a scheduled basis (requires additional setup).

### 3. Environment Variables
Make sure the edge function has access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

These should be set automatically when deploying via Supabase CLI, or manually in the Supabase dashboard.

## How It Works

1. **Daily Check**: The function runs at 8pm (or your scheduled time)
2. **Entry Check**: Checks if an entry exists for today's date
3. **Notification**: If no entry exists, sends push notifications to all users with:
   - Notifications enabled in the work tracker
   - Active push subscriptions
4. **Cleanup**: Automatically removes invalid/expired subscriptions

## User Flow

1. User opens work progress tracker
2. User clicks the notification toggle button
3. Browser requests notification permission
4. If granted, subscription is saved to `work_progress_notifications` table
5. User receives daily reminders at 8pm if they haven't logged today's progress

## Testing

You can manually trigger the function to test:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/work-progress-reminder \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Or use the Supabase dashboard to invoke the function directly.

## Troubleshooting

### Notifications Not Sending
- Check that the function is scheduled correctly
- Verify VAPID keys are set correctly
- Check browser console for subscription errors
- Verify `work_progress_notifications` table has enabled subscriptions

### Time Zone Issues
The function uses UTC time. If you want 8pm in a specific timezone:
- Adjust the cron schedule accordingly
- Or modify the function to check timezone-specific times

### Invalid Subscriptions
The function automatically removes subscriptions that return 410 (Gone) or 404 (Not Found) errors, which happens when:
- User uninstalls the app
- Browser clears service worker data
- Subscription expires

## Future Enhancements
- Customizable reminder time per user
- Multiple reminders per day
- Reminder frequency settings (daily, weekly, etc.)
- Reminder content customization

