import { useState, useEffect } from 'react';
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
  const [tuteeOptions, setTuteeOptions] = useState<SelectOption[]>([
    { value: '', label: 'All Tutees' }
  ]);
  const [newSlot, setNewSlot] = useState({
    date: format(selectedDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    tuteeId: '',
    notes: '',
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
  }, [isAdmin, tutee]);

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
        // If it's not their slot, mark it as unavailable
        if (!isOwnSlot) {
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
      const input: CreateAvailableDateInput = {
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        tuteeId: newSlot.tuteeId || undefined,
        notes: newSlot.notes || undefined,
        isAvailable: true,
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
      });
    } catch (err) {
      setError('Failed to add time slot. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateSlot = async (slot: AvailableDate) => {
    try {
      setError('');
      await updateAvailableDate({
        id: slot.id,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        tuteeId: newSlot.tuteeId || null,
        notes: newSlot.notes !== undefined ? (newSlot.notes.trim() || null) : undefined,
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

    // Get all available slots for this tutee (their own or unassigned)
    const tuteeSlots = availableDates
      .filter((slot) => {
        const isOwnSlot = !slot.tuteeId || slot.tuteeId === tutee.id;
        return slot.isAvailable && isOwnSlot;
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
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8">
        {/* Greeting & Status Banner */}
        {!isAdmin && tutee && (
          <div className={`mb-6 p-4 rounded-xl border-2 bg-gradient-to-r ${tutee.colorScheme.gradient} bg-opacity-10 border-opacity-30 animate-fade-in-up`} style={{
            borderColor: tutee.colorScheme.primary === 'pink' ? '#ec4899' : 
                         tutee.colorScheme.primary === 'purple' ? '#a855f7' : 
                         tutee.colorScheme.primary === 'blue' ? '#3b82f6' : 
                         tutee.colorScheme.primary === 'green' ? '#10b981' : 
                         tutee.colorScheme.primary === 'indigo' ? '#6366f1' : '#6366f1',
          }}>
            {tuitionInfo?.type === 'in_progress' ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg">
                  <Clock className="w-5 h-5" style={{
                    color: tutee.colorScheme.primary === 'pink' ? '#ec4899' : 
                           tutee.colorScheme.primary === 'purple' ? '#a855f7' : 
                           tutee.colorScheme.primary === 'blue' ? '#3b82f6' : 
                           tutee.colorScheme.primary === 'green' ? '#10b981' : 
                           tutee.colorScheme.primary === 'indigo' ? '#6366f1' : '#6366f1',
                  }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Hi {tutee.name}! Tuition in progress
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(tuitionInfo.slot.date), 'EEEE, d MMMM yyyy')} • {tuitionInfo.slot.startTime} - {tuitionInfo.slot.endTime}
                  </p>
                </div>
              </div>
            ) : tuitionInfo?.type === 'upcoming' ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg">
                  <CalendarIcon className="w-5 h-5" style={{
                    color: tutee.colorScheme.primary === 'pink' ? '#ec4899' : 
                           tutee.colorScheme.primary === 'purple' ? '#a855f7' : 
                           tutee.colorScheme.primary === 'blue' ? '#3b82f6' : 
                           tutee.colorScheme.primary === 'green' ? '#10b981' : 
                           tutee.colorScheme.primary === 'indigo' ? '#6366f1' : '#6366f1',
                  }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Hi {tutee.name}! Tuition in{' '}
                    {tuitionInfo.days > 0 && (
                      <>
                        <span className="font-bold">{tuitionInfo.days} {tuitionInfo.days === 1 ? 'day' : 'days'}</span>
                        {(tuitionInfo.hours > 0 || tuitionInfo.minutes > 0) && ' and '}
                      </>
                    )}
                    {tuitionInfo.hours > 0 && (
                      <>
                        <span className="font-bold">{tuitionInfo.hours} {tuitionInfo.hours === 1 ? 'hour' : 'hours'}</span>
                        {tuitionInfo.minutes > 0 && ' and '}
                      </>
                    )}
                    {tuitionInfo.minutes > 0 && (
                      <span className="font-bold">{tuitionInfo.minutes} {tuitionInfo.minutes === 1 ? 'minute' : 'minutes'}</span>
                    )}
                    {tuitionInfo.days === 0 && tuitionInfo.hours === 0 && tuitionInfo.minutes === 0 && (
                      <span className="font-bold">soon!</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(tuitionInfo.slot.date), 'EEEE, d MMMM yyyy')} • {tuitionInfo.slot.startTime} - {tuitionInfo.slot.endTime}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    Hi {tutee.name}!
                  </p>
                  <p className="text-sm text-gray-600">
                    No upcoming tuition sessions scheduled
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Available Dates</h2>
            <p className="text-sm text-gray-600">View and book available time slots</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors-smooth press-effect"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Slot</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div>
          <div className="mb-4">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="w-full border-0 rounded-lg"
            />
          </div>
          <style>{`
            .react-calendar {
              width: 100%;
              border: none;
              font-family: inherit;
            }
            .react-calendar__tile {
              padding: 0.75em 0.5em;
              position: relative;
            }
            .react-calendar__tile--active {
              background: #4f46e5;
              color: white;
            }
            .react-calendar__tile--active:enabled:hover {
              background: #4338ca;
            }
            .react-calendar__tile.has-available-slots {
              background: #f0fdf4;
            }
            .react-calendar__tile.has-available-slots:hover {
              background: #dcfce7;
            }
            .react-calendar__tile.has-requests {
              background: #fef3c7;
            }
            .react-calendar__tile.has-requests:hover {
              background: #fde68a;
            }
            .react-calendar__tile.has-available-slots.has-requests {
              background: #f0fdf4;
            }
            .react-calendar__tile.has-available-slots.has-requests:hover {
              background: #dcfce7;
            }
            .react-calendar__tile--now {
              background: #dbeafe !important;
              border: 2px solid #3b82f6 !important;
              font-weight: 600;
            }
            .react-calendar__tile--now:enabled:hover {
              background: #bfdbfe !important;
            }
            .react-calendar__tile--now.has-available-slots {
              background: #dcfce7 !important;
              border: 2px solid #10b981 !important;
            }
            .react-calendar__tile--now.has-available-slots:enabled:hover {
              background: #bbf7d0 !important;
            }
          `}</style>
        </div>

        {/* Time Slots */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {format(selectedDate, 'EEEE, d MMMM yyyy')}
            </h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : slotsForSelectedDate.length === 0 && (!tutee || requestsForSelectedDate.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No available slots for this date</p>
                {isAdmin ? (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Add a time slot
                  </button>
                ) : tutee ? (
                  <button
                    onClick={() => {
                      setEditingRequest(null);
                      setShowBookingRequest(true);
                    }}
                    className={`mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${tutee?.colorScheme.gradient || 'from-indigo-500 to-indigo-600'} text-white rounded-lg hover:opacity-90 transition-colors-smooth press-effect mx-auto`}
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Request Time Slot</span>
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {slotsForSelectedDate.map((slot, index) => {
                  const isOtherTuteeSlot = (slot as any).isOtherTuteeSlot;
                  const slotTutee = slot.tuteeId ? getTuteeByIdSync(slot.tuteeId) : null;
                  const isOwnSlot = !isAdmin && tutee && (!slot.tuteeId || slot.tuteeId === tutee.id);
                  
                  return (
                    <div
                    key={slot.id}
                    className={`p-4 rounded-lg border-2 transition-smooth animate-fade-in-up ${
                      slot.isAvailable && !isOtherTuteeSlot
                        ? 'border-green-200 bg-green-50'
                        : isOtherTuteeSlot
                        ? 'border-orange-200 bg-orange-50 opacity-75'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold text-gray-800">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.tuteeId && slotTutee && (
                            <span 
                              className={`text-xs px-2 py-1 rounded flex items-center gap-1 text-white bg-gradient-to-r ${slotTutee.colorScheme.gradient}`}
                            >
                              <User className="w-3 h-3" />
                              {slotTutee.name}
                            </span>
                          )}
                          {isOtherTuteeSlot && (
                            <span className="text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded font-medium">
                              Not Available
                            </span>
                          )}
                          {!slot.isAvailable && !isOtherTuteeSlot && (
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                              Booked
                            </span>
                          )}
                        </div>
                        {slot.notes && (
                          <p className="text-sm text-gray-600 mt-1">{slot.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => startEdit(slot)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors-smooth press-effect"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors-smooth press-effect"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!isAdmin && slot.isAvailable && !isOtherTuteeSlot && tutee && isOwnSlot && (
                          <button
                            onClick={() => {
                              setEditingRequest(null);
                              setShowBookingRequest(true);
                            }}
                            className="p-2 rounded transition-colors-smooth press-effect"
                            style={{
                              color: tutee.colorScheme.primary === 'pink' ? '#ec4899' : tutee.colorScheme.primary === 'purple' ? '#a855f7' : tutee.colorScheme.primary === 'blue' ? '#3b82f6' : tutee.colorScheme.primary === 'green' ? '#10b981' : tutee.colorScheme.primary === 'indigo' ? '#6366f1' : '#6366f1',
                            }}
                            onMouseEnter={(e) => {
                              const primary = tutee.colorScheme.primary;
                              const bgColor = primary === 'pink' ? '#fdf2f8' : primary === 'purple' ? '#faf5ff' : primary === 'blue' ? '#eff6ff' : primary === 'green' ? '#f0fdf4' : primary === 'indigo' ? '#eef2ff' : '#eef2ff';
                              e.currentTarget.style.backgroundColor = bgColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            aria-label="Request Booking"
                            title="Request this time slot"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>
                        )}
                        {isOtherTuteeSlot && (
                          <span className="text-xs text-orange-700 font-medium px-2 py-1">
                            Another tutee's slot
                          </span>
                        )}
                      </div>
                    </div>
                    </div>
                  );
                })}
                {!isAdmin && tutee && (
                  <button
                    onClick={() => {
                      setEditingRequest(null);
                      setShowBookingRequest(true);
                    }}
                    className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${tutee?.colorScheme.gradient || 'from-indigo-500 to-indigo-600'} text-white rounded-lg hover:opacity-90 transition-colors-smooth press-effect animate-fade-in-up`}
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Request Different Time</span>
                  </button>
                )}
              </div>
            )}

            {/* Booking Requests Section (for tutees) */}
            {!isAdmin && tutee && requestsForSelectedDate.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Your Booking Requests
                </h4>
                <div className="space-y-3">
                  {requestsForSelectedDate.map((request, index) => {
                    // Format time to remove seconds if present (ensure HH:mm format)
                    const formatTime = (time: string) => {
                      if (!time) return '';
                      // If time includes seconds (HH:mm:ss), remove them
                      return time.includes(':') && time.split(':').length === 3 
                        ? time.slice(0, 5) 
                        : time;
                    };

                    const getStatusColor = (status: BookingRequest['status']) => {
                      switch (status) {
                        case 'pending':
                          return 'border-amber-200 bg-amber-50';
                        case 'approved':
                          return 'border-green-200 bg-green-50';
                        case 'rejected':
                          return 'border-red-200 bg-red-50';
                        case 'cancelled':
                          return 'border-gray-200 bg-gray-50';
                        default:
                          return 'border-gray-200 bg-gray-50';
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      );
                    };

                    return (
                      <div
                        key={request.id}
                        className={`p-4 rounded-lg border-2 transition-smooth animate-fade-in-up ${getStatusColor(request.status)}`}
                        style={{ animationDelay: `${(slotsForSelectedDate.length + index) * 50}ms` }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-gray-800">
                                {formatTime(request.requestedStartTime)} - {formatTime(request.requestedEndTime)}
                              </span>
                              {getStatusBadge(request.status)}
                            </div>
                            {request.tuteeNotes && (
                              <p className="text-sm text-gray-600 mt-1">{request.tuteeNotes}</p>
                            )}
                            {request.adminNotes && (
                              <p className="text-sm text-indigo-700 mt-1 font-medium">
                                Admin: {request.adminNotes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingRequest(request);
                                    setShowBookingRequest(true);
                                  }}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors-smooth press-effect"
                                  aria-label="Edit Request"
                                  title="Edit this request"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRequest(request.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors-smooth press-effect"
                                  aria-label="Delete Request"
                                  title="Delete this request"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {/* Allow deletion of all request statuses */}
                            {request.status !== 'pending' && (
                              <button
                                onClick={() => handleDeleteRequest(request.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors-smooth press-effect"
                                aria-label="Delete Request"
                                title="Delete this request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-modal-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth press-effect"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    step="60"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <Select
                  value={newSlot.tuteeId}
                  onChange={(value) => setNewSlot({ ...newSlot, tuteeId: value })}
                  options={tuteeOptions}
                  placeholder="All Tutees"
                  label="For Tutee (optional)"
                  searchable={tuteeOptions.length > 5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Add any notes about this time slot..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSlot ? () => handleUpdateSlot(editingSlot) : handleAddSlot}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors-smooth press-effect"
                >
                  {editingSlot ? 'Update' : 'Add'} Slot
                </button>
              </div>
            </div>
          </div>
        </div>
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
          onDateChange={(date) => {
            // Update selected date if editing
            if (editingRequest) {
              setSelectedDate(date);
            }
          }}
        />
      )}
    </div>
    {/* Feedback Button - only show if tutee is logged in (not admin mode) */}
    {!isAdmin && tutee && <FeedbackButton tutee={tutee} />}
    </>
  );
};

export default TuitionCalendar;

