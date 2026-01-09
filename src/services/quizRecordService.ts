import { supabase } from '../config/supabase';

export interface QuizRecord {
  id?: string;
  tuteeId: string;
  studentName?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent?: number; // in seconds
  startTime?: string;
  endTime?: string;
  questionsAttempted?: any[]; // Array of question data
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuizRecordInput {
  tuteeId: string;
  studentName?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpent?: number;
  startTime?: string;
  endTime?: string;
  questionsAttempted?: any[];
}

/**
 * Save a quiz record to Supabase
 */
export const saveQuizRecord = async (input: CreateQuizRecordInput): Promise<QuizRecord> => {
  try {
    const { data, error } = await supabase
      .from('spelling_quiz_records')
      .insert({
        tutee_id: input.tuteeId,
        student_name: input.studentName,
        score: input.score,
        total_questions: input.totalQuestions,
        percentage: input.percentage,
        time_spent: input.timeSpent,
        start_time: input.startTime,
        end_time: input.endTime,
        questions_attempted: input.questionsAttempted,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      studentName: data.student_name,
      score: data.score,
      totalQuestions: data.total_questions,
      percentage: data.percentage,
      timeSpent: data.time_spent,
      startTime: data.start_time,
      endTime: data.end_time,
      questionsAttempted: data.questions_attempted,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error saving quiz record:', error);
    throw error;
  }
};

/**
 * Fetch quiz records for a tutee/student
 */
export const fetchQuizRecords = async (
  tuteeId: string,
  studentName?: string,
  limit?: number
): Promise<QuizRecord[]> => {
  try {
    let query = supabase
      .from('spelling_quiz_records')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('created_at', { ascending: false });

    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      studentName: item.student_name,
      score: item.score,
      totalQuestions: item.total_questions,
      percentage: item.percentage,
      timeSpent: item.time_spent,
      startTime: item.start_time,
      endTime: item.end_time,
      questionsAttempted: item.questions_attempted,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching quiz records:', error);
    throw error;
  }
};

/**
 * Get best score for a student
 */
export const getBestScore = async (
  tuteeId: string,
  studentName?: string
): Promise<number | null> => {
  try {
    let query = supabase
      .from('spelling_quiz_records')
      .select('percentage')
      .eq('tutee_id', tuteeId)
      .order('percentage', { ascending: false })
      .limit(1);

    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data && data.length > 0 ? data[0].percentage : null;
  } catch (error) {
    console.error('Error fetching best score:', error);
    throw error;
  }
};

/**
 * Get total quiz attempts count
 */
export const getTotalAttempts = async (
  tuteeId: string,
  studentName?: string
): Promise<number> => {
  try {
    let query = supabase
      .from('spelling_quiz_records')
      .select('id', { count: 'exact', head: true })
      .eq('tutee_id', tuteeId);

    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Error fetching total attempts:', error);
    throw error;
  }
};

/**
 * Get average score over time
 */
export const getAverageScoreTrend = async (
  tuteeId: string,
  studentName?: string,
  days: number = 30
): Promise<{ date: string; avgPercentage: number; quizCount: number }[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('spelling_quiz_records')
      .select('percentage, created_at')
      .eq('tutee_id', tuteeId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (studentName) {
      query = query.eq('student_name', studentName);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Group by date
    const grouped: Record<string, { sum: number; count: number }> = {};
    
    (data || []).forEach((record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { sum: 0, count: 0 };
      }
      grouped[date].sum += record.percentage;
      grouped[date].count += 1;
    });

    return Object.entries(grouped).map(([date, { sum, count }]) => ({
      date,
      avgPercentage: Math.round(sum / count),
      quizCount: count,
    }));
  } catch (error) {
    console.error('Error fetching score trend:', error);
    throw error;
  }
};

/**
 * Migrate localStorage data to Supabase
 * Call this once after creating the table
 */
export const migrateLocalStorageToSupabase = async (tuteeId: string): Promise<void> => {
  try {
    const localKey = `spellingRecords_${tuteeId}`;
    const localData = localStorage.getItem(localKey);

    if (!localData) {
      console.log('No localStorage data to migrate');
      return;
    }

    const records = JSON.parse(localData);
    const migratedRecords: CreateQuizRecordInput[] = [];

    // Handle both old format (rayne/jeffrey split) and new format
    if (records.rayne || records.jeffrey) {
      // Old format for primary-school
      ['rayne', 'jeffrey'].forEach((studentName) => {
        const studentRecords = records[studentName] || [];
        studentRecords.forEach((record: any) => {
          migratedRecords.push({
            tuteeId,
            studentName,
            score: record.score,
            totalQuestions: record.total,
            percentage: record.percentage,
            timeSpent: record.timeSpent,
            startTime: record.startTime,
            endTime: record.endTime || record.timestamp,
          });
        });
      });
    } else if (Array.isArray(records)) {
      // New format (array of records)
      records.forEach((record: any) => {
        migratedRecords.push({
          tuteeId,
          studentName: record.student,
          score: record.score,
          totalQuestions: record.total,
          percentage: record.percentage,
          timeSpent: record.timeSpent,
          startTime: record.startTime,
          endTime: record.endTime || record.timestamp,
        });
      });
    }

    // Batch insert
    if (migratedRecords.length > 0) {
      console.log(`Migrating ${migratedRecords.length} records from localStorage...`);
      
      for (const record of migratedRecords) {
        await saveQuizRecord(record);
      }

      console.log(`✅ Successfully migrated ${migratedRecords.length} records!`);
      
      // Backup localStorage before clearing
      localStorage.setItem(`${localKey}_backup`, localData);
      console.log('💾 Backup saved to localStorage');
    }
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
    throw error;
  }
};
