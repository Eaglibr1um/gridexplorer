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

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;
    const now = new Date();

    if (isTest) {
      console.log('Running in TEST mode - sending to all subscriptions');
      const { data: allSubs, error: allSubsError } = await supabase.from('push_subscriptions').select('*, tutees(name)');
      if (allSubsError) throw allSubsError;

      const results = [];
      for (const sub of allSubs) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: 'Test Notification! 🚀',
              body: `Hello ${sub.tutees?.name || 'Student'}! This is a test push notification.`,
              data: { url: '/tuition' }
            })
          );
          results.push({ success: true, tutee: sub.tutee_id });
        } catch (e) {
          results.push({ success: false, error: e.message });
        }
      }
      return new Response(JSON.stringify({ test_results: results }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // 1. Fetch all learning point reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from('learning_point_reviews')
      .select('*, tutees(name)');

    if (reviewsError) throw reviewsError;

    const notificationsSent = [];

    // 2. Filter due reviews
    for (const review of reviews) {
      const nextReviewDate = getNextReviewDate(review.review_count, review.last_reviewed);
      
      if (nextReviewDate <= now) {
        // This review is due. Get subscriptions for this tutee.
        const { data: subscriptions, error: subsError } = await supabase
          .from('push_subscriptions')
          .select('*')
          .eq('tutee_id', review.tutee_id);

        if (subsError) {
          console.error(`Error fetching subscriptions for ${review.tutee_id}:`, subsError);
          continue;
        }

        const tuteeName = review.tutees?.name || 'Student';

        // 3. Send notifications to all devices of this tutee
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              sub.subscription,
              JSON.stringify({
                title: 'Review Time! 📚',
                body: `Hey ${tuteeName}, it's time to review your learning points from ${review.session_date}!`,
                data: {
                  url: `/tuition?tuteeId=${review.tutee_id}&learningPoints=true`
                }
              })
            );
            notificationsSent.push({ tutee_id: review.tutee_id, session_date: review.session_date });
          } catch (pushError) {
            console.error(`Error sending push to ${review.tutee_id}:`, pushError);
            // If subscription is expired or invalid, delete it
            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${notificationsSent.length} notifications`,
        sent: notificationsSent
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-notifications function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

