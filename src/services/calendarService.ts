import { supabase } from '../config/supabase';
import { AvailableDate } from '../types/tuition';

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
 */
export const bookTimeSlot = async (
  id: string,
  tuteeId: string
): Promise<AvailableDate> => {
  return updateAvailableDate({
    id,
    bookedBy: tuteeId,
    isAvailable: false,
  });
};

/**
 * Cancel a booking (make available again)
 */
export const cancelBooking = async (id: string): Promise<AvailableDate> => {
  return updateAvailableDate({
    id,
    bookedBy: null,
    isAvailable: true,
  });
};

