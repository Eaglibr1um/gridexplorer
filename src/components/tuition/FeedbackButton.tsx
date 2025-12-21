import { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  MessageSquare, X, Send, Bug, Lightbulb, HelpCircle, FileText, Sparkles, Loader2,
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, 
  Trophy, Brain, Rocket, BookMarked, School, PenTool, Calculator, 
  FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, 
  Coffee, Smile
} from 'lucide-react';
import { Tutee } from '../../types/tuition';
import { createFeedback } from '../../services/feedbackService';
import ChatWithGPT from './ChatWithGPT';

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

interface FeedbackButtonProps {
  tutee: Tutee;
}

const FeedbackButton = ({ tutee }: FeedbackButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [type, setType] = useState<'bug' | 'feature_request' | 'question' | 'other'>('feature_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
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
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-lg w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowChat(true)}
                  className={`p-4 bg-gradient-to-br ${tutee.colorScheme.gradient} rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg group relative`}
                >
                  <TuteeIcon className="w-7 h-7 text-white" />
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                  </div>
                </button>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Feedback Hub</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Talk to {tutee.name}</p>
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
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Type Selection */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Select Category
                </label>
                <div className="grid grid-cols-2 gap-3">
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
                          p-4 rounded-2xl border-2 transition-all text-left group
                          ${isSelected 
                            ? `border-indigo-500 bg-indigo-50/50 shadow-inner` 
                            : 'border-gray-50 bg-gray-50/50 hover:border-indigo-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 transition-colors ${isSelected ? 'text-indigo-600' : ft.color}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-700' : 'text-gray-400'}`}>
                            {ft.label.split(' ')[0]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError('');
                  }}
                  placeholder="What's this about?"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Message Details *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError('');
                  }}
                  rows={4}
                  placeholder="Share your thoughts or report an issue..."
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-medium text-gray-800 shadow-inner resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wide text-center">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border-2 border-green-100 rounded-2xl animate-fade-in text-center">
                  <p className="text-sm font-black text-green-700 uppercase tracking-tight">Mission Accomplished! 🚀</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Feedback transmitted</p>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => {
                    if (!isSubmitting) {
                      setIsOpen(false);
                      setError('');
                      setSuccess(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className={`flex-[2] flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r ${tutee.colorScheme.gradient} text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* GPT Chat Component */}
      <ChatWithGPT 
        tutee={tutee} 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
      />
    </>
  );
};

export default FeedbackButton;

