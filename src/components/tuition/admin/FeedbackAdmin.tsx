import { useState, useEffect } from 'react';
import { MessageSquare, X, Filter, Bug, Lightbulb, HelpCircle, FileText, CheckCircle, Clock, AlertCircle, XCircle, Edit2, Save, BookOpen, GraduationCap } from 'lucide-react';
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
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackWithTutee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
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

  useEffect(() => {
    applyFilters();
  }, [feedback, statusFilter, typeFilter, priorityFilter]);

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

  const applyFilters = () => {
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

    setFilteredFeedback(filtered);
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">All Feedback</h3>
            <p className="text-sm text-gray-600">
              {filteredFeedback.length} of {feedback.length} feedback items
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="bug">Bug</option>
              <option value="feature_request">Feature Request</option>
              <option value="question">Question</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            const StatusIcon = getStatusIcon(item.status);
            const isEditing = editingId === item.id;

            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded ${getTypeColor(item.type)}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <h4 className="font-semibold text-gray-800">{item.title}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium">From:</span>
                      {item.tuteeIcon && item.tuteeColorScheme ? (
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-br ${item.tuteeColorScheme.gradient} rounded-full text-white font-medium`}>
                          {(() => {
                            const TuteeIcon = getIcon(item.tuteeIcon);
                            return <TuteeIcon className="w-3 h-3" />;
                          })()}
                          <span>{item.tuteeName}</span>
                        </div>
                      ) : (
                        <span className="font-medium">{item.tuteeName}</span>
                      )}
                      <span>•</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors-smooth press-effect"
                      title="Edit feedback"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Admin Notes
                      </label>
                      <textarea
                        value={editAdminNotes}
                        onChange={(e) => setEditAdminNotes(e.target.value)}
                        rows={3}
                        placeholder="Add admin notes..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors-smooth press-effect text-sm font-medium"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors-smooth press-effect text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(item.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="capitalize">{item.status.replace('_', ' ')}</span>
                    </div>
                    {item.adminNotes && (
                      <div className="flex-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        <span className="font-medium">Admin Notes: </span>
                        {item.adminNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeedbackAdmin;

