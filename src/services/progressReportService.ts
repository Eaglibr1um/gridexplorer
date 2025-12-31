import { supabase } from '../config/supabase';
import { callChatGPT } from './chatgptService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

export interface ProgressReportData {
  tuteeName: string;
  tuteeDescription: string;
  sessions: any[];
  learningPoints: any[];
  aiReviews: any[];
  quizStats: {
    spelling: any[];
    // Chemistry is currently in localStorage, so we'll pass it from the component if available
  };
  worksheets: any[];
}

/**
 * Fetch all necessary data for a progress report
 */
export const fetchReportData = async (tuteeId: string, days: number = 30): Promise<ProgressReportData> => {
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

  // 1. Fetch Tutee Info
  const { data: tutee } = await supabase
    .from('tutees')
    .select('*')
    .eq('id', tuteeId)
    .single();

  // 2. Fetch Sessions
  const { data: sessions } = await supabase
    .from('tuition_sessions')
    .select('*')
    .eq('tutee_id', tuteeId)
    .gte('session_date', startDate)
    .order('session_date', { ascending: false });

  // 3. Fetch Learning Points
  const { data: learningPoints } = await supabase
    .from('learning_points')
    .select('*')
    .eq('tutee_id', tuteeId)
    .gte('session_date', startDate)
    .order('session_date', { ascending: false });

  // 4. Fetch AI Reviews
  const { data: aiReviews } = await supabase
    .from('learning_point_reviews')
    .select('*')
    .eq('tutee_id', tuteeId)
    .gte('session_date', startDate)
    .order('last_reviewed', { ascending: false });

  // 5. Fetch Spelling Quiz Stats
  const { data: spellingStats } = await supabase
    .from('spelling_word_stats')
    .select(`
      *,
      spelling_words (word)
    `)
    .eq('tutee_id', tuteeId)
    .gte('created_at', format(subDays(new Date(), days), "yyyy-MM-dd'T'HH:mm:ss"))
    .order('created_at', { ascending: false });

  // 6. Fetch Worksheets
  const { data: worksheets } = await supabase
    .from('worksheets')
    .select('*')
    .eq('tutee_id', tuteeId)
    .gte('updated_at', format(subDays(new Date(), days), "yyyy-MM-dd'T'HH:mm:ss"))
    .order('updated_at', { ascending: false });

  return {
    tuteeName: tutee?.name || 'Student',
    tuteeDescription: tutee?.description || '',
    sessions: sessions || [],
    learningPoints: learningPoints || [],
    aiReviews: aiReviews || [],
    quizStats: {
      spelling: spellingStats || [],
    },
    worksheets: worksheets || [],
  };
};

/**
 * Generate the report using GPT
 */
export const generateAIReport = async (data: ProgressReportData, customNotes: string = ''): Promise<string> => {
  const sessionSummary = data.sessions.map(s => 
    `- ${format(new Date(s.session_date), 'MMM d')}: ${s.duration_hours}h`
  ).join('\n');

  const topicsSummary = data.learningPoints.map(lp => 
    `- ${format(new Date(lp.session_date), 'MMM d')}: ${lp.points}`
  ).join('\n');

  const reviewSummary = data.aiReviews.map(r => {
    const history = r.review_history ? r.review_history.length : 0;
    return `- Session ${r.session_date}: ${r.review_count} review(s) completed. ${history > 0 ? 'Detailed AI feedback recorded.' : ''}`;
  }).join('\n');

  const spellingPerformance = data.quizStats.spelling.length > 0 
    ? `${data.quizStats.spelling.filter(s => s.is_correct).length}/${data.quizStats.spelling.length} words correct in recent practice.`
    : 'No recent spelling quiz data.';

  const worksheetSummary = data.worksheets.map(w => 
    `- ${w.worksheet_name}: ${w.status} (${w.completion_percentage}%)`
  ).join('\n');

  const systemPrompt = `You are an expert Educational Consultant and Private Tutor. Your task is to write a monthly progress report for a parent based on raw student data. 

TONE: Professional, data-driven, encouraging, and highly personalized. Avoid generic praise; focus on specific achievements and areas for growth.

REPORT STRUCTURE:
1. Executive Summary: A 2-3 sentence overview of the month.
2. Academic Highlights: Specific topics mastered and performance summary.
3. Engagement & Learning Habits: Comment on their consistency with AI reviews and practice habits.
4. Strategic Focus: 1-2 specific areas to target in the coming month.
5. Personal Note to Student: A short, motivating message.

FORMATTING: 
Use professional headers and bullet points. Use emojis sparingly but effectively (e.g., 📈, 🧠, 🎯).
Return ONLY the report text.`;

  const userPrompt = `
STUDENT PROFILE:
- Name: ${data.tuteeName}
- Level/Level: ${data.tuteeDescription}

DATA FOR LAST 30 DAYS:
- Attendance: ${data.sessions.length} sessions
${sessionSummary}

- Topics Covered:
${topicsSummary}

- AI Review Interaction:
${reviewSummary}

- Quiz Performance:
${spellingPerformance}

- Worksheet Progress:
${worksheetSummary}

${customNotes ? `- Tutor's Custom Notes: ${customNotes}` : ''}

Generate a professional progress report for the parent.`;

  try {
    const response = await callChatGPT({
      message: userPrompt,
      systemPrompt,
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    return response.response;
  } catch (error) {
    console.error('Error generating AI report:', error);
    throw new Error('Failed to generate AI progress report.');
  }
};

