import { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, XCircle, Calendar, User, MessageSquare, RefreshCw,
  BookOpen, GraduationCap, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, 
  Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator, FlaskConical, 
  Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile, Shield
} from 'lucide-react';
import { BookingRequest } from '../../types/tuition';
import {
  fetchBookingRequests,
  approveBookingRequest,
  rejectBookingRequest,
  deleteBookingRequest,
} from '../../services/bookingService';
import { createAvailableDate, fetchAvailableDates, updateAvailableDate, bookTimeSlot } from '../../services/calendarService';
import { supabase } from '../../config/supabase';
import { getTuteeByIdSync } from '../../config/tutees';
import { format, parseISO } from 'date-fns';
import ConfirmationModal from '../ui/ConfirmationModal';

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy,
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool,
  Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2,
  Code, Globe, Coffee, Smile, Shield
};

const BookingRequestsAdmin = () => {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const allRequests = await fetchBookingRequests();
      setRequests(allRequests);
    } catch (err) {
      setError('Failed to load booking requests. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      // Approve the booking request
      await approveBookingRequest(selectedRequest.id, adminNotes || undefined);
      
      // Check if there's an existing slot for this date and tutee
      const existingDates = await fetchAvailableDates();
      const existingSlot = existingDates.find(
        slot => 
          slot.date === selectedRequest.requestedDate &&
          slot.tuteeId === selectedRequest.tuteeId &&
          slot.isAvailable
      );
      
      let slotId: string;
      
      if (existingSlot) {
        // Update existing slot with new timing
        const updated = await updateAvailableDate({
          id: existingSlot.id,
          startTime: selectedRequest.requestedStartTime,
          endTime: selectedRequest.requestedEndTime,
          notes: adminNotes || selectedRequest.tuteeNotes || existingSlot.notes || undefined,
          isAvailable: true,
        });
        slotId = updated.id;
      } else {
        // Create a new available slot for the approved request
        const created = await createAvailableDate({
          date: selectedRequest.requestedDate,
          startTime: selectedRequest.requestedStartTime,
          endTime: selectedRequest.requestedEndTime,
          tuteeId: selectedRequest.tuteeId,
          notes: adminNotes || selectedRequest.tuteeNotes || undefined,
          isAvailable: true,
        });
        slotId = created.id;
      }
      
      // Book the slot (this will create a tuition_session automatically)
      await bookTimeSlot(slotId, selectedRequest.tuteeId);
      
      await loadRequests();
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err) {
      setError('Failed to approve request. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      await rejectBookingRequest(selectedRequest.id, adminNotes || undefined);
      await loadRequests();
      setShowRejectModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (err) {
      setError('Failed to reject request. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBookingRequest(id);
      await loadRequests();
    } catch (err) {
      setError('Failed to delete request. Please try again.');
      console.error(err);
    }
  };

  const getStatusBadge = (status: BookingRequest['status']) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-spin" />
        <p className="text-gray-600">Loading booking requests...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Booking Requests</h2>
          <p className="text-sm text-gray-600 mt-1">Manage tutee booking requests</p>
        </div>
        <button
          onClick={loadRequests}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors-smooth press-effect"
          aria-label="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors-smooth press-effect whitespace-nowrap ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
                {requests.filter(r => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 animate-fade-in">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No {filter === 'all' ? '' : filter} booking requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => {
            const tutee = getTuteeByIdSync(request.tuteeId);
              // Format time to remove seconds if present (ensure HH:mm format)
              const formatTime = (time: string) => {
                if (!time) return '';
                // If time includes seconds (HH:mm:ss), remove them
                return time.includes(':') && time.split(':').length === 3 
                  ? time.slice(0, 5) 
                  : time;
              };
              
              return (
                <div
                  key={request.id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition-colors-smooth animate-fade-in-up card-hover"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      {tutee ? (
                        <span 
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r ${tutee.colorScheme.gradient} flex items-center gap-1.5 sm:gap-2 shadow-sm`}
                        >
                          {(() => {
                            const IconComp = iconMap[tutee.icon] || User;
                            return <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />;
                          })()}
                          {tutee.name}
                        </span>
                      ) : (
                        <>
                          <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          <span className="font-semibold text-gray-800">
                            {request.tuteeId}
                          </span>
                        </>
                      )}
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 ml-1 sm:ml-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(parseISO(request.requestedDate), 'EEEE, d MMMM yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(request.requestedStartTime)} - {formatTime(request.requestedEndTime)}
                        </span>
                      </div>
                      {request.tuteeNotes && (
                        <div className="flex items-start gap-2 mt-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{request.tuteeNotes}</span>
                        </div>
                      )}
                      {request.adminNotes && (
                        <div className="flex items-start gap-2 mt-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600" />
                          <span className="text-indigo-700 font-medium">
                            Admin: {request.adminNotes}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Requested: {format(parseISO(request.createdAt), 'd MMM yyyy, HH:mm')}
                      </div>
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowApproveModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                        aria-label="Approve"
                        title="Approve request"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label="Reject"
                        title="Reject request"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
          setAdminNotes('');
        }}
        onConfirm={handleApprove}
        title="Approve Booking Request"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to approve this booking request?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Notes (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
        }
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
          setAdminNotes('');
        }}
        onConfirm={handleReject}
        title="Reject Booking Request"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to reject this booking request?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Add a reason for rejection..."
              />
            </div>
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
        isLoading={isProcessing}
      />
    </div>
  );
};

export default BookingRequestsAdmin;

