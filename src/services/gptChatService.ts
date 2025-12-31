import { supabase } from '../config/supabase';

export interface ChatHistoryEntry {
  id: string;
  tuteeId: string;
  question: string;
  answer: string;
  prompt: string;
  createdAt: string;
}

/**
 * Save a chat entry to the history
 */
export const saveChatEntry = async (
  tuteeId: string,
  question: string,
  answer: string,
  prompt: string
): Promise<ChatHistoryEntry> => {
  try {
    const { data, error } = await supabase
      .from('gpt_chat_history')
      .insert({
        tutee_id: tuteeId,
        question,
        answer,
        prompt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      question: data.question,
      answer: data.answer,
      prompt: data.prompt,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error saving chat entry:', error);
    throw error;
  }
};

/**
 * Fetch chat history for all tutees (for admin)
 */
export const fetchAllChatHistory = async (): Promise<(ChatHistoryEntry & { tutee_name: string; tutee_icon: string; tutee_color: string })[]> => {
  try {
    const { data, error } = await supabase
      .from('gpt_chat_history')
      .select(`
        *,
        tutee:tutees(name, icon, color_gradient)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      question: item.question,
      answer: item.answer,
      prompt: item.prompt,
      createdAt: item.created_at,
      tutee_name: item.tutee?.name || 'Unknown',
      tutee_icon: item.tutee?.icon || 'User',
      tutee_color: item.tutee?.color_gradient || 'from-gray-400 to-gray-500',
    }));
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};
