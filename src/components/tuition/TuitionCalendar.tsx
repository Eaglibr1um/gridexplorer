import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Calendar as CalendarIcon, Clock, X, Plus, Edit2, Trash2, XCircle, CalendarPlus, User, AlertCircle } from 'lucide-react';
import FeedbackButton from './FeedbackButton';
import { AvailableDate, Tutee, BookingRequest } from '../../types/tuition';
import { getTutees, getTuteeByIdSync } from '../../config/tutees';
import BookingRequestModal from './BookingRequestModal';
import Select, { SelectOption } from '../ui/Select';
import {
  fetchAvailableDates,
  createAvailableDate,
  updateAvailableDate,
  deleteAvailableDate,
  CreateAvailableDateInput,
} from '../../services/calendarService';
import { fetchBookingRequestsByTutee, deleteBookingRequest } from '../../services/bookingService';
import { format, isSameDay, parseISO, differenceInDays, differenceInHours, differenceInMinutes, isAfter, isBefore, startOfToday, parse, addDays } from 'date-fns';
import ConfirmationModal from '../ui/ConfirmationModal';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface TuitionCalendarProps {
  isAdmin?: boolean; // If true, shows admin controls
  tutee?: Tutee | null; // Current tutee (for booking requests)
  onBookingRequestSuccess?: () => void; // Callback when booking is successful
  onTuteeUpdate?: (tutee: Tutee) => void; // Callback when tutee is updated
}

const TuitionCalendar = ({ isAdmin = false, tutee = null, onBookingRequestSuccess, onTuteeUpdate }: TuitionCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailableDate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; slotId: string | null }>({
    isOpen: false,
    slotId: null,
  });
  const [deleteRequestConfirm, setDeleteRequestConfirm] = useState<{ isOpen: boolean; requestId: string | null }>({
    isOpen: false,
    requestId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);
  const [showBookingRequest, setShowBookingRequest] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BookingRequest | null>(null);
  const [requestInitialData, setRequestInitialData] = useState<{
    startTime?: string;
    endTime?: string;
    notes?: string;
  }>({});
  const [tuteeOptions, setTuteeOptions] = useState<SelectOption[]>([
    { value: '', label: 'All Tutees' }
  ]);
  const [newSlot, setNewSlot] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    tuteeId: '',
    notes: '',
    eventType: 'time_slot' as 'time_slot' | 'exam' | 'test',
  });

  // Load tutee options
  useEffect(() => {
    const loadTutees = async () => {
      try {
        const tutees = await getTutees();
        setTuteeOptions([
          { value: '', label: 'All Tutees' },
          ...tutees.map(t => ({ value: t.id, label: t.name }))
        ]);
      } catch (error) {
        console.error('Failed to load tutees:', error);
        setTuteeOptions([
          { value: '', label: 'All Tutees' },
          { value: 'primary-school', label: 'Rayne & Jeffrey' },
          { value: 'shermaine', label: 'Shermaine' },
        ]);
      }
    };
    loadTutees();
  }, []);

  // Fetch available dates and booking requests
  useEffect(() => {
    loadAvailableDates();
    if (!isAdmin && tutee) {
      loadBookingRequests();
    }
  }, [isAdmin, tutee?.id]); // Only reload when tutee ID changes

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      setError('');
      const dates = await fetchAvailableDates();
      setAvailableDates(dates);
    } catch (err) {
      setError('Failed to load available dates. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingRequests = async () => {
    if (!tutee) return;
    try {
      const requests = await fetchBookingRequestsByTutee(tutee.id);
      setBookingRequests(requests);
    } catch (err) {
      console.error('Failed to load booking requests:', err);
    }
  };

  // Get dates with available slots for calendar highlighting
  // If not admin and tutee is set, only show dates with slots available to this tutee
  const getDatesWithSlots = (): Date[] => {
    let filteredSlots = availableDates;
    
    if (!isAdmin && tutee) {
      // Only show dates that have slots available to this tutee (their own slots or unassigned)
      filteredSlots = availableDates.filter((slot) => {
        const isOwnSlot = !slot.tuteeId || slot.tuteeId === tutee.id;
        return slot.isAvailable && isOwnSlot;
      });
    } else {
      filteredSlots = availableDates.filter((slot) => slot.isAvailable);
    }
    
    return filteredSlots.map((slot) => parseISO(slot.date));
  };

  // Get dates with booking requests for calendar highlighting
  const getDatesWithRequests = (): Date[] => {
    if (isAdmin || !tutee) return [];
    return bookingRequests.map((req) => parseISO(req.requestedDate));
  };

  // Get slots for selected date, filtered by tutee if not admin
  const getSlotsForDate = (date: Date): (AvailableDate & { isOtherTuteeSlot?: boolean })[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let slots = availableDates
      .filter((slot) => slot.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // If not admin and tutee is set, mark slots that don't belong to this tutee
    if (!isAdmin && tutee) {
      slots = slots.map((slot) => {
        const isOwnSlot = !slot.tuteeId || slot.tuteeId === tutee.id;
        // Exam and test dates are always visible to their owner
        const isExamOrTest = slot.eventType === 'exam' || slot.eventType === 'test';
        // If it's not their slot and not an exam/test, mark it as unavailable
        if (!isOwnSlot && !isExamOrTest) {
          return {
            ...slot,
            isAvailable: false, // Mark as not available
            isOtherTuteeSlot: true, // Flag to show it's another tutee's slot
          };
        }
        return slot;
      });
    }
    
    return slots;
  };

  // Get booking requests for selected date
  const getRequestsForDate = (date: Date): BookingRequest[] => {
    if (isAdmin || !tutee) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookingRequests
      .filter((req) => req.requestedDate === dateStr)
      .sort((a, b) => a.requestedStartTime.localeCompare(b.requestedStartTime));
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
      setNewSlot((prev) => ({
        ...prev,
        date: format(value, 'yyyy-MM-dd'),
      }));
    }
  };

  const handleAddSlot = async () => {
    try {
      setError('');
      // For tutees, automatically set tuteeId to current tutee
      const tuteeIdForSlot = isAdmin 
        ? (newSlot.tuteeId || undefined)
        : (tutee ? tutee.id : undefined);
      
      const input: CreateAvailableDateInput = {
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        tuteeId: tuteeIdForSlot,
        notes: newSlot.notes || undefined,
        isAvailable: true,
        eventType: newSlot.eventType,
      };

      await createAvailableDate(input);
      await loadAvailableDates();
      setShowAddModal(false);
      setNewSlot({
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        tuteeId: '',
        notes: '',
        eventType: 'time_slot',
      });
    } catch (err) {
      setError('Failed to add time slot. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateSlot = async (slot: AvailableDate) => {
    try {
      setError('');
      // For tutees, automatically set tuteeId to current tutee
      const tuteeIdForSlot = isAdmin 
        ? (newSlot.tuteeId || null)
        : (tutee ? tutee.id : null);
      
      await updateAvailableDate({
        id: slot.id,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        tuteeId: tuteeIdForSlot,
        notes: newSlot.notes !== undefined ? (newSlot.notes.trim() || null) : undefined,
        eventType: newSlot.eventType,
      });
      await loadAvailableDates();
      setEditingSlot(null);
      setShowAddModal(false); // Close the modal after update
      setNewSlot({
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        tuteeId: '',
        notes: '',
        eventType: 'time_slot',
      });
    } catch (err) {
      setError('Failed to update time slot. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    setDeleteConfirm({ isOpen: true, slotId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.slotId) return;

    try {
      setIsDeleting(true);
      setError('');
      await deleteAvailableDate(deleteConfirm.slotId);
      await loadAvailableDates();
      setDeleteConfirm({ isOpen: false, slotId: null });
    } catch (err) {
      setError('Failed to delete time slot. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    setDeleteRequestConfirm({ isOpen: true, requestId });
  };

  const confirmDeleteRequest = async () => {
    if (!deleteRequestConfirm.requestId) return;

    try {
      setIsDeletingRequest(true);
      setError('');
      await deleteBookingRequest(deleteRequestConfirm.requestId);
      await loadBookingRequests();
      setDeleteRequestConfirm({ isOpen: false, requestId: null });
    } catch (err) {
      setError('Failed to delete booking request. Please try again.');
      console.error(err);
    } finally {
      setIsDeletingRequest(false);
    }
  };

  const startEdit = (slot: AvailableDate) => {
    setEditingSlot(slot);
    setNewSlot({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      tuteeId: slot.tuteeId || '',
      notes: slot.notes || '',
      eventType: slot.eventType || 'time_slot',
    });
    setShowAddModal(true);
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    setShowAddModal(false);
    setNewSlot({
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      tuteeId: '',
      notes: '',
      eventType: 'time_slot',
    });
  };

  const slotsForSelectedDate = getSlotsForDate(selectedDate);
  const requestsForSelectedDate = getRequestsForDate(selectedDate);
  const datesWithSlots = getDatesWithSlots();

  // Custom tile content for calendar
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasSlots = datesWithSlots.some((d) => isSameDay(d, date));
      const hasRequests = !isAdmin && tutee && getDatesWithRequests().some((d) => isSameDay(d, date));
      
      if (hasSlots && hasRequests) {
        return (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            <div className="w-1 h-1 bg-green-500 rounded-full" />
            <div className="w-1 h-1 bg-amber-500 rounded-full" />
          </div>
        );
      } else if (hasSlots) {
        return (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
        );
      } else if (hasRequests) {
        return (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
        );
      }
    }
    return null;
  };

  // Custom tile className for styling
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const hasSlots = datesWithSlots.some((d) => isSameDay(d, date));
      const hasRequests = !isAdmin && tutee && getDatesWithRequests().some((d) => isSameDay(d, date));
      
      if (hasSlots && hasRequests) {
        return 'has-available-slots has-requests';
      } else if (hasSlots) {
        return 'has-available-slots';
      } else if (hasRequests) {
        return 'has-requests';
      }
    }
    return '';
  };

  // Calculate next tuition session and time until it
  const getNextTuitionInfo = () => {
    if (!tutee || isAdmin) return null;

    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');

    // Get all available or booked slots for this tutee
    const tuteeSlots = availableDates
      .filter((slot) => {
        const isOwnSlot = slot.tuteeId === tutee.id || slot.bookedBy === tutee.id;
        // Include slots assigned to them OR slots they have booked
        return isOwnSlot;
      })
      .sort((a, b) => {
        // Sort by date, then by start time
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }
        return a.startTime.localeCompare(b.startTime);
      });

    // Find next upcoming session
    for (const slot of tuteeSlots) {
      const slotDate = slot.date;
      const slotStartTime = slot.startTime;
      const slotEndTime = slot.endTime;

      // Parse date and time
      const slotDateTime = parse(`${slotDate} ${slotStartTime}`, 'yyyy-MM-dd HH:mm', new Date());
      const slotEndDateTime = parse(`${slotDate} ${slotEndTime}`, 'yyyy-MM-dd HH:mm', new Date());

      // Check if currently in progress
      if (slotDate === today && isAfter(now, slotDateTime) && isBefore(now, slotEndDateTime)) {
        return { type: 'in_progress' as const, slot };
      }

      // Check if upcoming
      if (isAfter(slotDateTime, now)) {
        const days = differenceInDays(slotDateTime, now);
        const hours = differenceInHours(slotDateTime, now) % 24;
        const minutes = differenceInMinutes(slotDateTime, now) % 60;

        return {
          type: 'upcoming' as const,
          slot,
          days,
          hours,
          minutes,
        };
      }
    }

    return null;
  };

  const tuitionInfo = getNextTuitionInfo();

  return (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 lg:p-10 border border-white/50 overflow-hidden">
        {/* Greeting & Status Banner */}
        {!isAdmin && tutee && (
          <div className={`mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-[2rem] sm:rounded-3xl shadow-lg relative overflow-hidden animate-fade-in`}>
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 sm:w-24 sm:h-24 bg-black/10 rounded-full blur-xl" />
            
            {tuitionInfo?.type === 'in_progress' ? (
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <div className="p-2.5 sm:p-3 bg-white/30 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner flex-shrink-0 animate-pulse">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-base sm:text-xl text-white tracking-tight leading-tight truncate">
                    Session in Progress! 🚀
                  </p>
                  <p className="text-[10px] sm:text-sm font-bold text-white/90 uppercase tracking-widest mt-0.5 sm:mt-1 truncate">
                    {tuitionInfo.slot.startTime} - {tuitionInfo.slot.endTime}
                  </p>
                </div>
              </div>
            ) : tuitionInfo?.type === 'upcoming' ? (
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <div className="p-2.5 sm:p-3 bg-white/30 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-base sm:text-xl text-white tracking-tight leading-tight truncate">
                    {tuitionInfo.days > 0 ? (
                      <>{tuitionInfo.days} {tuitionInfo.days === 1 ? 'Day' : 'Days'} to go!</>
                    ) : tuitionInfo.hours > 0 ? (
                      <>{tuitionInfo.hours} {tuitionInfo.hours === 1 ? 'Hour' : 'Hours'} to go!</>
                    ) : (
                      <>{tuitionInfo.minutes} {tuitionInfo.minutes === 1 ? 'Minute' : 'Minutes'} to go!</>
                    )}
                  </p>
                  <p className="text-[10px] sm:text-sm font-bold text-white/90 uppercase tracking-widest mt-0.5 sm:mt-1 truncate">
                    {format(parseISO(tuitionInfo.slot.date), 'EEE, MMM d')} • {tuitionInfo.slot.startTime}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                <div className="p-2.5 sm:p-3 bg-white/30 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-inner flex-shrink-0">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-base sm:text-xl text-white tracking-tight leading-tight truncate">
                    Hey {tutee.name}!
                  </p>
                  <p className="text-[10px] sm:text-sm font-bold text-white/80 uppercase tracking-widest mt-0.5 sm:mt-1 truncate">
                    No upcoming sessions
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-xl sm:rounded-2xl shadow-inner flex-shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 leading-tight truncate">Tuition Calendar</h2>
              <p className="text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-wider truncate">Plan your sessions</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl active:scale-95 text-xs sm:text-base flex-shrink-0 group"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" />
              <span>Add Slot</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {/* Calendar Container */}
          <div className="bg-gray-50/50 rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-inner">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="w-full border-0 rounded-2xl"
            />
            
            <div className="mt-6 flex flex-wrap gap-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Requested</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today</span>
              </div>
            </div>
          </div>

          {/* Time Slots & Agenda */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-black text-gray-800 tracking-tight">
                {isSameDay(selectedDate, new Date()) ? 'Today' : format(selectedDate, 'EEEE, d MMM')}
              </h3>
              {slotsForSelectedDate.length > 0 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {slotsForSelectedDate.length} {slotsForSelectedDate.length === 1 ? 'Event' : 'Events'}
                </span>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="flex-1 flex flex-col gap-6">
                {/* 1. Empty State - only show if there are truly no events/requests */}
                {slotsForSelectedDate.length === 0 && (!tutee || requestsForSelectedDate.length === 0) ? (
                  <div className="text-center py-10 px-6 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
                    <Clock className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="font-bold text-gray-400 text-lg">No sessions scheduled</p>
                    {isAdmin && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 text-indigo-600 font-black uppercase tracking-widest text-xs hover:underline underline-offset-4 transition-all"
                      >
                        Add a time slot
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 2. List of Slots */}
                    {slotsForSelectedDate.length > 0 && (
                      <div className="space-y-4">
                        {slotsForSelectedDate.map((slot, index) => {
                          const isOtherTuteeSlot = (slot as any).isOtherTuteeSlot;
                          const slotTutee = slot.tuteeId 
                            ? (tutee && slot.tuteeId === tutee.id ? tutee : getTuteeByIdSync(slot.tuteeId))
                            : null;
                          const isOwnSlot = !isAdmin && tutee && (!slot.tuteeId || slot.tuteeId === tutee.id);
                          const isExamOrTest = slot.eventType === 'exam' || slot.eventType === 'test';
                          const canEdit = isAdmin || (isOwnSlot && isExamOrTest);
                          
                          return (
                            <div
                              key={slot.id}
                              className={`p-5 rounded-3xl border-2 transition-all duration-300 animate-fade-in-up shadow-sm hover:shadow-md ${
                                isExamOrTest
                                  ? slot.eventType === 'exam' 
                                    ? 'border-red-100 bg-red-50/50'
                                    : 'border-blue-100 bg-blue-50/50'
                                  : slot.isAvailable && !isOtherTuteeSlot
                                  ? 'border-green-100 bg-green-50/50'
                                  : isOtherTuteeSlot
                                  ? 'border-orange-100 bg-orange-50/30 opacity-75'
                                  : 'border-gray-100 bg-gray-50/50'
                              }`}
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <div className={`p-2 rounded-xl ${
                                      isExamOrTest 
                                        ? slot.eventType === 'exam' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                        : 'bg-indigo-100 text-indigo-600'
                                    }`}>
                                      <Clock className="w-4 h-4" />
                                    </div>
                                    <span className="font-black text-gray-800 text-lg">
                                      {slot.startTime} - {slot.endTime}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    {isExamOrTest && (
                                      <span 
                                        className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm ${
                                          slot.eventType === 'exam' 
                                            ? 'bg-red-600 text-white'
                                            : 'bg-blue-600 text-white'
                                        }`}
                                      >
                                        {slot.eventType === 'exam' ? 'Exam' : 'Test'}
                                      </span>
                                    )}
                                    {slot.tuteeId && slotTutee && (
                                      <span 
                                        className={`text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5 text-white bg-gradient-to-r ${slotTutee.colorScheme.gradient} font-black uppercase tracking-widest shadow-sm`}
                                      >
                                        <User className="w-3 h-3" />
                                        {slotTutee.name}
                                      </span>
                                    )}
                                    {isOtherTuteeSlot && !isExamOrTest && (
                                      <span className="text-[10px] px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-black uppercase tracking-widest border border-orange-200">
                                        Unavailable
                                      </span>
                                    )}
                                    {!slot.isAvailable && !isOtherTuteeSlot && !isExamOrTest && (
                                      <span className="text-[10px] px-3 py-1 bg-gray-200 text-gray-600 rounded-full font-black uppercase tracking-widest border border-gray-300">
                                        Booked
                                      </span>
                                    )}
                                  </div>

                                  {slot.notes && (
                                    <p className="text-sm font-medium text-gray-600 bg-white/50 p-3 rounded-2xl border border-white/20 shadow-inner">
                                      {slot.notes}
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-col gap-2 flex-shrink-0">
                                  {canEdit && (
                                    <>
                                      <button
                                        onClick={() => startEdit(slot)}
                                        className="p-3 text-indigo-600 bg-white hover:bg-indigo-50 rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-90"
                                        aria-label="Edit"
                                      >
                                        <Edit2 className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSlot(slot.id)}
                                        className="p-3 text-red-600 bg-white hover:bg-red-50 rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-90"
                                        aria-label="Delete"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                  {!isAdmin && slot.isAvailable && !isOtherTuteeSlot && tutee && isOwnSlot && !isExamOrTest && (
                                    <button
                                      onClick={() => {
                                        setEditingRequest(null);
                                        setShowBookingRequest(true);
                                      }}
                                      className="p-4 rounded-2xl shadow-lg transition-all active:scale-90 transform hover:scale-105"
                                      style={{
                                        background: `linear-gradient(135deg, ${tutee.colorScheme.primary === 'pink' ? '#ec4899, #db2777' : tutee.colorScheme.primary === 'purple' ? '#a855f7, #9333ea' : tutee.colorScheme.primary === 'blue' ? '#3b82f6, #2563eb' : tutee.colorScheme.primary === 'green' ? '#10b981, #059669' : tutee.colorScheme.primary === 'indigo' ? '#6366f1, #4f46e5' : '#6366f1, #4f46e5'})`,
                                        color: 'white'
                                      }}
                                      aria-label="Request Booking"
                                      title="Request this time slot"
                                    >
                                      <CalendarPlus className="w-6 h-6" />
                                    </button>
                                  )}
                                  {!isAdmin && !slot.isAvailable && !isOtherTuteeSlot && tutee && isOwnSlot && !isExamOrTest && (
                                    <button
                                      onClick={() => {
                                        setEditingRequest(null);
                                        setRequestInitialData({
                                          startTime: slot.startTime,
                                          endTime: slot.endTime,
                                          notes: `Requesting time change for confirmed session on ${slot.date} at ${slot.startTime}`,
                                        });
                                        setShowBookingRequest(true);
                                      }}
                                      className="p-4 rounded-2xl shadow-lg transition-all active:scale-90 transform hover:scale-105 bg-amber-500 text-white"
                                      aria-label="Request Change"
                                      title="Request a change for this session"
                                    >
                                      <Clock className="w-6 h-6" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Booking Requests Section (for tutees) */}
                    {!isAdmin && tutee && requestsForSelectedDate.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          Pending Requests
                        </h4>
                        <div className="space-y-3">
                          {requestsForSelectedDate.map((request, index) => {
                            const formatTime = (time: string) => {
                              if (!time) return '';
                              return time.includes(':') && time.split(':').length === 3 
                                ? time.slice(0, 5) 
                                : time;
                            };

                            const getStatusColor = (status: BookingRequest['status']) => {
                              switch (status) {
                                case 'pending': return 'border-amber-100 bg-amber-50/50';
                                case 'approved': return 'border-green-100 bg-green-50/50';
                                case 'rejected': return 'border-red-100 bg-red-50/50';
                                case 'cancelled': return 'border-gray-100 bg-gray-50/50';
                                default: return 'border-gray-100 bg-gray-50/50';
                              }
                            };

                            const getStatusBadge = (status: BookingRequest['status']) => {
                              const styles = {
                                pending: 'bg-amber-100 text-amber-800',
                                approved: 'bg-green-100 text-green-800',
                                rejected: 'bg-red-100 text-red-800',
                                cancelled: 'bg-gray-100 text-gray-800',
                              };
                              return (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[status]}`}>
                                  {status}
                                </span>
                              );
                            };

                            return (
                              <div
                                key={request.id}
                                className={`p-4 rounded-[2rem] border-2 transition-all hover:shadow-md animate-fade-in-up ${getStatusColor(request.status)}`}
                                style={{ animationDelay: `${(slotsForSelectedDate.length + index) * 50}ms` }}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <Clock className="w-4 h-4 text-gray-400" />
                                      <span className="font-bold text-gray-700">
                                        {formatTime(request.requestedStartTime)} - {formatTime(request.requestedEndTime)}
                                      </span>
                                      {getStatusBadge(request.status)}
                                    </div>
                                    {request.tuteeNotes && (
                                      <p className="text-xs font-medium text-gray-500 italic">"{request.tuteeNotes}"</p>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    {request.status === 'pending' && (
                                      <button
                                        onClick={() => {
                                          setEditingRequest(request);
                                          setShowBookingRequest(true);
                                        }}
                                        className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all active:scale-90"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteRequest(request.id)}
                                      className="p-2 text-red-600 hover:bg-white rounded-xl transition-all active:scale-90"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 4. Action Buttons - Consolidated at the bottom (only for tutees) */}
                {!isAdmin && tutee && (
                  <div className="mt-auto pt-6 space-y-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingRequest(null);
                        setShowBookingRequest(true);
                      }}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${tutee?.colorScheme.gradient || 'from-indigo-500 to-indigo-600'} text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                    >
                      <CalendarPlus className="w-6 h-6" />
                      <span>Request Session</span>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setEditingSlot(null);
                          setNewSlot({
                            date: format(selectedDate, 'yyyy-MM-dd'),
                            startTime: '09:00',
                            endTime: '10:00',
                            tuteeId: tutee.id,
                            notes: '',
                            eventType: 'exam',
                          });
                          setShowAddModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-red-100 transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Exam</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingSlot(null);
                          setNewSlot({
                            date: format(selectedDate, 'yyyy-MM-dd'),
                            startTime: '09:00',
                            endTime: '10:00',
                            tuteeId: tutee.id,
                            notes: '',
                            eventType: 'test',
                          });
                          setShowAddModal(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-4 bg-blue-50 text-blue-600 border-2 border-blue-100 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-blue-100 transition-all active:scale-[0.98]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Test</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-lg w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
                  {editingSlot 
                    ? editingSlot.eventType === 'exam' 
                      ? 'Edit Exam' 
                      : editingSlot.eventType === 'test'
                      ? 'Edit Test'
                      : 'Edit Slot'
                    : 'New Slot'}
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  {format(parseISO(newSlot.date), 'EEEE, MMM d')}
                </p>
              </div>
              <button
                onClick={cancelEdit}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner"
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    Assigned Tutee
                  </label>
                  <Select
                    value={newSlot.tuteeId}
                    onChange={(value) => setNewSlot({ ...newSlot, tuteeId: value })}
                    options={tuteeOptions}
                    placeholder="All Tutees"
                    searchable={tuteeOptions.length > 5}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Event Category
                </label>
                <Select
                  value={newSlot.eventType}
                  onChange={(value) => setNewSlot({ ...newSlot, eventType: value as 'time_slot' | 'exam' | 'test' })}
                  options={[
                    { value: 'time_slot', label: 'Standard Session' },
                    { value: 'exam', label: 'Major Exam' },
                    { value: 'test', label: 'Class Test' },
                  ]}
                  placeholder="Select category"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Special Notes
                </label>
                <textarea
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                  rows={3}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-medium text-gray-800 shadow-inner"
                  placeholder="Add any reminders..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSlot ? () => handleUpdateSlot(editingSlot) : handleAddSlot}
                  className={`flex-1 px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all ${
                    tutee && !isAdmin
                      ? `bg-gradient-to-r ${tutee.colorScheme.gradient}`
                      : 'bg-indigo-600 shadow-indigo-200'
                  }`}
                >
                  {editingSlot ? 'Save Changes' : 'Create Session'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Delete Confirmation Modal for Time Slots */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, slotId: null })}
        onConfirm={confirmDelete}
        title="Delete Time Slot"
        message="Are you sure you want to delete this time slot? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Delete Confirmation Modal for Booking Requests */}
      <ConfirmationModal
        isOpen={deleteRequestConfirm.isOpen}
        onClose={() => setDeleteRequestConfirm({ isOpen: false, requestId: null })}
        onConfirm={confirmDeleteRequest}
        title="Delete Booking Request"
        message="Are you sure you want to delete this booking request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeletingRequest}
      />

      {/* Booking Request Modal */}
      {tutee && (
        <BookingRequestModal
          isOpen={showBookingRequest}
          onClose={() => {
            setShowBookingRequest(false);
            setEditingRequest(null);
          }}
          onSuccess={() => {
            setShowBookingRequest(false);
            setEditingRequest(null);
            loadBookingRequests();
            loadAvailableDates(); // Refresh available dates in case a request was approved
            if (onBookingRequestSuccess) {
              onBookingRequestSuccess();
            }
          }}
          selectedDate={editingRequest ? parseISO(editingRequest.requestedDate) : selectedDate}
          tutee={tutee}
          existingRequest={editingRequest}
          initialStartTime={requestInitialData.startTime}
          initialEndTime={requestInitialData.endTime}
          initialNotes={requestInitialData.notes}
          onDateChange={(date) => {
            // Update selected date if editing
            if (editingRequest) {
              setSelectedDate(date);
            }
          }}
        />
      )}
      {/* Feedback Button - only show if tutee is logged in (not admin mode) */}
    {!isAdmin && tutee && <FeedbackButton tutee={tutee} />}
    </>
  );
};

export default TuitionCalendar;

