import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, Search, Calendar, User, ChevronDown, ChevronUp, Sparkles, BookOpen, Clock, Trash2, Filter,
  GraduationCap, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, Rocket, BookMarked, School,
  PenTool, Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile, Shield
} from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { 
  fetchAllLearningPointReviews, 
  deleteLearningPointReview,
  LearningPointReview 
} from '../../../services/learningPointReviewService';
import { format, parseISO } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';

// Icon mapping for tutees
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, GraduationCap, User, Star, Heart, Zap, Target, Award, Trophy,
  Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool,
  Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2,
  Code, Globe, Coffee, Smile, Shield
};

interface LearningPointsAdminProps {
  tutees: Tutee[];
}

const LearningPointsAdmin = ({ tutees }: LearningPointsAdminProps) => {
  const [reviews, setReviews] = useState<LearningPointReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTuteeId, setSelectedTuteeId] = useState<string>('all');
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  // Helper to get icon component
  const getIcon = (iconName: string) => iconMap[iconName] || User;

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchAllLearningPointReviews();
      setReviews(data);
    } catch (err) {
      setError('Failed to load learning point reviews.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTutee = (id: string) => tutees.find(t => t.id === id);

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const tutee = getTutee(review.tuteeId);
      const tuteeName = tutee?.name.toLowerCase() || '';
      const sessionDate = format(parseISO(review.sessionDate), 'MMM d, yyyy').toLowerCase();
      
      const matchesSearch = tuteeName.includes(searchTerm.toLowerCase()) || 
                          sessionDate.includes(searchTerm.toLowerCase());
      const matchesTutee = selectedTuteeId === 'all' || review.tuteeId === selectedTuteeId;
      
      return matchesSearch && matchesTutee;
    });
  }, [reviews, searchTerm, selectedTuteeId, tutees]);

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await deleteLearningPointReview(deleteConfirm.id);
      setReviews(prev => prev.filter(r => r.id !== deleteConfirm.id));
      setDeleteConfirm({ isOpen: false, id: null });
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review record.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedReviewId(expandedReviewId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-50 bg-gradient-to-r from-indigo-50/50 to-white">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Title row */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-4 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-lg transform rotate-3 flex-shrink-0">
              <Brain className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">AI Review Insights</h3>
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Learning Point History</p>
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative group">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search tutee or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 sm:pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl sm:rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner"
              />
            </div>
            
            <div className="relative group">
              <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <select
                value={selectedTuteeId}
                onChange={(e) => setSelectedTuteeId(e.target.value)}
                className="w-full pl-10 sm:pl-11 pr-10 py-3 bg-gray-50 border-2 border-transparent rounded-xl sm:rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-sm shadow-inner appearance-none cursor-pointer"
              >
                <option value="all">All Tutees</option>
                {tutees.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching review history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-3xl border-2 border-dashed border-red-100">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button onClick={loadReviews} className="text-indigo-600 font-black uppercase tracking-widest text-xs hover:underline">Try Again</button>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <BookOpen className="w-16 h-12 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400 font-bold text-lg">No review records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => {
              const tutee = getTutee(review.tuteeId);
              const isExpanded = expandedReviewId === review.id;
              
              return (
                <div 
                  key={review.id}
                  className={`border-2 transition-all duration-300 rounded-xl sm:rounded-2xl lg:rounded-[2rem] overflow-hidden ${
                    isExpanded ? 'border-indigo-100 bg-indigo-50/20 shadow-lg' : 'border-gray-50 bg-white hover:border-gray-100 shadow-sm'
                  }`}
                >
                  {/* Card Header - Stacked on mobile, row on desktop */}
                  <div className="p-4 sm:p-5 lg:p-6">
                    {/* Top row: Icon + Name + Actions */}
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Tutee Icon */}
                      <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${tutee?.colorScheme.gradient || 'from-gray-400 to-gray-500'} text-white shadow-md flex-shrink-0`}>
                        {(() => {
                          const IconComp = getIcon(tutee?.icon || 'User');
                          return <IconComp className="w-5 h-5 sm:w-6 sm:h-6" />;
                        })()}
                      </div>
                      
                      {/* Name + Meta info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold sm:font-black text-gray-800 text-sm sm:text-base">{tutee?.name || 'Unknown Tutee'}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-[8px] sm:text-[9px] font-black text-gray-500 uppercase tracking-wide rounded-md border border-gray-200 whitespace-nowrap">
                            {review.reviewCount} {review.reviewCount === 1 ? 'Review' : 'Reviews'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{format(parseISO(review.sessionDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>{format(parseISO(review.lastReviewed), 'HH:mm')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons - always visible, not overlapping */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleExpand(review.id)}
                          className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all touch-manipulation min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center ${
                            isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                          title={isExpanded ? 'Show less' : 'View interaction'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, id: review.id })}
                          className="p-2 sm:p-3 bg-white text-red-400 border border-gray-100 rounded-lg sm:rounded-xl hover:bg-red-50 transition-all shadow-sm touch-manipulation min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-4 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10 pt-1 sm:pt-2 animate-fade-in">
                      {review.reviewHistory && review.reviewHistory.length > 0 ? (
                        <div className="space-y-3 sm:space-y-5">
                          <div className="h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent mb-3 sm:mb-6" />
                          {review.reviewHistory.map((item, idx) => (
                            <div key={idx} className="space-y-2.5 sm:space-y-4">
                              {/* Question */}
                              <div className="flex gap-2 sm:gap-4">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-[8px] sm:text-[10px] font-black text-gray-400 shadow-sm border border-gray-200">Q</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 sm:mb-1.5">AI Question {idx + 1}</p>
                                  <div className="bg-white/80 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                    <p className="text-xs sm:text-sm font-semibold text-gray-600 italic leading-snug sm:leading-relaxed break-words">"{item.question}"</p>
                                  </div>
                                </div>
                              </div>

                              {/* Student Response */}
                              <div className="flex gap-2 sm:gap-4">
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-[8px] sm:text-[10px] font-black text-white bg-gradient-to-br ${tutee?.colorScheme.gradient || 'from-gray-400 to-gray-500'} shadow-md`}>A</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 sm:mb-1.5">{tutee?.name}'s Response</p>
                                  <div className="bg-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl rounded-tl-none border-2 border-indigo-50 shadow-sm">
                                    <p className="text-xs sm:text-sm font-bold text-gray-800 leading-snug sm:leading-relaxed break-words">{item.answer}</p>
                                  </div>
                                </div>
                              </div>

                              {/* GPT Correction */}
                              <div className="flex gap-2 sm:gap-4">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] sm:text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1 sm:mb-1.5">GPT Correction</p>
                                  <div className="bg-indigo-600/5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl rounded-tl-none border border-indigo-100 shadow-sm">
                                    <p className="text-xs sm:text-sm text-gray-700 leading-snug sm:leading-relaxed font-medium break-words">{item.feedback}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {idx < review.reviewHistory!.length - 1 && (
                                <div className="py-1.5 sm:py-2 flex justify-center">
                                  <div className="w-1 h-1 bg-gray-200 rounded-full mx-0.5 sm:mx-1" />
                                  <div className="w-1 h-1 bg-gray-200 rounded-full mx-0.5 sm:mx-1" />
                                  <div className="w-1 h-1 bg-gray-200 rounded-full mx-0.5 sm:mx-1" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 sm:py-10 text-center bg-gray-50/50 rounded-xl sm:rounded-3xl border-2 border-dashed border-gray-100">
                          <Brain className="w-8 h-8 sm:w-12 sm:h-10 mx-auto mb-2 sm:mb-3 text-gray-200" />
                          <p className="text-gray-400 font-bold italic text-xs sm:text-base">No detailed history available</p>
                          <p className="text-[8px] sm:text-[10px] text-gray-300 font-bold uppercase tracking-wide mt-1 px-4">Completed before detailed tracking was enabled</p>
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

      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null })}
        title="Delete Review Record"
        message="Are you sure you want to delete this AI review record? This will not affect the learning points themselves."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default LearningPointsAdmin;

