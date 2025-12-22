import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

webpush.setVapidDetails(
  'mailto:example@yourdomain.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const getNextReviewDate = (reviewCount: number, lastReviewed: string): Date => {
  const intervals = [1, 3, 7, 14, 30, 60, 90];
  const intervalIndex = Math.min(reviewCount, intervals.length - 1);
  const daysToAdd = intervals[intervalIndex];
  const lastDate = new Date(lastReviewed);
  lastDate.setDate(lastDate.getDate() + daysToAdd);
  return lastDate;
};

async function logNotification(params: {
  tuteeId: string, 
  title: string, 
  message: string, 
  type: string, 
  status: string, 
  deviceLabel?: string | null, 
  error?: string,
  triggeredBy?: string,
  triggeredFromDevice?: string
}) {
  try {
    await supabase.from('notification_logs').insert({
      tutee_id: params.tuteeId,
      title: params.title,
      message: params.message,
      type: params.type,
      status: params.status,
      device_label: params.deviceLabel,
      error_message: params.error,
      triggered_by: params.triggeredBy,
      triggered_from_device: params.triggeredFromDevice
    });
  } catch (err) {
    console.error('Failed to log notification:', err);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { test, type, tuteeId, subscriptionId, title, message, url, triggeredBy, triggeredFromDevice } = body;
    const now = new Date();

    // 1. Manual/Targeted Notifications
    if (test || type) {
      let query = supabase.from('push_subscriptions').select('*');
      
      // Targeting Logic
      if (subscriptionId) {
        // Target ONE specific device
        query = query.eq('id', subscriptionId);
      } else if (tuteeId) {
        // Target ALL devices for ONE student
        query = query.eq('tutee_id', tuteeId);
      }
      // If neither subscriptionId nor tuteeId is provided, it targets EVERYONE (Broadcast)

      const { data: subscriptions, error: subsError } = await query;
      if (subsError) throw subsError;

      const { data: tuteeList } = await supabase.from('tutees').select('id, name');
      const tuteeMap = Object.fromEntries((tuteeList || []).map(t => [t.id, t.name]));

      const results = [];
      for (const sub of subscriptions) {
        try {
          const name = sub.tutee_id === 'admin' ? 'Admin' : (tuteeMap[sub.tutee_id] || 'Student');
          const finalTitle = title || (test ? 'Test Notification! 🚀' : 'New Update! 🔔');
          const finalMessage = message || (test ? `Hello ${name}! This is a test push notification.` : 'You have a new update.');
          const finalType = type || (test ? 'test' : 'manual');

          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: finalTitle,
              body: finalMessage,
              data: { url: url || '/tuition' }
            })
          );
          results.push({ success: true, tutee: sub.tutee_id, device: sub.label });
          await logNotification({
            tuteeId: sub.tutee_id, 
            title: finalTitle, 
            message: finalMessage, 
            type: finalType, 
            status: 'sent', 
            deviceLabel: sub.label,
            triggeredBy,
            triggeredFromDevice
          });
        } catch (e) {
          results.push({ success: false, error: e.message });
          await logNotification({
            tuteeId: sub.tutee_id, 
            title: finalTitle, 
            message: finalMessage, 
            type: finalType, 
            status: 'failed', 
            deviceLabel: sub.label, 
            error: e.message,
            triggeredBy,
            triggeredFromDevice
          });
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
      return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // 2. Scheduled Spaced Repetition Reviews
    const { data: reviews, error: reviewsError } = await supabase.from('learning_point_reviews').select('*');
    if (reviewsError) throw reviewsError;

    const { data: tutees } = await supabase.from('tutees').select('id, name');
    const nameMap = Object.fromEntries((tutees || []).map(t => [t.id, t.name]));

    const notificationsSent = [];
    for (const review of reviews) {
      const nextReviewDate = getNextReviewDate(review.review_count, review.last_reviewed);
      if (nextReviewDate <= now) {
        const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('tutee_id', review.tutee_id);
        if (!subs) continue;

        const tuteeName = nameMap[review.tutee_id] || 'Student';
        const finalTitle = 'Review Time! 📚';
        const finalMessage = `Hey ${tuteeName}, time to review points from ${review.session_date}!`;

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify({
                title: finalTitle,
                body: finalMessage,
                data: { url: `/tuition?tuteeId=${review.tutee_id}&learningPoints=true` }
              })
            );
            notificationsSent.push({ tutee_id: review.tutee_id });
            await logNotification({
              tuteeId: review.tutee_id, 
              title: finalTitle, 
              message: finalMessage, 
              type: 'spaced_repetition', 
              status: 'sent', 
              deviceLabel: sub.label
            });
          } catch (e) {
            await logNotification({
              tuteeId: review.tutee_id, 
              title: finalTitle, 
              message: finalMessage, 
              type: 'spaced_repetition', 
              status: 'failed', 
              deviceLabel: sub.label, 
              error: e.message
            });
            if (e.statusCode === 410 || e.statusCode === 404) await supabase.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true, sentCount: notificationsSent.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
