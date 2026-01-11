import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  Calendar as CalendarIcon, Clock, X, Plus, Edit2, Trash2, 
  XCircle, User, Loader2, CheckCircle2
} from 'lucide-react';
import { AvailableDate, Tutee } from '../../../types/tuition';
import { getTutees, getTuteeByIdSync } from '../../../config/tutees';
import Select, { SelectOption } from '../../ui/Select';
import * as CalendarService from '../../../services/calendarService';
import { format, isSameDay, parseISO, parse } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

const AdminTuitionCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailableDate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; slotId: string | null }>({
    isOpen: false,
    slotId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [tuteeOptions, setTuteeOptions] = useState<SelectOption[]>([]);
  
  const [newSlot, setNewSlot] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    tuteeId: '',
    notes: '',
    eventType: 'time_slot' as 'time_slot' | 'exam' | 'test',
    isConfirmed: true, // Admin-added sessions are confirmed by default
  });

  // Load tutees
  useEffect(() => {
    const loadTutees = async () => {
      try {
        const tutees = await getTutees();
        setTuteeOptions(tutees.map(t => ({ value: t.id, label: t.name })));
      } catch (error) {
        console.error('Failed to load tutees:', error);
      }
    };
    loadTutees();
  }, []);

  // Fetch all available dates
  useEffect(() => {
    loadAvailableDates();
  }, []);

  const loadAvailableDates = async () => {
    try {
      setLoading(true);
      setError('');
      const dates = await CalendarService.fetchAvailableDates();
      setAvailableDates(dates);
    } catch (err) {
      setError('Failed to load sessions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handleSaveSlot = async () => {
    if (!newSlot.tuteeId && newSlot.eventType === 'time_slot' && newSlot.isConfirmed) {
      setError('Please select a tutee for confirmed sessions.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const input = {
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        tuteeId: newSlot.tuteeId,
        notes: newSlot.notes || undefined,
        isAvailable: !newSlot.isConfirmed,
        eventType: newSlot.eventType,
      };

      if (editingSlot) {
        await CalendarService.updateAvailableDate({
          id: editingSlot.id,
          ...input,
          bookedBy: newSlot.isConfirmed ? newSlot.tuteeId : null,
          isAvailable: !newSlot.isConfirmed,
        });
        setSuccess('Session updated successfully!');
      } else {
        if (newSlot.isConfirmed && newSlot.tuteeId) {
          await CalendarService.addConfirmedSessionDirectly(input);
        } else {
          await CalendarService.createAvailableDate(input);
        }
        setSuccess('Session created successfully!');
      }

      await loadAvailableDates();
      setShowAddModal(false);
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save session. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingSlot(null);
    setNewSlot({
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '10:00',
      tuteeId: '',
      notes: '',
      eventType: 'time_slot',
      isConfirmed: true,
    });
  };

  const startEdit = (slot: AvailableDate) => {
    setEditingSlot(slot);
    setNewSlot({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      tuteeId: slot.tuteeId || slot.bookedBy || '',
      notes: slot.notes || '',
      eventType: slot.eventType || 'time_slot',
      isConfirmed: !slot.isAvailable,
    });
    setShowAddModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.slotId) return;

    try {
      setIsDeleting(true);
      setError('');
      await CalendarService.deleteAvailableDate(deleteConfirm.slotId);
      await loadAvailableDates();
      setDeleteConfirm({ isOpen: false, slotId: null });
      setSuccess('Session deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete session.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const slotsForSelectedDate = availableDates
    .filter((slot) => slot.date === format(selectedDate, 'yyyy-MM-dd'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySlots = availableDates.filter(s => s.date === dateStr);
      
      if (daySlots.length > 0) {
        const hasConfirmed = daySlots.some(s => !s.isAvailable);
        const hasAvailable = daySlots.some(s => s.isAvailable);
        
        return (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {hasConfirmed && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
            {hasAvailable && <div className="w-1 h-1 bg-green-500 rounded-full" />}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm animate-fade-in">
      <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Admin Tuition Calendar
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Manage all tutee sessions and add confirmed dates directly
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Session
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-100 rounded-2xl flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-sm font-bold text-green-700">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              tileContent={tileContent}
              className="w-full border-0 rounded-xl"
            />
            <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                Confirmed
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Available Slot
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
              {format(selectedDate, 'EEEE, d MMM')}
              <span className="text-xs font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                {slotsForSelectedDate.length} {slotsForSelectedDate.length === 1 ? 'Event' : 'Events'}
              </span>
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            ) : slotsForSelectedDate.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No sessions scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {slotsForSelectedDate.map((slot) => {
                  const tutee = slot.tuteeId ? getTuteeByIdSync(slot.tuteeId) : null;
                  return (
                    <div 
                      key={slot.id}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all hover:shadow-md ${
                        !slot.isAvailable 
                          ? 'bg-indigo-50/50 border-indigo-100' 
                          : 'bg-green-50/50 border-green-100'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-bold text-gray-800">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {!slot.isAvailable && (
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white rounded-full font-black uppercase tracking-tighter">
                              Confirmed
                            </span>
                          )}
                        </div>
                        {tutee && (
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${tutee.colorScheme.gradient}`}>
                            <User className="w-3 h-3" />
                            {tutee.name}
                          </div>
                        )}
                        {slot.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">"{slot.notes}"</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEdit(slot)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, slotId: slot.id })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-lg w-full animate-modal-content border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-gray-800">
                  {editingSlot ? 'Edit Session' : 'Add New Session'}
                </h3>
                <p className="text-sm font-bold text-indigo-600 mt-1">
                  {format(selectedDate, 'd MMM yyyy (EEE)')}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Session Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewSlot({ ...newSlot, isConfirmed: true })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${newSlot.isConfirmed ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 border border-gray-200'}`}
                    >
                      Confirmed
                    </button>
                    <button
                      onClick={() => setNewSlot({ ...newSlot, isConfirmed: false })}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all ${!newSlot.isConfirmed ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-white text-gray-500 border border-gray-200'}`}
                    >
                      Available Slot
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">End Time</label>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Tutee</label>
                <Select
                  value={newSlot.tuteeId}
                  onChange={(val) => setNewSlot({ ...newSlot, tuteeId: val })}
                  options={[
                    { value: '', label: 'None / Multiple' },
                    ...tuteeOptions
                  ]}
                  placeholder="Select a tutee"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                <Select
                  value={newSlot.eventType}
                  onChange={(val) => setNewSlot({ ...newSlot, eventType: val as any })}
                  options={[
                    { value: 'time_slot', label: 'Regular Tuition' },
                    { value: 'exam', label: 'Major Exam' },
                    { value: 'test', label: 'Class Test' },
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Notes</label>
                <textarea
                  value={newSlot.notes}
                  onChange={(e) => setNewSlot({ ...newSlot, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all font-medium text-gray-800"
                  placeholder="Any reminders..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSlot}
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingSlot ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, slotId: null })}
        onConfirm={confirmDelete}
        title="Delete Session"
        message="Are you sure you want to delete this session? This will also remove any linked earnings records."
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminTuitionCalendar;
