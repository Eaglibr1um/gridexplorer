import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Tutee, BookingRequest } from '../../types/tuition';
import { createBookingRequest, updateBookingRequest } from '../../services/bookingService';

interface BookingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate: Date;
  tutee: Tutee;
  existingRequest?: BookingRequest | null; // For editing
}

const BookingRequestModal = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  tutee,
  existingRequest = null,
  onDateChange,
}: BookingRequestModalProps) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing request data if editing
  useEffect(() => {
    if (existingRequest) {
      setCurrentDate(parseISO(existingRequest.requestedDate));
      setStartTime(existingRequest.requestedStartTime);
      setEndTime(existingRequest.requestedEndTime);
      setNotes(existingRequest.tuteeNotes || '');
    } else {
      setCurrentDate(selectedDate);
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
    }
  }, [existingRequest, selectedDate, isOpen]);

  const handleSubmit = async () => {
    // Validate
    if (!startTime || !endTime) {
      setError('Please select both start and end times');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (existingRequest) {
        // Update existing request
        await updateBookingRequest({
          id: existingRequest.id,
          requestedDate: format(currentDate, 'yyyy-MM-dd'),
          requestedStartTime: startTime,
          requestedEndTime: endTime,
          tuteeNotes: notes || undefined,
        });
      } else {
        // Create new request
      await createBookingRequest({
        tuteeId: tutee.id,
          requestedDate: format(currentDate, 'yyyy-MM-dd'),
        requestedStartTime: startTime,
        requestedEndTime: endTime,
        tuteeNotes: notes || undefined,
      });
      }

      // Reset form
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(existingRequest 
        ? 'Failed to update booking request. Please try again.'
        : 'Failed to submit booking request. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-modal-content">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {existingRequest ? 'Edit Booking Request' : 'Request Booking'}
                </h2>
                <p className="text-sm text-gray-600">{tutee.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Selected Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={format(currentDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    const newDate = parseISO(e.target.value);
                    setCurrentDate(newDate);
                    if (onDateChange) {
                      onDateChange(newDate);
                    }
                  }
                }}
                disabled={!existingRequest}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  existingRequest ? '' : 'bg-indigo-50 cursor-not-allowed'
                }`}
              />
              {!existingRequest && (
                <p className="text-xs text-gray-500 mt-1">
                  {format(currentDate, 'EEEE, d MMMM yyyy')}
              </p>
              )}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Any additional information about your request..."
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors-smooth press-effect disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? (existingRequest ? 'Updating...' : 'Submitting...')
                  : (existingRequest ? 'Update Request' : 'Submit Request')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BookingRequestModal;

