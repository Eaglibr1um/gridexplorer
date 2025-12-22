import { supabase } from '../config/supabase';
import { BookingRequest } from '../types/tuition';
import { notificationService } from './notificationService';

/**
 * Booking Service
 * Handles all booking request operations with Supabase
 */

export interface CreateBookingRequestInput {
  tuteeId: string;
  requestedDate: string; // ISO date string (YYYY-MM-DD)
  requestedStartTime: string; // HH:mm format
  requestedEndTime: string; // HH:mm format
  tuteeNotes?: string;
}

export interface UpdateBookingRequestInput {
  id: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedDate?: string; // ISO date string (YYYY-MM-DD)
  requestedStartTime?: string; // HH:mm format
  requestedEndTime?: string; // HH:mm format
  adminNotes?: string;
  tuteeNotes?: string;
}

/**
 * Fetch all booking requests
 */
export const fetchBookingRequests = async (): Promise<BookingRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      requestedDate: item.requested_date,
      requestedStartTime: item.requested_start_time,
      requestedEndTime: item.requested_end_time,
      status: item.status,
      adminNotes: item.admin_notes || undefined,
      tuteeNotes: item.tutee_notes || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    throw error;
  }
};

/**
 * Fetch booking requests by status
 */
export const fetchBookingRequestsByStatus = async (
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
): Promise<BookingRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      requestedDate: item.requested_date,
      requestedStartTime: item.requested_start_time,
      requestedEndTime: item.requested_end_time,
      status: item.status,
      adminNotes: item.admin_notes || undefined,
      tuteeNotes: item.tutee_notes || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching booking requests by status:', error);
    throw error;
  }
};

/**
 * Fetch booking requests for a specific tutee
 */
export const fetchBookingRequestsByTutee = async (
  tuteeId: string
): Promise<BookingRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      requestedDate: item.requested_date,
      requestedStartTime: item.requested_start_time,
      requestedEndTime: item.requested_end_time,
      status: item.status,
      adminNotes: item.admin_notes || undefined,
      tuteeNotes: item.tutee_notes || undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching booking requests by tutee:', error);
    throw error;
  }
};

/**
 * Create a new booking request
 */
export const createBookingRequest = async (
  input: CreateBookingRequestInput
): Promise<BookingRequest> => {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert({
        tutee_id: input.tuteeId,
        requested_date: input.requestedDate,
        requested_start_time: input.requestedStartTime,
        requested_end_time: input.requestedEndTime,
        tutee_notes: input.tuteeNotes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Notify Admin of new request
    notificationService.notify({
      type: 'new_booking',
      tuteeId: 'admin',
      title: 'New Booking Request! 📅',
      message: `A new session has been requested for ${input.requestedDate}.`,
      url: '/tuition'
    });

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      requestedDate: data.requested_date,
      requestedStartTime: data.requested_start_time,
      requestedEndTime: data.requested_end_time,
      status: data.status,
      adminNotes: data.admin_notes || undefined,
      tuteeNotes: data.tutee_notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating booking request:', error);
    throw error;
  }
};

/**
 * Update a booking request
 */
export const updateBookingRequest = async (
  input: UpdateBookingRequestInput
): Promise<BookingRequest> => {
  try {
    const updateData: any = {};
    if (input.status !== undefined) updateData.status = input.status;
    if (input.requestedDate !== undefined) updateData.requested_date = input.requestedDate;
    if (input.requestedStartTime !== undefined) updateData.requested_start_time = input.requestedStartTime;
    if (input.requestedEndTime !== undefined) updateData.requested_end_time = input.requestedEndTime;
    if (input.adminNotes !== undefined) updateData.admin_notes = input.adminNotes;
    if (input.tuteeNotes !== undefined) updateData.tutee_notes = input.tuteeNotes;

    const { data, error } = await supabase
      .from('booking_requests')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    // Notify Tutee of status change (approved/rejected)
    if (input.status === 'approved' || input.status === 'rejected') {
      notificationService.notify({
        type: 'booking_update',
        tuteeId: data.tutee_id,
        title: input.status === 'approved' ? 'Request Approved! ✅' : 'Request Update ℹ️',
        message: `Your booking for ${data.requested_date} has been ${input.status}.`,
        url: '/tuition'
      });
    }

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      requestedDate: data.requested_date,
      requestedStartTime: data.requested_start_time,
      requestedEndTime: data.requested_end_time,
      status: data.status,
      adminNotes: data.admin_notes || undefined,
      tuteeNotes: data.tutee_notes || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating booking request:', error);
    throw error;
  }
};

/**
 * Delete a booking request
 */
export const deleteBookingRequest = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('booking_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting booking request:', error);
    throw error;
  }
};

/**
 * Approve a booking request
 */
export const approveBookingRequest = async (
  id: string,
  adminNotes?: string
): Promise<BookingRequest> => {
  return updateBookingRequest({
    id,
    status: 'approved',
    adminNotes,
  });
};

/**
 * Reject a booking request
 */
export const rejectBookingRequest = async (
  id: string,
  adminNotes?: string
): Promise<BookingRequest> => {
  return updateBookingRequest({
    id,
    status: 'rejected',
    adminNotes,
  });
};

