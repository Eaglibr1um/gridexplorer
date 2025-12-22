import { supabase } from '../config/supabase';
import { VAPID_PUBLIC_KEY } from '../config/notification';

/**
 * Utility to convert base64 VAPID key to UInt8Array
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationService = {
  /**
   * Check if push notifications are supported
   */
  isSupported: () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  /**
   * Check if the device is iOS
   */
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  },

  /**
   * Check if the app is running in standalone mode (Added to Home Screen)
   */
  isStandalone: () => {
    return (window.matchMedia('(display-mode: standalone)').matches) || ((navigator as any).standalone);
  },

  /**
   * Get current notification permission status
   */
  getPermissionStatus: () => {
    return Notification.permission;
  },

  /**
   * Register service worker and subscribe to push
   */
  subscribeUser: async (tuteeId: string) => {
    if (!notificationService.isSupported()) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied.');
      }

      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);

      // Save subscription to Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          tutee_id: tuteeId,
          endpoint: subscription.endpoint,
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
          is_enabled: true, // Always re-enable if user explicitly subscribes again
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'tutee_id,endpoint'
        });

      if (error) throw error;

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  },

  /**
   * Unsubscribe user
   */
  unsubscribeUser: async (tuteeId: string) => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();
          
          // Remove from Supabase using the endpoint
          const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('tutee_id', tuteeId)
            .eq('endpoint', endpoint);
            
          if (error) throw error;
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  },

  /**
   * Check if user is already subscribed for a specific tuteeId
   */
  isSubscribed: async (tuteeId: string) => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    // Check if this specific tutee has this endpoint registered and enabled in Supabase
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('tutee_id', tuteeId)
      .eq('endpoint', subscription.endpoint)
      .eq('is_enabled', true)
      .maybeSingle();

    if (error) {
      console.error('Error checking subscription in database:', error);
      return false;
    }

    return !!data;
  },

  /**
   * Send a notification via the edge function
   */
  notify: async (params: {
    type: string;
    tuteeId?: string;
    title: string;
    message: string;
    url?: string;
  }) => {
    try {
      const { error } = await supabase.functions.invoke('send-notifications', {
        body: params,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
};

