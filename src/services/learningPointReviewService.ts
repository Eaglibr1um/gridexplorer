import { supabase } from '../config/supabase';

/**
 * Learning Point Review Service
 * Handles spaced repetition review data in Supabase
 */

export interface LearningPointReview {
  id: string;
  tuteeId: string;
  sessionDate: string; // ISO date string (YYYY-MM-DD)
  lastReviewed: string; // ISO datetime string
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrUpdateReviewInput {
  tuteeId: string;
  sessionDate: string;
  lastReviewed: string;
  reviewCount: number;
}

/**
 * Fetch all reviews for a tutee
 */
export const fetchLearningPointReviews = async (
  tuteeId: string
): Promise<LearningPointReview[]> => {
  try {
    const { data, error } = await supabase
      .from('learning_point_reviews')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('session_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      sessionDate: item.session_date,
      lastReviewed: item.last_reviewed,
      reviewCount: item.review_count,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching learning point reviews:', error);
    throw error;
  }
};

/**
 * Create or update a review record
 */
export const upsertLearningPointReview = async (
  input: CreateOrUpdateReviewInput
): Promise<LearningPointReview> => {
  try {
    // First, check if a review exists for this tutee and session date
    const { data: existing } = await supabase
      .from('learning_point_reviews')
      .select('*')
      .eq('tutee_id', input.tuteeId)
      .eq('session_date', input.sessionDate)
      .single();

    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from('learning_point_reviews')
        .update({
          last_reviewed: input.lastReviewed,
          review_count: input.reviewCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tuteeId: data.tutee_id,
        sessionDate: data.session_date,
        lastReviewed: data.last_reviewed,
        reviewCount: data.review_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('learning_point_reviews')
        .insert({
          tutee_id: input.tuteeId,
          session_date: input.sessionDate,
          last_reviewed: input.lastReviewed,
          review_count: input.reviewCount,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        tuteeId: data.tutee_id,
        sessionDate: data.session_date,
        lastReviewed: data.last_reviewed,
        reviewCount: data.review_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }
  } catch (error) {
    console.error('Error upserting learning point review:', error);
    throw error;
  }
};

/**
 * Delete a review record
 */
export const deleteLearningPointReview = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('learning_point_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting learning point review:', error);
    throw error;
  }
};

