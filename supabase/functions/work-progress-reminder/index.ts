import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

webpush.setVapidDetails(
  'mailto:example@yourdomain.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Calculate current streak (simplified version)
async function calculateCurrentStreak(): Promise<number> {
  const { data, error } = await supabase
    .from('work_progress_daily_entries')
    .select('entry_date')
    .order('entry_date', { ascending: false });

  if (error || !data || data.length === 0) return 0;

  const uniqueDates = Array.from(new Set(data.map(entry => entry.entry_date)))
    .sort((a, b) => b.localeCompare(a));

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const mostRecentDate = uniqueDates[0];
  const isCurrentStreak = mostRecentDate === todayStr || mostRecentDate === yesterdayStr;

  if (!isCurrentStreak) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const prevDate = new Date(uniqueDates[i - 1]);
    const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Get motivational message based on streak
function getMotivationalMessage(streak: number, hasEntryToday: boolean): { title: string; body: string } {
  // If already logged today, send praise
  if (hasEntryToday) {
    const praiseMessages = [
      { title: `Amazing! ${streak} day streak! 🔥`, body: "You're crushing it! Keep up the great work!" },
      { title: `${streak} days strong! 💪`, body: "Your consistency is inspiring! See you tomorrow?" },
      { title: `Streak champion! ${streak} days 🏆`, body: "You're on fire! Tomorrow, let's make it even better!" },
      { title: `Legend! ${streak} day streak 🌟`, body: "Your dedication is paying off. Keep going!" }
    ];
    return praiseMessages[Math.floor(Math.random() * praiseMessages.length)];
  }

  // Milestone celebrations
  if (streak === 2) {
    return { title: "2 days in a row! 🎯", body: "You're building momentum! Don't break the chain now!" };
  }
  if (streak === 6) {
    return { title: "Almost a week! 🎉", body: "Just one more day to hit 7! You've got this!" };
  }
  if (streak === 6) {
    return { title: "One week streak! 🎊", body: "Amazing! Can you make it to 14? You're doing great!" };
  }
  if (streak === 13) {
    return { title: "2 weeks tomorrow! 🔥", body: "You're so close to a 14-day streak! Don't lose it now!" };
  }
  if (streak === 14) {
    return { title: "TWO WEEKS! 🏆", body: "Incredible consistency! Can you hit a month?" };
  }
  if (streak === 29) {
    return { title: "30 days tomorrow! 🚀", body: "You're ONE DAY away from a MONTH streak! Legendary!" };
  }
  if (streak >= 30) {
    return { title: `${streak} day streak! 🌟`, body: "You're absolutely incredible! Don't let this slip away!" };
  }

  // High streak (protect it!)
  if (streak >= 10) {
    const urgentMessages = [
      { title: `Don't lose your ${streak}-day streak! 🔥`, body: "You've worked too hard to give up now!" },
      { title: `${streak} days! Don't break the chain! ⛓️`, body: "Quick check-in = streak saved. You got this!" },
      { title: `Protect your ${streak}-day streak! 🛡️`, body: "Just a few minutes to keep your momentum going!" }
    ];
    return urgentMessages[Math.floor(Math.random() * urgentMessages.length)];
  }

  // Low streak (encourage)
  if (streak >= 3) {
    const encourageMessages = [
      { title: `${streak} days! Keep it going! 💪`, body: "You're building a great habit. Check in today!" },
      { title: `${streak}-day streak at risk! ⚠️`, body: "Don't let your progress slip away!" },
      { title: `You're on ${streak} days! 🌱`, body: "Your streak is growing! Water it today!" }
    ];
    return encourageMessages[Math.floor(Math.random() * encourageMessages.length)];
  }

  // New/broken streak (motivate)
  if (streak === 1) {
    return { title: "Keep yesterday's momentum! 🚀", body: "Day 2 starts now! Let's build that streak!" };
  }

  // No streak (gentle nudge)
  const newStreakMessages = [
    { title: "Ready to start a streak? 🔥", body: "Today could be day 1 of something great!" },
    { title: "Time to build momentum! 💫", body: "Every expert was once a beginner. Start today!" },
    { title: "Your future self will thank you! ✨", body: "Quick check-in now = progress tracked!" }
  ];
  return newStreakMessages[Math.floor(Math.random() * newStreakMessages.length)];
}

Deno.serve(async (req) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if there's an entry for today
    const { data: todayEntry, error: entryError } = await supabase
      .from('work_progress_daily_entries')
      .select('id')
      .eq('entry_date', todayStr)
      .single();
    
    const hasEntryToday = todayEntry && !entryError;
    
    // Calculate current streak
    const currentStreak = await calculateCurrentStreak();
    
    // Get all enabled notification subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('work_progress_notifications')
      .select('*')
      .eq('is_enabled', true);
    
    if (subsError) throw subsError;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No active subscriptions' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get personalized message
    const message = getMotivationalMessage(currentStreak, hasEntryToday);
    
    // Send notifications
    const results = [];
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: message.title,
            body: message.body,
            icon: '/icon-512.png',
            badge: '/badge-96.png',
            data: { 
              url: '/work-progress',
              streak: currentStreak,
              hasEntry: hasEntryToday
            },
            actions: [
              { action: 'open', title: 'Check In Now 📝' },
              { action: 'dismiss', title: 'Later' }
            ]
          })
        );
        results.push({ success: true, device: sub.device_fingerprint });
      } catch (e: any) {
        results.push({ success: false, error: e.message, device: sub.device_fingerprint });
        // Remove invalid subscriptions
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase
            .from('work_progress_notifications')
            .update({ is_enabled: false })
            .eq('id', sub.id);
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      streak: currentStreak,
      hasEntryToday,
      message,
      results 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in work-progress-reminder:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

