import { useState, useEffect } from 'react';
import { 
  MessageSquare, Bug, Lightbulb, HelpCircle, FileText, CheckCircle, Clock, 
  AlertCircle, XCircle, ChevronDown, ChevronUp, Edit2, Trash2, Save, X, Shield, Calendar, Loader2,
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy, 
  Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator, 
  FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile
} from 'lucide-react';
import { fetchFeedback, updateFeedback, deleteFeedback, Feedback, UpdateFeedbackInput } from '../../services/feedbackService';
import { Tutee } from '../../types/tuition';
import ConfirmationModal from '../ui/ConfirmationModal';

interface MyFeedbackProps {
  tutee: Tutee;
}

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  User,
  Star,
  Heart,
  Zap,
  Target,
  Award,
  Trophy,
  Lightbulb,
  Brain,
  Rocket,
  Sparkles,
  BookMarked,
  School,
  PenTool,
  Calculator,
  FlaskConical,
  Atom,
  Music,
  Palette,
  Camera,
  Gamepad2,
  Code,
  Globe,
  Coffee,
  Smile,
};

const MyFeedback = ({ tutee }: MyFeedbackProps) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState<'bug' | 'feature_request' | 'question' | 'other'>('feature_request');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [tutee.id]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchFeedback(tutee.id);
      setFeedback(data);
    } catch (err) {
      setError('Failed to load feedback. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleEdit = (item: Feedback) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditType(item.type);
    setEditPriority(item.priority);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditType('feature_request');
    setEditPriority('medium');
  };

  const handleSave = async (id: string) => {
    if (!editTitle.trim() || !editDescription.trim()) {
      setError('Please fill in both title and description');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const update: UpdateFeedbackInput = {
        id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        type: editType,
        priority: editPriority,
      };
      await updateFeedback(update);
      await loadFeedback();
      setEditingId(null);
    } catch (err) {
      setError('Failed to update feedback. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      setError('');
      await deleteFeedback(id);
      await loadFeedback();
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Failed to delete feedback. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] shadow-xl p-6 sm:p-8 border border-white/40 animate-fade-in-up">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform`}>
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">My Feedback</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {feedback.length === 0 
                ? 'Share your thoughts' 
                : `${feedback.length} Submissions`}
            </p>
          </div>
        </div>
        {feedback.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:text-indigo-600 transition-colors shadow-inner border border-gray-100">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        )}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake">
          <p className="text-xs font-bold text-red-700 uppercase tracking-wide text-center">{error}</p>
        </div>
      )}

      {isExpanded && (
        <div className="mt-8">
          {feedback.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <MessageSquare className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] px-6">No entries yet. Use the feedback button to start!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                const StatusIcon = getStatusIcon(item.status);
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="group bg-white/80 border border-gray-100 rounded-3xl p-5 sm:p-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 touch-manipulation"
                  >
                    {isEditing ? (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Category</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'feature_request' as const, label: 'Feature', icon: Lightbulb },
                              { value: 'bug' as const, label: 'Bug', icon: Bug },
                              { value: 'question' as const, label: 'Question', icon: HelpCircle },
                              { value: 'other' as const, label: 'Other', icon: FileText },
                            ].map((ft) => {
                              const Icon = ft.icon;
                              const isSelected = editType === ft.value;
                              return (
                                <button
                                  key={ft.value}
                                  onClick={() => setEditType(ft.value)}
                                  className={`p-3 rounded-2xl border-2 transition-all text-left ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-50 shadow-inner'
                                      : 'border-gray-50 bg-gray-50/50 hover:border-indigo-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-indigo-700' : 'text-gray-400'}`}>
                                      {ft.label}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Priority</label>
                          <div className="grid grid-cols-4 gap-2">
                            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                              <button
                                key={p}
                                onClick={() => setEditPriority(p)}
                                className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                  editPriority === p
                                    ? 'bg-gray-800 border-gray-800 text-white shadow-md'
                                    : 'bg-white border-gray-100 text-gray-400'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Summary *</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="What's on your mind?"
                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner"
                            disabled={isSaving}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Details *</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={4}
                            placeholder="Explain further..."
                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-800 shadow-inner resize-none"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="px-6 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSave(item.id)}
                            disabled={isSaving || !editTitle.trim() || !editDescription.trim()}
                            className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r ${tutee.colorScheme.gradient} text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50`}
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Secure Edit</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`p-3 rounded-2xl shadow-inner border border-gray-100 ${getTypeColor(item.type)}`}>
                              <TypeIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-black text-gray-800 text-lg leading-tight truncate">{item.title}</h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${getStatusColor(item.status)}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  <span>{item.status.replace('_', ' ')}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-gray-100 text-gray-400 bg-gray-50 shadow-sm`}>
                                  {item.priority} priority
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 self-end sm:self-auto opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-3 bg-gray-50 text-indigo-600 rounded-xl hover:bg-indigo-50 active:scale-90 transition-all border border-transparent hover:border-indigo-100"
                              title="Edit feedback"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-3 bg-gray-50 text-red-400 rounded-xl hover:bg-red-50 active:scale-90 transition-all border border-transparent hover:border-red-100"
                              title="Delete feedback"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white/40 p-5 rounded-2xl border border-gray-50 shadow-inner mb-6">
                          <p className="text-sm font-medium text-gray-600 leading-relaxed">{item.description}</p>
                        </div>
                        
                        {item.adminNotes && (
                          <div className="mb-6 p-5 bg-indigo-50/50 border-2 border-indigo-50 rounded-2xl relative overflow-hidden group/response">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="w-4 h-4 text-indigo-600" />
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Tutor Response</p>
                            </div>
                            <p className="text-sm font-bold text-indigo-900 leading-relaxed">{item.adminNotes}</p>
                            <div className="absolute top-0 right-0 w-1 h-full bg-indigo-200" />
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-[9px] font-black text-gray-300 uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                          {item.updatedAt !== item.createdAt && (
                            <>
                              <span className="w-1 h-1 bg-gray-200 rounded-full" />
                              <div className="flex items-center gap-1.5 text-indigo-300">
                                <Clock className="w-3 h-3" />
                                <span>Edited: {formatDate(item.updatedAt)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteConfirmId && handleDelete(deleteConfirmId)}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MyFeedback;

