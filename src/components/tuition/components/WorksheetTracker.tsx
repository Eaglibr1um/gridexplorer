import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Edit2, Calendar, User, Search, CheckCircle2, AlertCircle, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WorksheetEntry, fetchWorksheets, createWorksheet, updateWorksheet, deleteWorksheet } from '../../../services/worksheetService';
import { format, parseISO } from 'date-fns';
import AnimatedCard from '../../ui/AnimatedCard';

interface WorksheetTrackerProps {
  tuteeId: string;
  studentNames: string[]; // e.g. ["Rayne", "Jeffrey"]
  colorScheme?: {
    primary: string;
    secondary: string;
    gradient: string;
  };
}

type WorksheetStatus = 'Upcoming' | 'In Progress' | 'Completed';

const WorksheetTracker: React.FC<WorksheetTrackerProps> = ({ tuteeId, studentNames, colorScheme }) => {
  const [worksheets, setWorksheets] = useState<WorksheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorksheetEntry | null>(null);
  const [searchTerm, setSearchSearchTerm] = useState('');

  const primaryColor = colorScheme?.primary || 'indigo';
  const gradientClass = colorScheme?.gradient || 'from-indigo-600 to-purple-600';
  const bgPrimary = `bg-${primaryColor}-600`;
  const textPrimary = `text-${primaryColor}-600`;
  const borderPrimary = `border-${primaryColor}-500`;
  const shadowPrimary = `shadow-${primaryColor}-100`;
  const hoverBgPrimary = `hover:bg-${primaryColor}-700`;
  const focusBorderPrimary = `focus:border-${primaryColor}-500`;
  const accentPrimary = `accent-${primaryColor}-600`;

  const [form, setForm] = useState<{
    worksheetName: string;
    studentName: string;
    completedDate: string;
    status: WorksheetStatus;
    completionPercentage: number;
    notes: string;
  }>({
    worksheetName: '',
    studentName: studentNames[0] || '',
    completedDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'Upcoming',
    completionPercentage: 0,
    notes: ''
  });

  useEffect(() => {
    loadWorksheets();
  }, [tuteeId]);

  const loadWorksheets = async () => {
    try {
      setLoading(true);
      const data = await fetchWorksheets(tuteeId);
      setWorksheets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load worksheets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.worksheetName || !form.studentName || !form.completedDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      if (editingEntry) {
        await updateWorksheet(editingEntry.id, form);
        // Celebration if marked as completed now
        if (form.status === 'Completed' && editingEntry.status !== 'Completed') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } else {
        await createWorksheet({ ...form, tuteeId });
        // Celebration if added as completed
        if (form.status === 'Completed') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
      
      resetForm();
      setShowAddForm(false);
      setEditingEntry(null);
      loadWorksheets();
    } catch (err: any) {
      setError(err.message || 'Failed to save worksheet');
    }
  };

  const resetForm = () => {
    setForm({
      worksheetName: '',
      studentName: studentNames[0] || '',
      completedDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Upcoming',
      completionPercentage: 0,
      notes: ''
    });
  };

  const handleEdit = (entry: WorksheetEntry) => {
    setEditingEntry(entry);
    setForm({
      worksheetName: entry.worksheetName,
      studentName: entry.studentName,
      completedDate: entry.completedDate,
      status: entry.status,
      completionPercentage: entry.completionPercentage,
      notes: entry.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteWorksheet(id);
      loadWorksheets();
    } catch (err: any) {
      setError(err.message || 'Failed to delete worksheet');
    }
  };

  const getStatusIcon = (status: WorksheetStatus) => {
    switch (status) {
      case 'Upcoming': return <Clock className="w-4 h-4" />;
      case 'In Progress': return <PlayCircle className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: WorksheetStatus) => {
    switch (status) {
      case 'Upcoming': return 'bg-gray-100 text-gray-600';
      case 'In Progress': return 'bg-blue-100 text-blue-600';
      case 'Completed': return 'bg-green-100 text-green-600';
    }
  };

  const filteredWorksheets = worksheets.filter(w => 
    w.worksheetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatedCard className="overflow-hidden border-white/40 bg-white/60 backdrop-blur-sm rounded-[2.5rem] shadow-xl">
      {/* Header with Gradient */}
      <div className={`p-6 sm:p-8 bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight leading-tight">Worksheet Tracker</h2>
              <p className="text-xs text-white/80 font-bold uppercase tracking-widest mt-1">Status & Progress</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (showAddForm) {
                setShowAddForm(false);
                setEditingEntry(null);
                resetForm();
              } else {
                setShowAddForm(true);
              }
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white ${textPrimary} rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 active:scale-95 transition-all`}
          >
            <Plus className={`w-5 h-5 transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} />
            {showAddForm ? 'Cancel' : 'Add New'}
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-8">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} className={`mb-10 p-5 sm:p-8 bg-white border-2 border-${primaryColor}-50 rounded-3xl shadow-xl shadow-${primaryColor}-50/50 animate-in fade-in zoom-in-95 duration-300`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Worksheet Name *</label>
                  <input
                    type="text"
                    value={form.worksheetName}
                    onChange={(e) => setForm({ ...form, worksheetName: e.target.value })}
                    className={`w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 ${focusBorderPrimary} focus:bg-white outline-none transition-all text-lg font-bold text-gray-800`}
                    placeholder="E.g. Algebra Basics"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Assigned Student *</label>
                  <div className="flex flex-wrap gap-2">
                    {studentNames.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setForm({ ...form, studentName: name })}
                        className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black uppercase tracking-widest transition-all border-2 text-xs ${
                          form.studentName === name
                            ? `${bgPrimary} border-${primaryColor}-600 text-white shadow-md ${shadowPrimary}`
                            : `bg-white border-gray-100 text-gray-400 hover:border-${primaryColor}-200 ${textPrimary.replace('text-', 'hover:text-')}`
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Current Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Upcoming', 'In Progress', 'Completed'] as WorksheetStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setForm({ 
                          ...form, 
                          status, 
                          completionPercentage: status === 'Completed' ? 100 : status === 'Upcoming' ? 0 : form.completionPercentage 
                        })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl font-black uppercase tracking-widest transition-all border-2 text-[10px] ${
                          form.status === status
                            ? status === 'Completed' ? 'bg-green-600 border-green-600 text-white shadow-green-100' :
                              status === 'In Progress' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' :
                              'bg-gray-600 border-gray-600 text-white shadow-gray-100'
                            : `bg-white border-gray-100 text-gray-400 hover:border-${primaryColor}-100`
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span>{status.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Progress: {form.completionPercentage}%</label>
                  <div className="space-y-4 px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={form.completionPercentage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setForm({ 
                          ...form, 
                          completionPercentage: val,
                          status: val === 100 ? 'Completed' : val > 0 ? 'In Progress' : 'Upcoming'
                        });
                      }}
                      className={`w-full h-2.5 bg-gray-100 rounded-lg appearance-none cursor-pointer ${accentPrimary}`}
                    />
                    <div className="flex justify-between text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      <span>Start</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Due Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={form.completedDate}
                      onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                      className={`w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 ${focusBorderPrimary} focus:bg-white outline-none transition-all font-bold text-gray-800`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={`w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 ${focusBorderPrimary} focus:bg-white outline-none transition-all font-medium text-gray-800 resize-none`}
                    placeholder="What needs to be done?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                className="order-2 sm:order-1 px-8 py-4 rounded-2xl text-base font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`order-1 sm:order-2 px-12 py-4 rounded-2xl text-base font-black uppercase tracking-widest text-white ${bgPrimary} ${hoverBgPrimary} shadow-xl ${shadowPrimary} transition-all transform active:scale-95`}
              >
                {editingEntry ? 'Update' : 'Save'} Worksheet
              </button>
            </div>
          </form>
        )}

        <div className="relative mb-8 group">
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 group-focus-within:${textPrimary} transition-colors`} />
          <input
            type="text"
            placeholder="Search worksheets..."
            value={searchTerm}
            onChange={(e) => setSearchSearchTerm(e.target.value)}
            className={`w-full pl-14 pr-6 py-5 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:border-${primaryColor}-100 focus:bg-white rounded-3xl outline-none transition-all text-lg font-bold shadow-inner`}
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className={`w-12 h-12 border-4 ${textPrimary.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`}></div>
            <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Syncing data...</p>
          </div>
        ) : filteredWorksheets.length === 0 ? (
          <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <div className="bg-white w-20 h-20 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-200">
              <ClipboardList className="w-10 h-10" />
            </div>
            <p className="text-xl text-gray-400 font-black uppercase tracking-tight">Empty List</p>
            <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px] mt-2 max-w-xs mx-auto px-4">
              {searchTerm ? 'Try a different search' : 'Start tracking by adding your first worksheet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorksheets.map((entry) => (
              <div 
                key={entry.id} 
                className={`group bg-white/80 p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-${primaryColor}-100 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] touch-manipulation`}
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                        entry.status === 'Completed' ? 'bg-green-500 text-white border-green-600' :
                        entry.status === 'In Progress' ? 'bg-blue-500 text-white border-blue-600' :
                        'bg-gray-400 text-white border-gray-500'
                      }`}>
                        {getStatusIcon(entry.status)}
                        {entry.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                        entry.studentName.toLowerCase() === 'rayne' ? 'bg-pink-50 border-pink-100 text-pink-600' : 
                        entry.studentName.toLowerCase() === 'jeffrey' ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                        `${bgPrimary.replace('bg-', 'bg-')}-50 border-${primaryColor}-100 ${textPrimary}`
                      }`}>
                        {entry.studentName}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-auto lg:ml-0 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(parseISO(entry.completedDate), 'dd MMM')}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 truncate mb-1 leading-tight">{entry.worksheetName}</h3>
                    {entry.notes && <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">{entry.notes}</p>}
                  </div>

                  <div className="w-full lg:w-64 space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Progress</span>
                      <span className={textPrimary}>{entry.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 rounded-full ${
                          entry.completionPercentage === 100 ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-green-100' :
                          entry.completionPercentage > 50 ? `bg-gradient-to-r ${gradientClass} ${shadowPrimary}` : 
                          'bg-gradient-to-r from-blue-400 to-blue-500 shadow-blue-100'
                        }`}
                        style={{ width: `${entry.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                    <button
                      onClick={() => handleEdit(entry)}
                      className={`flex-1 lg:flex-none p-4 lg:p-3 text-gray-400 ${textPrimary.replace('text-', 'hover:text-')} ${bgPrimary.replace('bg-', 'hover:bg-')}-50 rounded-2xl transition-all border border-transparent ${borderPrimary.replace('border-', 'hover:border-')}-100 flex justify-center items-center`}
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="flex-1 lg:flex-none p-4 lg:p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 flex justify-center items-center"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AnimatedCard>
  );
};

export default WorksheetTracker;
