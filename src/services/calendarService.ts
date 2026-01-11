import { supabase } from '../config/supabase';
import { AvailableDate } from '../types/tuition';
import { notificationService } from './notificationService';

/**
 * Calendar Service
 * Handles all calendar-related operations with Supabase
 */

export interface CreateAvailableDateInput {
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format (24-hour)
  endTime: string; // HH:mm format (24-hour)
  isAvailable?: boolean;
  tuteeId?: string; // tutee id this slot is for
  notes?: string;
  eventType?: 'time_slot' | 'exam' | 'test'; // Type of event
}

export interface UpdateAvailableDateInput {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
  bookedBy?: string | null;
  tuteeId?: string | null;
  notes?: string;
  eventType?: 'time_slot' | 'exam' | 'test';
}

/**
 * Fetch all available dates
 */
export const fetchAvailableDates = async (): Promise<AvailableDate[]> => {
  try {
    const { data, error } = await supabase
      .from('available_dates')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    // Transform database format to our AvailableDate type
    return (data || []).map((item) => ({
      id: item.id,
      date: item.date,
      startTime: item.start_time ? item.start_time.slice(0, 5) : '', // Ensure HH:mm format
      endTime: item.end_time ? item.end_time.slice(0, 5) : '', // Ensure HH:mm format
      isAvailable: item.is_available,
      bookedBy: item.booked_by || undefined,
      tuteeId: item.tutee_id || undefined,
      notes: item.notes || undefined,
      eventType: item.event_type || 'time_slot',
    }));
  } catch (error) {
    console.error('Error fetching available dates:', error);
    throw error;
  }
};

/**
 * Fetch available dates for a specific date range
 */
export const fetchAvailableDatesByRange = async (
  startDate: string,
  endDate: string
): Promise<AvailableDate[]> => {
  try {
    const { data, error } = await supabase
      .from('available_dates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      date: item.date,
      startTime: item.start_time ? item.start_time.slice(0, 5) : '', // Ensure HH:mm format
      endTime: item.end_time ? item.end_time.slice(0, 5) : '', // Ensure HH:mm format
      isAvailable: item.is_available,
      bookedBy: item.booked_by || undefined,
      tuteeId: item.tutee_id || undefined,
      notes: item.notes || undefined,
      eventType: item.event_type || 'time_slot',
    }));
  } catch (error) {
    console.error('Error fetching available dates by range:', error);
    throw error;
  }
};

/**
 * Create a new available date
 */
export const createAvailableDate = async (
  input: CreateAvailableDateInput
): Promise<AvailableDate> => {
  try {
    const { data, error } = await supabase
      .from('available_dates')
      .insert({
        date: input.date,
        start_time: input.startTime,
        end_time: input.endTime,
        is_available: input.isAvailable ?? true,
        tutee_id: input.tuteeId || null,
        notes: input.notes || null,
        event_type: input.eventType || 'time_slot',
      })
      .select()
      .single();

    if (error) throw error;

    // Notify Admin of new exam/test date
    if (input.eventType === 'exam' || input.eventType === 'test') {
      notificationService.notify({
        type: 'new_exam',
        tuteeId: 'admin',
        title: `New ${input.eventType === 'exam' ? 'Exam' : 'Test'} Date! 📝`,
        message: `A new ${input.eventType} has been added for ${input.date}.`,
        url: '/tuition'
      });
    }

    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time ? data.start_time.slice(0, 5) : '', // Ensure HH:mm format
      endTime: data.end_time ? data.end_time.slice(0, 5) : '', // Ensure HH:mm format
      isAvailable: data.is_available,
      bookedBy: data.booked_by || undefined,
      tuteeId: data.tutee_id || undefined,
      notes: data.notes || undefined,
      eventType: data.event_type || 'time_slot',
    };
  } catch (error) {
    console.error('Error creating available date:', error);
    throw error;
  }
};

/**
 * Update an available date
 */
export const updateAvailableDate = async (
  input: UpdateAvailableDateInput
): Promise<AvailableDate> => {
  try {
    const updateData: any = {};
    if (input.date !== undefined) updateData.date = input.date;
    if (input.startTime !== undefined) updateData.start_time = input.startTime;
    if (input.endTime !== undefined) updateData.end_time = input.endTime;
    if (input.isAvailable !== undefined) updateData.is_available = input.isAvailable;
    if (input.bookedBy !== undefined) updateData.booked_by = input.bookedBy;
    if (input.tuteeId !== undefined) updateData.tutee_id = input.tuteeId;
    if (input.eventType !== undefined) updateData.event_type = input.eventType;
    // Handle notes: empty string becomes null, undefined means don't update
    if (input.notes !== undefined) {
      updateData.notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
    }

    const { data, error } = await supabase
      .from('available_dates')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time ? data.start_time.slice(0, 5) : '', // Ensure HH:mm format
      endTime: data.end_time ? data.end_time.slice(0, 5) : '', // Ensure HH:mm format
      isAvailable: data.is_available,
      bookedBy: data.booked_by || undefined,
      tuteeId: data.tutee_id || undefined,
      notes: data.notes || undefined,
      eventType: data.event_type || 'time_slot',
    };
  } catch (error) {
    console.error('Error updating available date:', error);
    throw error;
  }
};

/**
 * Delete an available date
 */
export const deleteAvailableDate = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('available_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting available date:', error);
    throw error;
  }
};

/**
 * Book a time slot (mark as booked by a tutee)
 * Also creates a tuition_session record for earnings tracking
 */
export const bookTimeSlot = async (
  id: string,
  tuteeId: string
): Promise<AvailableDate> => {
  // First, get the slot details
  const { data: slotData, error: fetchError } = await supabase
    .from('available_dates')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Update the available date to mark as booked
  const updatedSlot = await updateAvailableDate({
    id,
    bookedBy: tuteeId,
    isAvailable: false,
  });

  // Create tuition session if it doesn't exist
  const { data: existingSession } = await supabase
    .from('tuition_sessions')
    .select('id')
    .eq('available_date_id', id)
    .single();

  if (!existingSession) {
    // Get earnings settings to calculate amount
    const { data: settings } = await supabase
      .from('tuition_earnings_settings')
      .select('fee_per_hour')
      .eq('tutee_id', tuteeId)
      .single();

    const feePerHour = settings ? parseFloat(settings.fee_per_hour) : 140.0;

    // Calculate duration and amount
    const [startHour, startMin] = slotData.start_time.split(':').map(Number);
    const [endHour, endMin] = slotData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationHours = (endMinutes - startMinutes) / 60;
    const amount = durationHours * feePerHour;

    // Create tuition session
    await supabase
      .from('tuition_sessions')
      .insert({
        tutee_id: tuteeId,
        session_date: slotData.date,
        start_time: slotData.start_time,
        end_time: slotData.end_time,
        duration_hours: Math.round(durationHours * 100) / 100,
        amount: Math.round(amount * 100) / 100,
        available_date_id: id,
      });
  }

  return updatedSlot;
};

/**
 * Cancel a booking (make available again)
 * Also removes the linked tuition_session if it exists
 */
export const cancelBooking = async (id: string): Promise<AvailableDate> => {
  // Find and delete the linked tuition_session
  const { data: session } = await supabase
    .from('tuition_sessions')
    .select('id')
    .eq('available_date_id', id)
    .single();

  if (session) {
    await supabase
      .from('tuition_sessions')
      .delete()
      .eq('id', session.id);
  }

  return updateAvailableDate({
    id,
    bookedBy: null,
    isAvailable: true,
  });
};

/**
 * Create a confirmed tuition session directly by admin
 * Does not trigger notifications
 */
export const addConfirmedSessionDirectly = async (
  input: CreateAvailableDateInput & { tuteeId: string }
): Promise<void> => {
  try {
    // 1. Create available date record marked as NOT available and booked by the tutee
    const { data: slotData, error: slotError } = await supabase
      .from('available_dates')
      .insert({
        date: input.date,
        start_time: input.startTime,
        end_time: input.endTime,
        is_available: false,
        booked_by: input.tuteeId,
        tutee_id: input.tuteeId,
        notes: input.notes || null,
        event_type: input.eventType || 'time_slot',
      })
      .select()
      .single();

    if (slotError) throw slotError;

    // 2. Create tuition session record
    // Get earnings settings to calculate amount
    const { data: settings } = await supabase
      .from('tuition_earnings_settings')
      .select('fee_per_hour')
      .eq('tutee_id', input.tuteeId)
      .single();

    const feePerHour = settings ? parseFloat(settings.fee_per_hour) : 140.0;

    // Calculate duration and amount
    const [startHour, startMin] = input.startTime.split(':').map(Number);
    const [endHour, endMin] = input.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationHours = (endMinutes - startMinutes) / 60;
    const amount = durationHours * feePerHour;

    const { error: sessionError } = await supabase
      .from('tuition_sessions')
      .insert({
        tutee_id: input.tuteeId,
        session_date: input.date,
        start_time: input.startTime,
        end_time: input.endTime,
        duration_hours: Math.round(durationHours * 100) / 100,
        amount: Math.round(amount * 100) / 100,
        available_date_id: slotData.id,
      });

    if (sessionError) throw sessionError;
  } catch (error) {
    console.error('Error creating confirmed session:', error);
    throw error;
  }
};
