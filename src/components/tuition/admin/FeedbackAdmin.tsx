import { useState, useEffect, useMemo } from 'react';
import { MessageSquare, X, Filter, Bug, Lightbulb, HelpCircle, FileText, CheckCircle, Clock, AlertCircle, XCircle, Edit2, Save, BookOpen, GraduationCap, Search, RotateCcw, ChevronDown } from 'lucide-react';
import { fetchAllFeedback, updateFeedback, FeedbackWithTutee, UpdateFeedbackInput } from '../../../services/feedbackService';
import * as LucideIcons from 'lucide-react';

// Icon mapping for tutees - dynamically import icons as needed
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  User: LucideIcons.User,
  Star: LucideIcons.Star,
  Heart: LucideIcons.Heart,
  Zap: LucideIcons.Zap,
  Target: LucideIcons.Target,
  Award: LucideIcons.Award,
  Trophy: LucideIcons.Trophy,
  Lightbulb: LucideIcons.Lightbulb,
  Brain: LucideIcons.Brain,
  Rocket: LucideIcons.Rocket,
  Sparkles: LucideIcons.Sparkles,
  BookMarked: LucideIcons.BookMarked,
  School: LucideIcons.School,
  PenTool: LucideIcons.PenTool,
  Calculator: LucideIcons.Calculator,
  FlaskConical: LucideIcons.FlaskConical,
  Atom: LucideIcons.Atom,
  Music: LucideIcons.Music,
  Palette: LucideIcons.Palette,
  Camera: LucideIcons.Camera,
  Gamepad2: LucideIcons.Gamepad2,
  Code: LucideIcons.Code,
  Globe: LucideIcons.Globe,
  Coffee: LucideIcons.Coffee,
  Smile: LucideIcons.Smile,
};

const FeedbackAdmin = () => {
  const [feedback, setFeedback] = useState<FeedbackWithTutee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [editAdminNotes, setEditAdminNotes] = useState('');

  const getIcon = (iconName: string) => {
    // Try direct mapping first
    if (iconMap[iconName]) {
      return iconMap[iconName];
    }
    // Try dynamic lookup from LucideIcons
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || BookOpen;
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAllFeedback();
      setFeedback(data);
    } catch (err) {
      setError('Failed to load feedback. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedback = useMemo(() => {
    let filtered = [...feedback];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(f => f.type === typeFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(f => f.priority === priorityFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(term) || 
        f.description.toLowerCase().includes(term) ||
        f.tuteeName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [feedback, statusFilter, typeFilter, priorityFilter, searchTerm]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      status: {
        all: feedback.length,
        open: feedback.filter(f => f.status === 'open').length,
        in_progress: feedback.filter(f => f.status === 'in_progress').length,
        resolved: feedback.filter(f => f.status === 'resolved').length,
        closed: feedback.filter(f => f.status === 'closed').length,
      },
      type: {
        all: feedback.length,
        bug: feedback.filter(f => f.type === 'bug').length,
        feature_request: feedback.filter(f => f.type === 'feature_request').length,
        question: feedback.filter(f => f.type === 'question').length,
        other: feedback.filter(f => f.type === 'other').length,
      },
      priority: {
        all: feedback.length,
        urgent: feedback.filter(f => f.priority === 'urgent').length,
        high: feedback.filter(f => f.priority === 'high').length,
        medium: feedback.filter(f => f.priority === 'medium').length,
        low: feedback.filter(f => f.priority === 'low').length,
      }
    };
  }, [feedback]);

  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setPriorityFilter('all');
    setSearchTerm('');
  };

  const handleEdit = (item: FeedbackWithTutee) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setEditAdminNotes(item.adminNotes || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditStatus('open');
    setEditAdminNotes('');
  };

  const handleSave = async (id: string) => {
    try {
      setError('');
      const update: UpdateFeedbackInput = {
        id,
        status: editStatus,
        adminNotes: editAdminNotes.trim() || undefined,
      };
      await updateFeedback(update);
      await loadFeedback();
      setEditingId(null);
    } catch (err) {
      setError('Failed to update feedback. Please try again.');
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return Bug;
      case 'feature_request':
        return Lightbulb;
      case 'question':
        return HelpCircle;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'feature_request':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'question':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return AlertCircle;
      case 'in_progress':
        return Clock;
      case 'resolved':
        return CheckCircle;
      case 'closed':
        return XCircle;
      default:
        return MessageSquare;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  const FilterPill = ({ label, value, current, count, onClick }: { label: string, value: string, current: string, count: number, onClick: (v: string) => void }) => (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 press-effect ${
        current === value
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-105'
          : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <span>{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
        current === value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Feedback Inbox</h3>
              <p className="text-sm font-medium text-gray-500">
                Manage and track improvements from your students
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-72 pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Modern Filter Section - Only show if more than 5 items or if filter is active */}
      {(feedback.length > 5 || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || searchTerm !== '') && (
        <div className="px-6 md:px-8 py-6 bg-white border-b border-gray-50 animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-8">
              {/* Status Filter */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Status</span>
                <div className="flex flex-wrap gap-2">
                  <FilterPill label="All" value="all" current={statusFilter} count={counts.status.all} onClick={setStatusFilter} />
                  <FilterPill label="Open" value="open" current={statusFilter} count={counts.status.open} onClick={setStatusFilter} />
                  <FilterPill label="In Progress" value="in_progress" current={statusFilter} count={counts.status.in_progress} onClick={setStatusFilter} />
                  <FilterPill label="Resolved" value="resolved" current={statusFilter} count={counts.status.resolved} onClick={setStatusFilter} />
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Category</span>
                <div className="flex flex-wrap gap-2">
                  <FilterPill label="All" value="all" current={typeFilter} count={counts.type.all} onClick={setTypeFilter} />
                  <FilterPill label="Bug" value="bug" current={typeFilter} count={counts.type.bug} onClick={setTypeFilter} />
                  <FilterPill label="Feature" value="feature_request" current={typeFilter} count={counts.type.feature_request} onClick={setTypeFilter} />
                  <FilterPill label="Question" value="question" current={typeFilter} count={counts.type.question} onClick={setTypeFilter} />
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block">Priority</span>
                <div className="flex flex-wrap gap-2">
                  <FilterPill label="All" value="all" current={priorityFilter} count={counts.priority.all} onClick={setPriorityFilter} />
                  <FilterPill label="Urgent" value="urgent" current={priorityFilter} count={counts.priority.urgent} onClick={setPriorityFilter} />
                  <FilterPill label="High" value="high" current={priorityFilter} count={counts.priority.high} onClick={setPriorityFilter} />
                  <FilterPill label="Medium" value="medium" current={priorityFilter} count={counts.priority.medium} onClick={setPriorityFilter} />
                </div>
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all press-effect"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        </div>
      )}

      <div className="p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Counter */}
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Showing {filteredFeedback.length} items
          </span>
        </div>

        {/* Feedback List */}
        {filteredFeedback.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <MessageSquare className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No feedback matches your filters</h3>
            <p className="text-gray-500 mt-2">Try adjusting your selection or search term.</p>
            <button
              onClick={resetFilters}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredFeedback.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              const StatusIcon = getStatusIcon(item.status);
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`group bg-white rounded-2xl border transition-all duration-300 ${
                    isEditing 
                      ? 'ring-2 ring-indigo-500 border-transparent shadow-xl' 
                      : 'border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50'
                  } p-6 relative overflow-hidden`}
                >
                  {/* Priority Indicator Stripe */}
                  <div className={`absolute left-0 top-0 w-1.5 h-full ${
                    item.priority === 'urgent' ? 'bg-red-500' :
                    item.priority === 'high' ? 'bg-orange-500' :
                    item.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-gray-300'
                  }`} />

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getTypeColor(item.type)}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {item.type.replace('_', ' ')}
                        </div>
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-black text-gray-800 mb-2 leading-tight tracking-tight">
                        {item.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed mb-4 text-sm font-medium">
                        {item.description}
                      </p>

                      <div className="flex items-center gap-4">
                        {item.tuteeIcon && item.tuteeColorScheme ? (
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br ${item.tuteeColorScheme.gradient} rounded-xl text-white font-bold text-xs shadow-sm`}>
                            {(() => {
                              const TuteeIcon = getIcon(item.tuteeIcon);
                              return <TuteeIcon className="w-3.5 h-3.5" />;
                            })()}
                            <span>{item.tuteeName}</span>
                          </div>
                        ) : (
                          <div className="px-3 py-1.5 bg-gray-100 rounded-xl text-gray-600 font-bold text-xs">
                            {item.tuteeName}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {!isEditing && (
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                          title="Edit status"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                      
                      {!isEditing && (
                        <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(item.status)} shadow-sm bg-white`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {item.status.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Update Status
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                              <button
                                key={status}
                                onClick={() => setEditStatus(status as any)}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  editStatus === status
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                } capitalize`}
                              >
                                {status.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Internal Admin Notes
                          </label>
                          <textarea
                            value={editAdminNotes}
                            onChange={(e) => setEditAdminNotes(e.target.value)}
                            rows={3}
                            placeholder="Type notes for yourself here..."
                            className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-sm text-gray-900 shadow-inner"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSave(item.id)}
                          className="flex-[2] flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg shadow-indigo-100 press-effect"
                        >
                          <Save className="w-5 h-5" />
                          Update Feedback
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all font-bold text-sm press-effect"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    item.adminNotes && (
                      <div className="mt-6 pt-6 border-t border-gray-50 flex items-start gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Internal Note</span>
                          <p className="text-sm font-medium text-gray-600 italic">"{item.adminNotes}"</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackAdmin;
