import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Edit2, Calendar, User, Search, CheckCircle2, AlertCircle, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import { WorksheetEntry, fetchWorksheets, createWorksheet, updateWorksheet, deleteWorksheet } from '../../../services/worksheetService';
import { format, parseISO } from 'date-fns';
import AnimatedCard from '../../ui/AnimatedCard';

interface WorksheetTrackerProps {
  tuteeId: string;
  studentNames: string[]; // e.g. ["Rayne", "Jeffrey"]
}

type WorksheetStatus = 'Upcoming' | 'In Progress' | 'Completed';

const WorksheetTracker: React.FC<WorksheetTrackerProps> = ({ tuteeId, studentNames }) => {
  const [worksheets, setWorksheets] = useState<WorksheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorksheetEntry | null>(null);
  const [searchTerm, setSearchSearchTerm] = useState('');

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
      } else {
        await createWorksheet({ ...form, tuteeId });
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
    <AnimatedCard className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <ClipboardList className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Worksheet Tracker</h2>
              <p className="text-gray-500">Monitor progress and completion status</p>
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
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${
              showAddForm 
                ? 'bg-red-50 text-red-600' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
            }`}
          >
            <Plus className={`w-5 h-5 transition-transform duration-300 ${showAddForm ? 'rotate-45' : ''}`} />
            {showAddForm ? 'Close' : 'Add Worksheet'}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} className="mb-10 p-8 bg-white border-2 border-indigo-50 rounded-3xl shadow-xl shadow-indigo-50/50 animate-in fade-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Worksheet Name *</label>
                  <input
                    type="text"
                    value={form.worksheetName}
                    onChange={(e) => setForm({ ...form, worksheetName: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-medium"
                    placeholder="Enter worksheet title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Assigned Student *</label>
                  <div className="flex flex-wrap gap-3">
                    {studentNames.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setForm({ ...form, studentName: name })}
                        className={`px-6 py-3 rounded-xl font-bold transition-all border-2 ${
                          form.studentName === name
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                            : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Current Status</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Upcoming', 'In Progress', 'Completed'] as WorksheetStatus[]).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setForm({ 
                          ...form, 
                          status, 
                          completionPercentage: status === 'Completed' ? 100 : status === 'Upcoming' ? 0 : form.completionPercentage 
                        })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl font-bold transition-all border-2 ${
                          form.status === status
                            ? status === 'Completed' ? 'bg-green-600 border-green-600 text-white shadow-green-100' :
                              status === 'In Progress' ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100' :
                              'bg-gray-600 border-gray-600 text-white shadow-gray-100'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100'
                        }`}
                      >
                        {getStatusIcon(status)}
                        <span className="text-xs">{status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Completion Percentage ({form.completionPercentage}%)</label>
                  <div className="space-y-4">
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
                      className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                      <span>Start</span>
                      <span>50%</span>
                      <span>Done</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Target Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={form.completedDate}
                      onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                      className="w-full pl-14 pr-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                    placeholder="Add details about tasks, areas of improvement..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="mt-10 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingEntry(null);
                  resetForm();
                }}
                className="px-8 py-4 rounded-2xl text-base font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-12 py-4 rounded-2xl text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all transform active:scale-95"
              >
                {editingEntry ? 'Update Worksheet' : 'Save Worksheet'}
              </button>
            </div>
          </form>
        )}

        <div className="relative mb-10 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by worksheet name, student, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-gray-50/50 hover:bg-gray-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-3xl outline-none transition-all text-lg shadow-sm"
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-6 text-gray-400">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-lg">Loading your worksheets...</p>
          </div>
        ) : filteredWorksheets.length === 0 ? (
          <div className="py-24 text-center bg-gray-50/30 rounded-3xl border-2 border-dashed border-gray-100">
            <div className="bg-white w-20 h-20 rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-6 text-gray-300">
              <ClipboardList className="w-10 h-10" />
            </div>
            <p className="text-xl text-gray-500 font-bold">No worksheets found</p>
            <p className="text-gray-400 mt-2 max-w-sm mx-auto px-4">
              {searchTerm ? 'We couldn\'t find any matches for your search.' : 'You haven\'t added any worksheets yet. Click "Add Worksheet" to get started!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorksheets.map((entry) => (
              <div 
                key={entry.id} 
                className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(entry.status)}`}>
                        {getStatusIcon(entry.status)}
                        {entry.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        entry.studentName.toLowerCase() === 'rayne' ? 'bg-pink-50 text-pink-600' : 
                        entry.studentName.toLowerCase() === 'jeffrey' ? 'bg-blue-50 text-blue-600' : 
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {entry.studentName}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(parseISO(entry.completedDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 truncate mb-2">{entry.worksheetName}</h3>
                    {entry.notes && <p className="text-sm text-gray-500 line-clamp-1">{entry.notes}</p>}
                  </div>

                  <div className="w-full lg:w-64 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Progress</span>
                      <span className="text-indigo-600">{entry.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          entry.completionPercentage === 100 ? 'bg-green-500' :
                          entry.completionPercentage > 50 ? 'bg-indigo-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${entry.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2 self-end lg:self-center opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
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
