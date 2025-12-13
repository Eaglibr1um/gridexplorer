import { useState } from 'react';
import { MessageSquare, X, Send, Bug, Lightbulb, HelpCircle, FileText } from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { createFeedback } from '../../services/feedbackService';
import * as LucideIcons from 'lucide-react';

interface FeedbackButtonProps {
  tutee: Tutee;
}

const FeedbackButton = ({ tutee }: FeedbackButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature_request' | 'question' | 'other'>('feature_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || MessageSquare;
  };

  const TuteeIcon = getIcon(tutee.icon);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess(false);

      await createFeedback({
        tuteeId: tutee.id,
        type,
        title: title.trim(),
        description: description.trim(),
      });

      setSuccess(true);
      setTitle('');
      setDescription('');
      setType('feature_request');

      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes = [
    { value: 'feature_request' as const, label: 'Feature Request', icon: Lightbulb, color: 'text-yellow-600' },
    { value: 'bug' as const, label: 'Bug Report', icon: Bug, color: 'text-red-600' },
    { value: 'question' as const, label: 'Question', icon: HelpCircle, color: 'text-blue-600' },
    { value: 'other' as const, label: 'Other', icon: FileText, color: 'text-gray-600' },
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl bg-gradient-to-r ${tutee.colorScheme.gradient} text-white hover:scale-110 transition-transform-smooth press-effect animate-fade-in-up`}
        style={{ animationDelay: '200ms' }}
        aria-label="Send Feedback"
        title="Send Feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full animate-modal-content border-2" style={{ 
            borderColor: tutee.colorScheme.primary === 'pink' ? '#ec4899' : 
                         tutee.colorScheme.primary === 'purple' ? '#a855f7' : 
                         tutee.colorScheme.primary === 'blue' ? '#3b82f6' : 
                         tutee.colorScheme.primary === 'green' ? '#10b981' : 
                         tutee.colorScheme.primary === 'indigo' ? '#6366f1' : 
                         tutee.colorScheme.primary === 'orange' ? '#f97316' :
                         tutee.colorScheme.primary === 'red' ? '#ef4444' :
                         tutee.colorScheme.primary === 'yellow' ? '#eab308' :
                         '#6366f1'
          }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-lg`}>
                  <TuteeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Send Feedback</h3>
                  <p className="text-sm text-gray-600">{tutee.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSubmitting) {
                    setIsOpen(false);
                    setError('');
                    setSuccess(false);
                  }
                }}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors-smooth"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Found a bug? Have a feature request? We'd love to hear from you!
              </p>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {feedbackTypes.map((ft) => {
                    const Icon = ft.icon;
                    const isSelected = type === ft.value;
                    return (
                      <button
                        key={ft.value}
                        onClick={() => {
                          setType(ft.value);
                          setError('');
                        }}
                        className={`
                          p-3 rounded-lg border-2 transition-all text-left
                          ${isSelected 
                            ? `border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200` 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : ft.color}`} />
                          <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {ft.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError('');
                  }}
                  placeholder="Brief description of your feedback"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  rows={5}
                  placeholder="Please provide as much detail as possible..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                  <p className="text-sm text-green-700">Thank you! Your feedback has been submitted.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (!isSubmitting) {
                      setIsOpen(false);
                      setError('');
                      setSuccess(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors-smooth press-effect disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className={`flex-1 px-4 py-2.5 bg-gradient-to-r ${tutee.colorScheme.gradient} text-white rounded-lg font-semibold hover:opacity-90 transition-colors-smooth press-effect disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;

