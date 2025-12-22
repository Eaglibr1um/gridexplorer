import { supabase } from '../config/supabase';
import { notificationService } from './notificationService';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export const messagingService = {
  /**
   * Fetch conversation between a specific tutee and admin
   */
  fetchConversation: async (tuteeId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${tuteeId},receiver_id.eq.admin),and(sender_id.eq.admin,receiver_id.eq.${tuteeId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  /**
   * Send a message
   */
  sendMessage: async (senderId: string, receiverId: string, content: string, senderName: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger Notification
      await notificationService.notify({
        type: 'new_message',
        tuteeId: receiverId,
        title: senderId === 'admin' ? 'New Message from Admin! 💬' : `New Message from ${senderName}! 💬`,
        message: content.length > 50 ? content.substring(0, 47) + '...' : content,
        url: '/tuition'
      });

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (tuteeId: string, role: 'admin' | 'tutee') => {
    try {
      const query = supabase.from('messages').update({ is_read: true });
      
      if (role === 'admin') {
        // Admin marks student messages as read
        await query.eq('sender_id', tuteeId).eq('receiver_id', 'admin');
      } else {
        // Student marks admin messages as read
        await query.eq('sender_id', 'admin').eq('receiver_id', tuteeId);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  /**
   * Get unread count for a receiver
   */
  getUnreadCount: async (receiverId: string, senderId?: string): Promise<number> => {
    try {
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', receiverId)
        .eq('is_read', false);

      if (senderId) {
        query = query.eq('sender_id', senderId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
};

