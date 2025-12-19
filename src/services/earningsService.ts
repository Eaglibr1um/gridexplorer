import { supabase } from '../config/supabase';
import { EarningsSettings, EarningsRecord, TuitionSession } from '../types/tuition';

/**
 * Earnings Service
 * Handles all tuition earnings-related operations with Supabase
 */

export interface CreateEarningsSettingsInput {
  tuteeId: string;
  messageTemplate?: string;
  feePerHour?: number;
  feePerSession?: number;
  calculationType?: 'hourly' | 'per_session';
}

export interface UpdateEarningsSettingsInput {
  id: string;
  messageTemplate?: string;
  feePerHour?: number;
  feePerSession?: number;
  calculationType?: 'hourly' | 'per_session';
}

export interface CreateTuitionSessionInput {
  tuteeId: string;
  sessionDate: string; // ISO date string
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  durationHours: number;
  amount: number;
  earningsRecordId?: string;
  availableDateId?: string; // Links to available_dates table
}

export interface UpdateTuitionSessionInput {
  id: string;
  sessionDate?: string;
  startTime?: string;
  endTime?: string;
  durationHours?: number;
  amount?: number;
  earningsRecordId?: string;
  availableDateId?: string;
}

/**
 * Fetch earnings settings for a tutee
 */
export const fetchEarningsSettings = async (tuteeId: string): Promise<EarningsSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('tuition_earnings_settings')
      .select('*')
      .eq('tutee_id', tuteeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      messageTemplate: data.message_template,
      feePerHour: parseFloat(data.fee_per_hour),
      feePerSession: data.fee_per_session ? parseFloat(data.fee_per_session) : undefined,
      calculationType: data.calculation_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error fetching earnings settings:', error);
    throw error;
  }
};

/**
 * Create or update earnings settings for a tutee
 */
export const upsertEarningsSettings = async (
  input: CreateEarningsSettingsInput
): Promise<EarningsSettings> => {
  try {
    const { data, error } = await supabase
      .from('tuition_earnings_settings')
      .upsert({
        tutee_id: input.tuteeId,
        message_template: input.messageTemplate,
        fee_per_hour: input.feePerHour,
        fee_per_session: input.feePerSession,
        calculation_type: input.calculationType,
      }, {
        onConflict: 'tutee_id',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      messageTemplate: data.message_template,
      feePerHour: parseFloat(data.fee_per_hour),
      feePerSession: data.fee_per_session ? parseFloat(data.fee_per_session) : undefined,
      calculationType: data.calculation_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error upserting earnings settings:', error);
    throw error;
  }
};

/**
 * Update earnings settings
 */
export const updateEarningsSettings = async (
  input: UpdateEarningsSettingsInput
): Promise<EarningsSettings> => {
  try {
    const updateData: any = {};
    if (input.messageTemplate !== undefined) updateData.message_template = input.messageTemplate;
    if (input.feePerHour !== undefined) updateData.fee_per_hour = input.feePerHour;
    if (input.feePerSession !== undefined) updateData.fee_per_session = input.feePerSession;
    if (input.calculationType !== undefined) updateData.calculation_type = input.calculationType;

    const { data, error } = await supabase
      .from('tuition_earnings_settings')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      messageTemplate: data.message_template,
      feePerHour: parseFloat(data.fee_per_hour),
      feePerSession: data.fee_per_session ? parseFloat(data.fee_per_session) : undefined,
      calculationType: data.calculation_type,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating earnings settings:', error);
    throw error;
  }
};

/**
 * Fetch earnings records for a tutee
 */
export const fetchEarningsRecords = async (tuteeId: string): Promise<EarningsRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tuition_earnings_records')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      year: item.year,
      month: item.month,
      totalSessions: item.total_sessions,
      totalHours: parseFloat(item.total_hours),
      totalAmount: parseFloat(item.total_amount),
      generatedMessage: item.generated_message || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching earnings records:', error);
    throw error;
  }
};

/**
 * Fetch earnings record for a specific month
 */
export const fetchEarningsRecordByMonth = async (
  tuteeId: string,
  year: number,
  month: number
): Promise<EarningsRecord | null> => {
  try {
    const { data, error } = await supabase
      .from('tuition_earnings_records')
      .select('*')
      .eq('tutee_id', tuteeId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    // Fetch associated sessions
    const sessions = await fetchSessionsByEarningsRecord(data.id);

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      year: data.year,
      month: data.month,
      totalSessions: data.total_sessions,
      totalHours: parseFloat(data.total_hours),
      totalAmount: parseFloat(data.total_amount),
      generatedMessage: data.generated_message || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      sessions,
    };
  } catch (error) {
    console.error('Error fetching earnings record by month:', error);
    throw error;
  }
};

/**
 * Create or update earnings record for a month
 */
export const upsertEarningsRecord = async (
  tuteeId: string,
  year: number,
  month: number,
  sessions: TuitionSession[]
): Promise<EarningsRecord> => {
  try {
    const totalSessions = sessions.length;
    const totalHours = sessions.reduce((sum, s) => sum + s.durationHours, 0);
    const totalAmount = sessions.reduce((sum, s) => sum + s.amount, 0);

    // Get settings for message generation
    const settings = await fetchEarningsSettings(tuteeId);
    
    // Generate message
    const generatedMessage = settings
      ? generateEarningsMessage(settings, sessions, year, month)
      : undefined;

    const { data, error } = await supabase
      .from('tuition_earnings_records')
      .upsert({
        tutee_id: tuteeId,
        year,
        month,
        total_sessions: totalSessions,
        total_hours: totalHours,
        total_amount: totalAmount,
        generated_message: generatedMessage,
      }, {
        onConflict: 'tutee_id,year,month',
      })
      .select()
      .single();

    if (error) throw error;

    const record: EarningsRecord = {
      id: data.id,
      tuteeId: data.tutee_id,
      year: data.year,
      month: data.month,
      totalSessions: data.total_sessions,
      totalHours: parseFloat(data.total_hours),
      totalAmount: parseFloat(data.total_amount),
      generatedMessage: data.generated_message || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      sessions,
    };

    // Update sessions with earnings_record_id
    if (sessions.length > 0) {
      await Promise.all(
        sessions.map((session) =>
          updateTuitionSession({
            id: session.id,
            earningsRecordId: record.id,
          })
        )
      );
    }

    return record;
  } catch (error) {
    console.error('Error upserting earnings record:', error);
    throw error;
  }
};

/**
 * Fetch tuition sessions for a tutee
 */
export const fetchTuitionSessions = async (
  tuteeId: string,
  startDate?: string,
  endDate?: string
): Promise<TuitionSession[]> => {
  try {
    let query = supabase
      .from('tuition_sessions')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('session_date', { ascending: false })
      .order('start_time', { ascending: false });

    if (startDate) {
      query = query.gte('session_date', startDate);
    }
    if (endDate) {
      query = query.lte('session_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      sessionDate: item.session_date,
      startTime: item.start_time.slice(0, 5), // Ensure HH:mm format
      endTime: item.end_time.slice(0, 5), // Ensure HH:mm format
      durationHours: parseFloat(item.duration_hours),
      amount: parseFloat(item.amount),
      earningsRecordId: item.earnings_record_id || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching tuition sessions:', error);
    throw error;
  }
};

/**
 * Fetch sessions by earnings record ID
 */
export const fetchSessionsByEarningsRecord = async (
  earningsRecordId: string
): Promise<TuitionSession[]> => {
  try {
    const { data, error } = await supabase
      .from('tuition_sessions')
      .select('*')
      .eq('earnings_record_id', earningsRecordId)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      sessionDate: item.session_date,
      startTime: item.start_time.slice(0, 5),
      endTime: item.end_time.slice(0, 5),
      durationHours: parseFloat(item.duration_hours),
      amount: parseFloat(item.amount),
      earningsRecordId: item.earnings_record_id || undefined,
      availableDateId: item.available_date_id || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching sessions by earnings record:', error);
    throw error;
  }
};

/**
 * Create a tuition session
 */
export const createTuitionSession = async (
  input: CreateTuitionSessionInput
): Promise<TuitionSession> => {
  try {
    const { data, error } = await supabase
      .from('tuition_sessions')
      .insert({
        tutee_id: input.tuteeId,
        session_date: input.sessionDate,
        start_time: input.startTime,
        end_time: input.endTime,
        duration_hours: input.durationHours,
        amount: input.amount,
        earnings_record_id: input.earningsRecordId || null,
        available_date_id: input.availableDateId || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      sessionDate: data.session_date,
      startTime: data.start_time.slice(0, 5),
      endTime: data.end_time.slice(0, 5),
      durationHours: parseFloat(data.duration_hours),
      amount: parseFloat(data.amount),
      earningsRecordId: data.earnings_record_id || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating tuition session:', error);
    throw error;
  }
};

/**
 * Update a tuition session
 */
export const updateTuitionSession = async (
  input: UpdateTuitionSessionInput
): Promise<TuitionSession> => {
  try {
    const updateData: any = {};
    if (input.sessionDate !== undefined) updateData.session_date = input.sessionDate;
    if (input.startTime !== undefined) updateData.start_time = input.startTime;
    if (input.endTime !== undefined) updateData.end_time = input.endTime;
    if (input.durationHours !== undefined) updateData.duration_hours = input.durationHours;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.earningsRecordId !== undefined) {
      updateData.earnings_record_id = input.earningsRecordId || null;
    }
    if (input.availableDateId !== undefined) {
      updateData.available_date_id = input.availableDateId || null;
    }

    const { data, error } = await supabase
      .from('tuition_sessions')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      sessionDate: data.session_date,
      startTime: data.start_time.slice(0, 5),
      endTime: data.end_time.slice(0, 5),
      durationHours: parseFloat(data.duration_hours),
      amount: parseFloat(data.amount),
      earningsRecordId: data.earnings_record_id || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating tuition session:', error);
    throw error;
  }
};

/**
 * Delete a tuition session
 */
export const deleteTuitionSession = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tuition_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting tuition session:', error);
    throw error;
  }
};

/**
 * Generate earnings message from template
 */
export const generateEarningsMessage = (
  settings: EarningsSettings,
  sessions: TuitionSession[],
  year: number,
  month: number,
  tuteeName?: string
): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[month - 1];

  let message = settings.messageTemplate
    .replace(/{month}/g, monthName)
    .replace(/{year}/g, String(year));

  if (tuteeName) {
    message = message.replace(/{tutee_name}/g, tuteeName);
  }

  if (sessions.length === 0) {
    return message
      .replace(/{sessions_list}/g, '')
      .replace(/{sessions_dates}/g, '')
      .replace(/{total_sessions}/g, '0')
      .replace(/{total_hours}/g, '0')
      .replace(/{total_amount}/g, '$0.00')
      .replace(/{fee_per_hour}/g, `$${settings.feePerHour.toFixed(2)}`);
  }

  // Format sessions list (for Shermaine format: 1)061225 -> 3-5pm)
  const sessionsList = sessions
    .sort((a, b) => {
      const dateA = new Date(a.sessionDate).getTime();
      const dateB = new Date(b.sessionDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.startTime.localeCompare(b.startTime);
    })
    .map((session, index) => {
      // Format date as DDMMYY (e.g., 061225 for Dec 6, 2025)
      const date = new Date(session.sessionDate);
      const day = String(date.getDate()).padStart(2, '0');
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const yearShort = String(date.getFullYear()).slice(-2);
      const formattedDate = `${day}${monthNum}${yearShort}`;
      
      // Format time as 3-5pm (convert 24h to 12h)
      const [startHour, startMin] = session.startTime.split(':').map(Number);
      const [endHour, endMin] = session.endTime.split(':').map(Number);
      const startPeriod = startHour >= 12 ? 'pm' : 'am';
      const endPeriod = endHour >= 12 ? 'pm' : 'am';
      const startHour12 = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
      const endHour12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
      const timeStr = `${startHour12}-${endHour12}${endPeriod}`;
      
      return `${index + 1})${formattedDate} -> ${timeStr}`;
    })
    .join('\n');

  // Calculate totals
  const totalSessions = sessions.length;
  const totalHours = sessions.reduce((sum, s) => sum + s.durationHours, 0);
  
  // Recalculate total amount based on current fee settings
  const totalAmount = settings.calculationType === 'hourly'
    ? totalHours * settings.feePerHour
    : totalSessions * (settings.feePerSession || 0);

  // Handle session dates list (for Rayne/Jeffrey format: 6 Dec, 20 Dec)
  const sessionsWithDates = sessions
    .sort((a, b) => {
      const dateA = new Date(a.sessionDate).getTime();
      const dateB = new Date(b.sessionDate).getTime();
      return dateA - dateB;
    })
    .map((session) => {
      const date = new Date(session.sessionDate);
      const day = date.getDate();
      const monthAbbr = monthNames[date.getMonth()].substring(0, 3);
      return `${day} ${monthAbbr}`;
    })
    .join(', ');

  // Replace template variables
  message = message
    .replace(/{sessions_list}/g, sessionsList)
    .replace(/{sessions_dates}/g, sessionsWithDates)
    .replace(/{total_sessions}/g, String(totalSessions))
    .replace(/{total_hours}/g, totalHours % 1 === 0 ? totalHours.toFixed(0) : totalHours.toFixed(2))
    .replace(/{total_amount}/g, `$${totalAmount.toFixed(2)}`)
    .replace(/{fee_per_hour}/g, `$${settings.feePerHour.toFixed(2)}`)
    .replace(/{fee_per_session}/g, `$${(settings.feePerSession || 0).toFixed(2)}`);

  // Handle special calculation format: "2 x $140= $280"
  // This handles cases where the template has "{total_sessions} x {fee_per_hour}= {total_amount}"
  // OR "{total_hours}hrs x {fee_per_hour}= {total_amount}"
  // OR "{total_sessions} lessons x {fee_per_session}= {total_amount}"
  message = message.replace(/([\d.]+)\s*(?:x|hrs\s*x|lessons\s*x)\s*\$(\d+(?:\.\d+)?)\s*=\s*\$(\d+(?:\.\d+)?)/g, (match, units, fee, amount) => {
    // Remove .00 if present, otherwise keep as is
    const unitsClean = units.replace(/\.00$/, '');
    const feeClean = fee.replace(/\.00$/, '');
    const amountClean = amount.replace(/\.00$/, '');
    
    let unitLabel = '';
    if (match.includes('hrs')) unitLabel = 'hrs ';
    if (match.includes('lessons')) unitLabel = ' lessons ';
    
    return `${unitsClean}${unitLabel}x $${feeClean}= $${amountClean}`;
  });

  return message;
};

/**
 * Calculate session amount from duration and fee per hour
 */
export const calculateSessionAmount = (
  startTime: string,
  endTime: string,
  fee: number,
  calculationType: 'hourly' | 'per_session' = 'hourly'
): { durationHours: number; amount: number } => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;
  const durationHours = durationMinutes / 60;
  
  const amount = calculationType === 'hourly' 
    ? durationHours * fee 
    : fee;
  
  return {
    durationHours: Math.round(durationHours * 100) / 100, // Round to 2 decimal places
    amount: Math.round(amount * 100) / 100,
  };
};

/**
 * Sync booked available_dates to tuition_sessions
 * Creates tuition_session records for any booked slots that don't have one yet
 */
export const syncBookedSessionsToTuitionSessions = async (): Promise<number> => {
  try {
    // Get all booked available_dates that don't have a tuition_session yet
    const { data: bookedSlots, error: slotsError } = await supabase
      .from('available_dates')
      .select('*')
      .not('booked_by', 'is', null)
      .eq('is_available', false);

    if (slotsError) throw slotsError;

    if (!bookedSlots || bookedSlots.length === 0) return 0;

    let createdCount = 0;

    for (const slot of bookedSlots) {
      // Check if tuition_session already exists
      const { data: existingSession } = await supabase
        .from('tuition_sessions')
        .select('id')
        .eq('available_date_id', slot.id)
        .single();

      if (existingSession) continue;

      // Get fee per hour for this tutee
      const { data: settings } = await supabase
        .from('tuition_earnings_settings')
        .select('fee_per_hour')
        .eq('tutee_id', slot.booked_by)
        .single();

      const feePerHour = settings ? parseFloat(settings.fee_per_hour) : 140.0;

      // Calculate duration and amount
      const [startHour, startMin] = slot.start_time.split(':').map(Number);
      const [endHour, endMin] = slot.end_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const durationHours = (endMinutes - startMinutes) / 60;
      const amount = durationHours * feePerHour;

      // Create tuition session
      const { error: insertError } = await supabase
        .from('tuition_sessions')
        .insert({
          tutee_id: slot.booked_by,
          session_date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          duration_hours: Math.round(durationHours * 100) / 100,
          amount: Math.round(amount * 100) / 100,
          available_date_id: slot.id,
        });

      if (!insertError) {
        createdCount++;
      } else {
        console.error(`Failed to create session for slot ${slot.id}:`, insertError);
      }
    }

    return createdCount;
  } catch (error) {
    console.error('Error syncing booked sessions:', error);
    throw error;
  }
};

/**
 * Recalculate amounts for sessions based on a new fee per hour
 * Useful when the user changes the rate and wants it applied to existing sessions
 */
export const recalculateSessionAmounts = async (
  tuteeId: string,
  fee: number,
  calculationType: 'hourly' | 'per_session',
  startDate?: string,
  endDate?: string
): Promise<void> => {
  try {
    // 1. Fetch sessions
    const sessions = await fetchTuitionSessions(tuteeId, startDate, endDate);
    if (sessions.length === 0) return;

    // 2. Update each session with new amount
    await Promise.all(
      sessions.map((session) => {
        const { amount } = calculateSessionAmount(
          session.startTime,
          session.endTime,
          fee,
          calculationType
        );
        return updateTuitionSession({
          id: session.id,
          amount,
        });
      })
    );
  } catch (error) {
    console.error('Error recalculating session amounts:', error);
    throw error;
  }
};

/**
 * Fetch earnings records for all tutees for a specific month
 */
export const fetchAllEarningsRecordsByMonth = async (
  year: number,
  month: number
): Promise<EarningsRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('tuition_earnings_records')
      .select('*')
      .eq('year', year)
      .eq('month', month);

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      year: item.year,
      month: item.month,
      totalSessions: item.total_sessions,
      totalHours: parseFloat(item.total_hours),
      totalAmount: parseFloat(item.total_amount),
      generatedMessage: item.generated_message || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching all earnings records by month:', error);
    throw error;
  }
};
