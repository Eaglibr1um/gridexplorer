import { supabase } from '../config/supabase';
import { callChatGPT } from './chatgptService';

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
 * Generate questions from learning points using GPT
 */
export const generateReviewQuestions = async (
  tuteeName: string,
  tuteeDescription: string,
  learningPoints: string[]
): Promise<string[]> => {
  try {
    const systemPrompt = `You are an educational assistant. Your goal is to help a student named ${tuteeName} who is studying ${tuteeDescription}.
Based on the provided learning points from their recent session, generate exactly ONE thoughtful review question for each learning point.
Each question should encourage the student to explain or apply what they learned.
Return ONLY a JSON array of strings, where each string is a question. No other text.`;

    const userPrompt = `Learning points:
${learningPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Generate one question for each learning point above. Return as a JSON array of strings.`;

    const response = await callChatGPT({
      message: userPrompt,
      systemPrompt,
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    let questions: string[] = [];
    try {
      const jsonMatch = response.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(response.response);
      }
    } catch (e) {
      console.error('Error parsing GPT response for questions:', e);
      throw new Error('Failed to generate review questions.');
    }

    return questions;
  } catch (error) {
    console.error('Error in generateReviewQuestions:', error);
    throw error;
  }
};

/**
 * Verify student's review answers using GPT
 */
export interface VerificationResult {
  isProper: boolean;
  feedback: string[]; // Feedback/Add-ons for each answer
  canMarkAsReviewed: boolean;
}

export const verifyReviewAnswers = async (
  tuteeName: string,
  tuteeDescription: string,
  questions: string[],
  answers: string[]
): Promise<VerificationResult> => {
  try {
    const systemPrompt = `You are an educational assistant for ${tuteeName} (${tuteeDescription}).
Evaluate the student's answers to the review questions.
For each answer:
1. Check if it correctly addresses the question.
2. Provide a short correction or "add-on" information to deepen their understanding.
3. Determine if the overall set of answers is "properly" completed. If the student gives lazy, nonsensical, or clearly incorrect answers, do not allow them to pass.

Return your response ONLY as a JSON object in this format:
{
  "isProper": boolean,
  "feedback": ["feedback for answer 1", "feedback for answer 2", ...],
  "canMarkAsReviewed": boolean
}
No other text.`;

    const qaPairs = questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n');
    const userPrompt = `Evaluate these review answers:\n\n${qaPairs}`;

    const response = await callChatGPT({
      message: userPrompt,
      systemPrompt,
      model: 'gpt-4o-mini',
      temperature: 0.5,
    });

    try {
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(response.response);
      }
    } catch (e) {
      console.error('Error parsing GPT verification response:', e);
      throw new Error('Failed to verify answers.');
    }
  } catch (error) {
    console.error('Error in verifyReviewAnswers:', error);
    throw error;
  }
};

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

