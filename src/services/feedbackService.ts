import { supabase } from '../config/supabase';

/**
 * Feedback Service
 * Handles feedback, bug reports, and feature requests
 */

export interface Feedback {
  id: string;
  tuteeId: string;
  type: 'bug' | 'feature_request' | 'question' | 'other';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackInput {
  tuteeId: string;
  type: 'bug' | 'feature_request' | 'question' | 'other';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Create feedback
 */
export const createFeedback = async (
  input: CreateFeedbackInput
): Promise<Feedback> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        tutee_id: input.tuteeId,
        type: input.type,
        title: input.title,
        description: input.description,
        priority: input.priority || 'medium',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      type: data.type,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      adminNotes: data.admin_notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating feedback:', error);
    throw error;
  }
};

/**
 * Fetch feedback for a tutee
 */
export const fetchFeedback = async (tuteeId: string): Promise<Feedback[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      adminNotes: item.admin_notes || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
};

/**
 * Feedback with tutee information (for admin view)
 */
export interface FeedbackWithTutee extends Feedback {
  tuteeName: string;
  tuteeIcon?: string;
  tuteeColorScheme?: {
    primary: string;
    secondary: string;
    gradient: string;
  };
}

/**
 * Fetch all feedback (admin only)
 */
export const fetchAllFeedback = async (): Promise<FeedbackWithTutee[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        tutee:tutees (
          name,
          icon,
          color_primary,
          color_secondary,
          color_gradient
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      tuteeName: item.tutee?.name || 'Unknown',
      tuteeIcon: item.tutee?.icon || 'BookOpen',
      tuteeColorScheme: item.tutee ? {
        primary: item.tutee.color_primary || 'pink',
        secondary: item.tutee.color_secondary || 'purple',
        gradient: item.tutee.color_gradient || 'from-pink-500 to-purple-600',
      } : undefined,
      type: item.type,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      adminNotes: item.admin_notes || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    throw error;
  }
};

/**
 * Update feedback status and admin notes
 */
export interface UpdateFeedbackInput {
  id: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminNotes?: string;
  title?: string;
  description?: string;
  type?: 'bug' | 'feature_request' | 'question' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export const updateFeedback = async (
  input: UpdateFeedbackInput
): Promise<Feedback> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.adminNotes !== undefined) {
      updateData.admin_notes = input.adminNotes;
    }

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }

    const { data, error } = await supabase
      .from('feedback')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      type: data.type,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      adminNotes: data.admin_notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating feedback:', error);
    throw error;
  }
};

/**
 * Delete feedback
 */
export const deleteFeedback = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting feedback:', error);
    throw error;
  }
};

