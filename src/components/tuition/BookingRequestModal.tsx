import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  onDateChange?: (date: Date) => void; // Optional callback when date changes
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

  // Get current time in HH:mm format
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Get time 1 hour from now
  const getOneHourLater = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Initialize form with existing request data if editing, or current time if new
  useEffect(() => {
    if (existingRequest) {
      setCurrentDate(parseISO(existingRequest.requestedDate));
      setStartTime(existingRequest.requestedStartTime);
      setEndTime(existingRequest.requestedEndTime);
      setNotes(existingRequest.tuteeNotes || '');
    } else {
      setCurrentDate(selectedDate);
      // Use current time for today, or default times for future dates
      const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (isToday) {
        setStartTime(getCurrentTime());
        setEndTime(getOneHourLater());
      } else {
        setStartTime('09:00');
        setEndTime('10:00');
      }
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

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-50 rounded-2xl shadow-inner">
              <Calendar className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
                {existingRequest ? 'Modify Slot' : 'New Request'}
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">For {tutee.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Selected Date */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Proposed Date
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
              className={`w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all text-lg font-bold text-gray-800 shadow-inner ${
                existingRequest ? '' : 'cursor-not-allowed opacity-80'
              }`}
            />
            {!existingRequest && (
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 ml-1">
                {format(currentDate, 'EEEE, d MMMM yyyy')}
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Start
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                End
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Personal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-800 shadow-inner resize-none"
              placeholder="Any special requests or details..."
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <p className="text-xs font-bold text-red-700 uppercase tracking-wide">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50`}
            >
              {isSubmitting 
                ? 'Transmitting...'
                : (existingRequest ? 'Confirm Changes' : 'Send Request')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BookingRequestModal;

