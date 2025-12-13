import { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, HelpCircle, FileText, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown, ChevronUp, Edit2, Trash2, Save, X } from 'lucide-react';
import { fetchFeedback, updateFeedback, deleteFeedback, Feedback, UpdateFeedbackInput } from '../../services/feedbackService';
import { Tutee } from '../../types/tuition';
import ConfirmationModal from '../ui/ConfirmationModal';
import * as LucideIcons from 'lucide-react';

interface MyFeedbackProps {
  tutee: Tutee;
}

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen: LucideIcons.BookOpen,
  GraduationCap: LucideIcons.GraduationCap,
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
    <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 md:p-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">My Feedback</h3>
            <p className="text-sm text-gray-600">
              {feedback.length === 0 
                ? 'No feedback submitted yet' 
                : `${feedback.length} feedback item${feedback.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {feedback.length > 0 && (
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        )}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isExpanded && (
        <>
          {feedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">You haven't submitted any feedback yet.</p>
              <p className="text-sm text-gray-500">Use the feedback button to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                const StatusIcon = getStatusIcon(item.status);
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Type
                          </label>
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
                                  className={`p-2 rounded-lg border-2 transition-all text-left text-sm ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-600'}`} />
                                    <span className={isSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}>
                                      {ft.label}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Priority
                          </label>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as any)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Brief description"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={isSaving}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={4}
                            placeholder="Please provide details..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(item.id)}
                            disabled={isSaving || !editTitle.trim() || !editDescription.trim()}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r ${tutee.colorScheme.gradient} text-white rounded-lg font-semibold hover:opacity-90 transition-colors-smooth press-effect disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
                          >
                            {isSaving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors-smooth press-effect disabled:opacity-50 text-sm font-medium"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`p-1.5 rounded ${getTypeColor(item.type)}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <h4 className="font-semibold text-gray-800 flex-1">{item.title}</h4>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="capitalize">{item.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors-smooth press-effect"
                              title="Edit feedback"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors-smooth press-effect"
                              title="Delete feedback"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        
                        {item.adminNotes && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-700 mb-1">Admin Response:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">{item.adminNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
                          <span>{formatDate(item.createdAt)}</span>
                          {item.updatedAt !== item.createdAt && (
                            <>
                              <span>•</span>
                              <span>Updated: {formatDate(item.updatedAt)}</span>
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
        </>
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

