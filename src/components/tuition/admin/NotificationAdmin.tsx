import { useState } from 'react';
import { Bell, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../../config/supabase';

const NotificationAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleTestNotification = async () => {
    try {
      setLoading(true);
      setStatus(null);

      const { data, error } = await supabase.functions.invoke('send-notifications', {
        body: { test: true },
      });

      if (error) throw error;

      const results = data.test_results || [];
      const successCount = results.filter((r: any) => r.success).length;
      const totalCount = results.length;

      setStatus({
        type: 'success',
        message: `Successfully sent ${successCount}/${totalCount} test notifications.`
      });
    } catch (err: any) {
      console.error('Failed to send test notification:', err);
      setStatus({
        type: 'error',
        message: err.message || 'Failed to trigger test notification.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Push Notifications</h2>
            <p className="text-gray-500 font-medium">Test and manage system reminders</p>
          </div>
        </div>

        <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
          <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-500" />
            System Test
          </h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Send a test push notification to <strong>all</strong> currently subscribed devices. 
            This is useful for verifying that your VAPID keys and Edge Function are working correctly.
          </p>

          <button
            onClick={handleTestNotification}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Triggering...</span>
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>Send Test Notification</span>
              </>
            )}
          </button>

          {status && (
            <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 animate-fade-in ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <p className="text-sm font-bold">{status.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationAdmin;

