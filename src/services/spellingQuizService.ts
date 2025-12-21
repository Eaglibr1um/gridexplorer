import { supabase } from '../config/supabase';

export interface SpellingWord {
  id: string;
  word: string;
  hint: string;
  tuteeId: string;
  studentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpellingWordInput {
  word: string;
  hint: string;
  tuteeId: string;
  studentName?: string;
}

export interface UpdateSpellingWordInput {
  id: string;
  word?: string;
  hint?: string;
  tuteeId?: string;
  studentName?: string;
}

export interface SpellingQuestion {
  sentence: string;
  answer: string;
  hint: string;
}

export interface SpellingQuestionRecord {
  id: string;
  wordId: string;
  tuteeId: string;
  studentName?: string;
  sentence: string;
  answer: string;
  hint: string;
  status: 'draft' | 'confirmed' | 'active';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpellingQuestionInput {
  wordId: string;
  tuteeId: string;
  studentName?: string;
  sentence: string;
  answer: string;
  hint: string;
  status?: 'draft' | 'confirmed' | 'active';
}

/**
 * Fetch all spelling words
 */
export const fetchSpellingWords = async (tuteeId?: string, studentName?: string): Promise<SpellingWord[]> => {
  try {
    let query = supabase
      .from('spelling_words')
      .select('*')
      .order('word', { ascending: true });

    if (tuteeId) {
      query = query.eq('tutee_id', tuteeId);
    }
    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      word: item.word,
      hint: item.hint,
      tuteeId: item.tutee_id,
      studentName: item.student_name,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching spelling words:', error);
    throw error;
  }
};

/**
 * Create a new spelling word
 */
export const createSpellingWord = async (
  input: CreateSpellingWordInput
): Promise<SpellingWord> => {
  try {
    const { data, error } = await supabase
      .from('spelling_words')
      .insert({
        word: input.word.trim(),
        hint: input.hint.trim(),
        tutee_id: input.tuteeId,
        student_name: input.studentName,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      word: data.word,
      hint: data.hint,
      tuteeId: data.tutee_id,
      studentName: data.student_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating spelling word:', error);
    throw error;
  }
};

/**
 * Update a spelling word
 */
export const updateSpellingWord = async (
  input: UpdateSpellingWordInput
): Promise<SpellingWord> => {
  try {
    const updateData: any = {};
    if (input.word !== undefined) updateData.word = input.word.trim();
    if (input.hint !== undefined) updateData.hint = input.hint.trim();
    if (input.tuteeId !== undefined) updateData.tutee_id = input.tuteeId;
    if (input.studentName !== undefined) updateData.student_name = input.studentName;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('spelling_words')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      word: data.word,
      hint: data.hint,
      tuteeId: data.tutee_id,
      studentName: data.student_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating spelling word:', error);
    throw error;
  }
};

/**
 * Delete a spelling word
 */
export const deleteSpellingWord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('spelling_words')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting spelling word:', error);
    throw error;
  }
};

export interface WordStatistics {
  wordId: string;
  word: string;
  totalAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // percentage
  lastAttempted?: string;
}

export interface RecordWordAttemptInput {
  wordId: string;
  tuteeId: string;
  studentName?: string;
  isCorrect: boolean;
}

/**
 * Record a word attempt (correct or incorrect)
 */
export const recordWordAttempt = async (
  input: RecordWordAttemptInput
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('spelling_word_stats')
      .insert({
        word_id: input.wordId,
        tutee_id: input.tuteeId,
        student_name: input.studentName,
        is_correct: input.isCorrect,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording word attempt:', error);
    throw error;
  }
};

/**
 * Get statistics for all words for a student
 */
export const getWordStatistics = async (
  tuteeId: string,
  studentName?: string
): Promise<WordStatistics[]> => {
  try {
    // Get all words for the student
    const words = await fetchSpellingWords(tuteeId, studentName);
    
    // Get stats for each word
    const statsPromises = words.map(async (word) => {
      let query = supabase
        .from('spelling_word_stats')
        .select('*')
        .eq('word_id', word.id)
        .eq('tutee_id', tuteeId);

      if (studentName) {
        query = query.eq('student_name', studentName);
      }

      const { data, error } = await query;

      if (error) throw error;

      const attempts = data || [];
      const correctCount = attempts.filter(a => a.is_correct).length;
      const incorrectCount = attempts.filter(a => !a.is_correct).length;
      const totalAttempts = attempts.length;
      const accuracy = totalAttempts > 0 
        ? Math.round((correctCount / totalAttempts) * 100) 
        : 0;
      
      const lastAttempt = attempts.length > 0
        ? attempts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0].created_at
        : undefined;

      return {
        wordId: word.id,
        word: word.word,
        totalAttempts,
        correctCount,
        incorrectCount,
        accuracy,
        lastAttempted: lastAttempt,
      };
    });

    return Promise.all(statsPromises);
  } catch (error) {
    console.error('Error getting word statistics:', error);
    throw error;
  }
};

/**
 * Generate spelling questions using ChatGPT
 * Returns questions in a structured format for the quiz
 */
export const generateSpellingQuestions = async (
  words: string[],
  tuteeId: string,
  studentName?: string,
  count: number = 10
): Promise<SpellingQuestion[]> => {
  try {
    const { callChatGPT } = await import('./chatgptService');

    const systemPrompt = `You are a helpful assistant that creates Singapore primary school science spelling quiz questions. 
You must return your response as a valid JSON array only, with no additional text before or after.

Each question should be a fill-in-the-blank sentence where the blank is represented by "__________" (8 underscores).
The sentences should be appropriate for Singapore primary school students and involve science concepts.
The sentences should be clear, age-appropriate, and educational.`;

    const userPrompt = `Generate ${count} different fill-in-the-blank spelling questions for a Singapore primary school science quiz.

CRITICAL: You MUST ONLY use words from this specific list: ${words.join(', ')}
DO NOT generate questions for any other words. Each question's "answer" MUST be exactly one of the words from the list above.

For each word, create a sentence where the word fits naturally in the blank. Make sure:
1. The sentence is about science concepts appropriate for primary school
2. The blank is represented by "__________" (8 underscores)
3. Each sentence is different and educational
4. The sentences are clear and age-appropriate

Return ONLY a valid JSON array in this exact format:
[
  {
    "sentence": "Sentence with __________ blank",
    "answer": "word",
    "hint": "Brief helpful hint"
  },
  ...
]

Do not include any text before or after the JSON array. Return only the JSON array.`;

    const response = await callChatGPT({
      message: userPrompt,
      systemPrompt,
      model: 'gpt-4o-mini',
      temperature: 0.8, // Some creativity but not too random
    });

    // Parse the JSON response
    let questions: SpellingQuestion[];
    try {
      // Try to extract JSON from the response (in case GPT adds markdown or extra text)
      const jsonMatch = response.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(response.response);
      }
    } catch (parseError) {
      console.error('Error parsing ChatGPT response:', parseError);
      console.error('Response was:', response.response);
      throw new Error('Failed to parse ChatGPT response. Please try again.');
    }

    // Validate the structure
    if (!Array.isArray(questions)) {
      throw new Error('ChatGPT did not return a valid array');
    }

    // Validate each question has required fields
    questions = questions.filter((q) => {
      return q.sentence && q.answer && q.hint;
    });

    if (questions.length === 0) {
      throw new Error('No valid questions were generated');
    }

    return questions.slice(0, count); // Return up to requested count
  } catch (error) {
    console.error('Error generating spelling questions:', error);
    throw error;
  }
};

/**
 * Generate hints for a list of words using ChatGPT
 */
export const generateWordHints = async (
  words: string[]
): Promise<Record<string, string>> => {
  try {
    const { callChatGPT } = await import('./chatgptService');

    const systemPrompt = `You are a helpful assistant that creates Singapore primary school science spelling quiz hints. 
You must return your response as a valid JSON object only, where keys are the words and values are the hints.
The hints should be brief, educational, and appropriate for primary school students.
Do not include the word itself in the hint.`;

    const userPrompt = `Generate a brief science-related hint for each of these words: ${words.join(', ')}.
Return ONLY a valid JSON object where the keys are the words and the values are the hints.
Example: {"Skeleton": "The framework of bones that supports our body"}`;

    const response = await callChatGPT({
      message: userPrompt,
      systemPrompt,
      model: 'gpt-4o-mini',
      temperature: 0.5,
    });

    let hints: Record<string, string>;
    try {
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      hints = JSON.parse(jsonMatch ? jsonMatch[0] : response.response);
    } catch (parseError) {
      console.error('Error parsing ChatGPT hints response:', parseError);
      throw new Error('Failed to parse ChatGPT response for hints.');
    }

    return hints;
  } catch (error) {
    console.error('Error generating word hints:', error);
    throw error;
  }
};

/**
 * Save generated questions to database (as draft)
 */
export const saveGeneratedQuestions = async (
  questions: SpellingQuestion[],
  words: SpellingWord[],
  tuteeId: string,
  studentName?: string
): Promise<SpellingQuestionRecord[]> => {
  try {
    // First, deactivate all existing questions for this tutee/student
    let deactivateQuery = supabase
      .from('spelling_questions')
      .update({ status: 'draft' })
      .eq('tutee_id', tuteeId)
      .eq('status', 'active');

    if (studentName) {
      deactivateQuery = deactivateQuery.eq('student_name', studentName);
    }
    
    await deactivateQuery;

    // Match questions to words by answer, filtering out any rogue words
    const questionRecords = questions
      .map((q) => {
        const word = words.find(w => w.word.toLowerCase() === q.answer.toLowerCase());
        if (!word) {
          console.warn(`AI generated a question for a word not in our list: ${q.answer}. Skipping.`);
          return null;
        }
        return {
          word_id: word.id,
          tutee_id: tuteeId,
          student_name: studentName,
          sentence: q.sentence,
          answer: q.answer,
          hint: q.hint,
          status: 'draft' as const,
        };
      })
      .filter((q): q is any => q !== null);

    if (questionRecords.length === 0) {
      throw new Error('No valid questions matching your word bank were generated. Please try again.');
    }

    // Insert new questions
    const { data, error } = await supabase
      .from('spelling_questions')
      .insert(questionRecords)
      .select();

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      wordId: item.word_id,
      tuteeId: item.tutee_id,
      studentName: item.student_name,
      sentence: item.sentence,
      answer: item.answer,
      hint: item.hint,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error saving generated questions:', error);
    throw error;
  }
};

/**
 * Confirm and activate questions (set status to active)
 */
export const confirmQuestions = async (
  questionIds: string[]
): Promise<void> => {
  try {
    // First, deactivate all existing active questions for the same tutees/students
    const { data: questions } = await supabase
      .from('spelling_questions')
      .select('tutee_id, student_name')
      .in('id', questionIds);

    if (questions && questions.length > 0) {
      for (const q of questions) {
        let deactivateQuery = supabase
          .from('spelling_questions')
          .update({ status: 'draft' })
          .eq('tutee_id', q.tutee_id)
          .eq('status', 'active');

        if (q.student_name) {
          deactivateQuery = deactivateQuery.eq('student_name', q.student_name);
        }
        
        await deactivateQuery;
      }
    }

    // Activate the confirmed questions
    const { error } = await supabase
      .from('spelling_questions')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .in('id', questionIds);

    if (error) throw error;
  } catch (error) {
    console.error('Error confirming questions:', error);
    throw error;
  }
};

/**
 * Fetch active questions for a student (to use in quiz)
 */
export const fetchActiveQuestions = async (
  tuteeId: string,
  studentName?: string
): Promise<SpellingQuestion[]> => {
  try {
    let query = supabase
      .from('spelling_questions')
      .select('*')
      .eq('tutee_id', tuteeId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      sentence: item.sentence,
      answer: item.answer,
      hint: item.hint,
    }));
  } catch (error) {
    console.error('Error fetching active questions:', error);
    throw error;
  }
};

/**
 * Fetch active questions with full details (for editing)
 */
export const fetchActiveQuestionsWithDetails = async (
  tuteeId: string,
  studentName?: string
): Promise<SpellingQuestionRecord[]> => {
  try {
    let query = supabase
      .from('spelling_questions')
      .select('*')
      .eq('tutee_id', tuteeId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      wordId: item.word_id,
      tuteeId: item.tutee_id,
      studentName: item.student_name,
      sentence: item.sentence,
      answer: item.answer,
      hint: item.hint,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching active questions with details:', error);
    throw error;
  }
};

/**
 * Update a spelling question
 */
export const updateSpellingQuestion = async (
  id: string,
  updates: {
    sentence?: string;
    answer?: string;
    hint?: string;
  }
): Promise<SpellingQuestionRecord> => {
  try {
    const updateData: any = {};
    if (updates.sentence !== undefined) updateData.sentence = updates.sentence.trim();
    if (updates.answer !== undefined) updateData.answer = updates.answer.trim();
    if (updates.hint !== undefined) updateData.hint = updates.hint.trim();
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('spelling_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      wordId: data.word_id,
      student: data.student,
      sentence: data.sentence,
      answer: data.answer,
      hint: data.hint,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating spelling question:', error);
    throw error;
  }
};

/**
 * Delete a question
 */
export const deleteSpellingQuestion = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('spelling_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting spelling question:', error);
    throw error;
  }
};

