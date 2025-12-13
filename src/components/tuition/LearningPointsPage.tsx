import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, Plus, Trash2, Edit2, Save, Sparkles, CheckCircle2, Calendar, Tag, Clock, RotateCcw } from 'lucide-react';
import { Tutee } from '../../types/tuition';
import {
  fetchLearningPoints,
  createLearningPoint,
  updateLearningPoint,
  deleteLearningPoint,
  LearningPoint as LearningPointType,
} from '../../services/componentService';
import { format, parseISO } from 'date-fns';
import ConfirmationModal from '../ui/ConfirmationModal';
import { convertChemistryNotation, processChemistryInput } from '../../utils/chemistryNotation';
import { fetchLearningPointReviews, upsertLearningPointReview } from '../../services/learningPointReviewService';

interface LearningPointsPageProps {
  tutee: Tutee;
  onBack: () => void;
}

const LearningPointsPage = ({ tutee, onBack }: LearningPointsPageProps) => {
  // Force light theme for tuition pages
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      // Don't restore theme on unmount
    };
  }, []);

  const [points, setPoints] = useState<LearningPointType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingPoint, setEditingPoint] = useState<LearningPointType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; pointId: string | null }>({
    isOpen: false,
    pointId: null,
  });

  const [formData, setFormData] = useState({
    sessionDate: format(new Date(), 'yyyy-MM-dd'),
    bulletPoints: [''] as string[],
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Spaced Repetition System - must be declared before useMemo hooks
  const [reviewData, setReviewData] = useState<Record<string, { lastReviewed: string; reviewCount: number }>>({});

  const loadPoints = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchLearningPoints(tutee.id);
      setPoints(data);
    } catch (err) {
      setError('Failed to load learning points. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoints();
    loadReviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutee.id]);
  
  const loadReviewData = async () => {
    try {
      const reviews = await fetchLearningPointReviews(tutee.id);
      // Convert array to object keyed by sessionDate
      const reviewDataMap: Record<string, { lastReviewed: string; reviewCount: number }> = {};
      reviews.forEach(review => {
        reviewDataMap[review.sessionDate] = {
          lastReviewed: review.lastReviewed,
          reviewCount: review.reviewCount,
        };
      });
      setReviewData(reviewDataMap);
    } catch (e) {
      console.error('Failed to load review data:', e);
      // Fallback to localStorage if Supabase fails
      const stored = localStorage.getItem(`learning_points_reviews_${tutee.id}`);
      if (stored) {
        try {
          setReviewData(JSON.parse(stored));
        } catch (err) {
          console.error('Failed to load review data from localStorage:', err);
        }
      }
    }
  };

  const handleAddNew = () => {
    setEditingPoint(null);
    setFormData({
      sessionDate: format(new Date(), 'yyyy-MM-dd'),
      bulletPoints: [''],
      tags: [],
    });
    setTagInput('');
    setError('');
  };

  const handleEdit = (point: LearningPointType | { sessionDate: string; bulletPoints: string[]; tags: string[]; ids: string[] }) => {
    // Check if it's a merged session or a single point
    if ('ids' in point) {
      // It's a merged session - use the first point's ID for tracking, but load all merged data
      setEditingPoint({ ...point as any, id: point.ids[0] } as LearningPointType);
      setFormData({
        sessionDate: point.sessionDate,
        bulletPoints: point.bulletPoints.length > 0 ? point.bulletPoints : [''],
        tags: point.tags || [],
      });
    } else {
      // It's a single point
      setEditingPoint(point);
      const bulletPoints = point.points
        .split(/\n|•|-\s*/)
        .map(p => p.trim())
        .filter(p => p.length > 0);
      
      setFormData({
        sessionDate: point.sessionDate,
        bulletPoints: bulletPoints.length > 0 ? bulletPoints : [''],
        tags: point.tags || [],
      });
    }
    setTagInput('');
    setError('');
  };

  const handleSave = async () => {
    // Filter out empty bullet points
    const validPoints = formData.bulletPoints.filter(p => p.trim().length > 0);
    
    if (validPoints.length === 0) {
      setError('Please add at least one learning point');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      
      // Format bullet points with bullet symbols and apply chemistry notation
      const formattedPoints = validPoints.map(p => {
        const processed = convertChemistryNotation(p.trim());
        return `• ${processed}`;
      }).join('\n');
      
      if (editingPoint) {
        // Check if we're editing a merged session (multiple points for same date)
        const sessionPoints = points.filter(p => p.sessionDate === formData.sessionDate);
        
        if (sessionPoints.length > 1) {
          // Delete all existing points for this date and create a new merged one
          await Promise.all(sessionPoints.map(p => deleteLearningPoint(p.id)));
          await createLearningPoint(
            tutee.id,
            formData.sessionDate,
            formattedPoints,
            formData.tags
          );
        } else {
          // Single point - just update it
          await updateLearningPoint(editingPoint.id, {
            sessionDate: formData.sessionDate,
            points: formattedPoints,
            tags: formData.tags,
          });
        }
      } else {
        // Check if there's already a point for this date
        const existingPoints = points.filter(p => p.sessionDate === formData.sessionDate);
        
        if (existingPoints.length > 0) {
          // Merge with existing: delete old ones and create new merged one
          await Promise.all(existingPoints.map(p => deleteLearningPoint(p.id)));
        }
        
        await createLearningPoint(
          tutee.id,
          formData.sessionDate,
          formattedPoints,
          formData.tags
        );
      }
      
      await loadPoints();
      setEditingPoint(null);
      setFormData({
        sessionDate: format(new Date(), 'yyyy-MM-dd'),
        bulletPoints: [''],
        tags: [],
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save learning points. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.pointId) return;

    try {
      // Handle multiple IDs (comma-separated) for merged sessions
      const idsToDelete = deleteConfirm.pointId.split(',');
      await Promise.all(idsToDelete.map(id => deleteLearningPoint(id.trim())));
      await loadPoints();
      setDeleteConfirm({ isOpen: false, pointId: null });
    } catch (err) {
      setError('Failed to delete learning point. Please try again.');
      console.error(err);
    }
  };

  const addBulletPoint = () => {
    setFormData({
      ...formData,
      bulletPoints: [...formData.bulletPoints, ''],
    });
  };

  const updateBulletPoint = (index: number, value: string) => {
    const newPoints = [...formData.bulletPoints];
    newPoints[index] = value;
    setFormData({ ...formData, bulletPoints: newPoints });
  };

  const removeBulletPoint = (index: number) => {
    if (formData.bulletPoints.length > 1) {
      const newPoints = formData.bulletPoints.filter((_, i) => i !== index);
      setFormData({ ...formData, bulletPoints: newPoints });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const gradientClass = tutee.colorScheme.gradient;
  
  // Group points by session date
  const groupedPoints = useMemo(() => {
    const grouped: Record<string, LearningPointType[]> = {};
    points.forEach(point => {
      if (!grouped[point.sessionDate]) {
        grouped[point.sessionDate] = [];
      }
      grouped[point.sessionDate].push(point);
    });
    return grouped;
  }, [points]);

  // Get unique session dates
  const uniqueSessionDates = useMemo(() => {
    return new Set(points.map(p => p.sessionDate));
  }, [points]);

  // Calculate total learning points and merge points by session date
  const mergedSessions = useMemo(() => {
    return Object.entries(groupedPoints).map(([sessionDate, sessionPoints]) => {
      // Merge all bullet points from this session date
      const allBulletPoints: string[] = [];
      const allTags = new Set<string>();
      let earliestCreated = sessionPoints[0].createdAt;
      let latestUpdated = sessionPoints[0].updatedAt;
      const ids = sessionPoints.map(p => p.id);

      sessionPoints.forEach(point => {
        const bulletPoints = point.points
          .split(/\n|•|-\s*/)
          .map(p => p.trim())
          .filter(p => p.length > 0);
        allBulletPoints.push(...bulletPoints);
        
        if (point.tags) {
          point.tags.forEach(tag => allTags.add(tag));
        }
        
        if (new Date(point.createdAt) < new Date(earliestCreated)) {
          earliestCreated = point.createdAt;
        }
        if (new Date(point.updatedAt) > new Date(latestUpdated)) {
          latestUpdated = point.updatedAt;
        }
      });

      return {
        sessionDate,
        bulletPoints: allBulletPoints,
        tags: Array.from(allTags),
        createdAt: earliestCreated,
        updatedAt: latestUpdated,
        ids, // Keep track of original IDs for editing/deleting
        originalPoints: sessionPoints, // Keep reference to original points
      };
    }).sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());
  }, [groupedPoints]);

  const totalLearningPoints = mergedSessions.reduce((sum, session) => {
    return sum + session.bulletPoints.length;
  }, 0);

  const saveReviewData = async (sessionDate: string, reviewInfo: { lastReviewed: string; reviewCount: number }) => {
    try {
      // Update local state immediately
      const newData = {
        ...reviewData,
        [sessionDate]: reviewInfo,
      };
      setReviewData(newData);
      
      // Save to Supabase
      await upsertLearningPointReview({
        tuteeId: tutee.id,
        sessionDate,
        lastReviewed: reviewInfo.lastReviewed,
        reviewCount: reviewInfo.reviewCount,
      });
      
      // Also save to localStorage as backup
      localStorage.setItem(`learning_points_reviews_${tutee.id}`, JSON.stringify(newData));
    } catch (error) {
      console.error('Failed to save review data to Supabase:', error);
      // Fallback to localStorage only
      const newData = {
        ...reviewData,
        [sessionDate]: reviewInfo,
      };
      setReviewData(newData);
      localStorage.setItem(`learning_points_reviews_${tutee.id}`, JSON.stringify(newData));
    }
  };

  // Spaced repetition intervals (in days): 1, 3, 7, 14, 30, 60, 90
  const getNextReviewDate = (reviewCount: number, lastReviewed: string): Date => {
    const intervals = [1, 3, 7, 14, 30, 60, 90];
    const intervalIndex = Math.min(reviewCount, intervals.length - 1);
    const daysToAdd = intervals[intervalIndex];
    const lastDate = new Date(lastReviewed);
    lastDate.setDate(lastDate.getDate() + daysToAdd);
    return lastDate;
  };

  const getReviewStatus = (sessionDate: string) => {
    const sessionKey = sessionDate;
    const review = reviewData[sessionKey];
    const now = new Date();
    
    if (!review) {
      // Never reviewed - due immediately
      return { isDue: true, nextReview: null, daysUntil: 0, lastReviewed: null };
    }

    const nextReview = getNextReviewDate(review.reviewCount, review.lastReviewed);
    const daysUntil = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isDue: daysUntil <= 0,
      nextReview,
      daysUntil: Math.max(0, daysUntil),
      reviewCount: review.reviewCount,
      lastReviewed: review.lastReviewed,
    };
  };

  const markAsReviewed = async (sessionDate: string) => {
    const sessionKey = sessionDate;
    const current = reviewData[sessionKey];
    const reviewInfo = {
      lastReviewed: new Date().toISOString(),
      reviewCount: current ? current.reviewCount + 1 : 1,
    };
    await saveReviewData(sessionKey, reviewInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 sm:p-6 md:p-8 safe-area-inset">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 sm:p-4 bg-gradient-to-br ${gradientClass} rounded-xl flex-shrink-0`}>
                <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                  Learning Points
                </h1>
                <p className="text-gray-600">{tutee.name}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`bg-gradient-to-br ${gradientClass} rounded-lg p-4 text-white`}>
                <p className="text-sm opacity-90 mb-1">Total Sessions</p>
                <p className="text-3xl font-bold">{uniqueSessionDates.size}</p>
              </div>
              <div className={`bg-gradient-to-br ${gradientClass} rounded-lg p-4 text-white`}>
                <p className="text-sm opacity-90 mb-1">Total Learning Points</p>
                <p className="text-3xl font-bold">{totalLearningPoints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <p className="text-green-800 font-medium">Learning points saved successfully! 🎉</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-fade-in">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className={`w-6 h-6 bg-gradient-to-br ${gradientClass} bg-clip-text text-transparent`} />
              {editingPoint ? 'Edit Learning Points' : 'Add New Learning Points'}
            </h2>
            {editingPoint && (
              <button
                onClick={handleAddNew}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Session Date
              </label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Bullet Points Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Learning Points *
              </label>
              <div className="space-y-3">
                {formData.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 group animate-fade-in">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center mt-1`}>
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                    <textarea
                      value={point}
                      onChange={(e) => updateBulletPoint(index, e.target.value)}
                      onBlur={(e) => {
                        // Process chemistry notation on blur (when user finishes typing)
                        const processed = convertChemistryNotation(e.target.value);
                        if (processed !== e.target.value) {
                          updateBulletPoint(index, processed);
                        }
                      }}
                      placeholder={`Learning point ${index + 1}...`}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y min-h-[44px]"
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '44px',
                      }}
                      onInput={(e) => {
                        // Auto-expand textarea
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.max(44, target.scrollHeight)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          addBulletPoint();
                          // Focus next textarea after a brief delay
                          setTimeout(() => {
                            const nextTextarea = document.querySelectorAll('textarea[placeholder*="Learning point"]')[index + 1] as HTMLTextAreaElement;
                            nextTextarea?.focus();
                          }, 50);
                        }
                        
                        const target = e.target as HTMLTextAreaElement;
                        const cursorPos = target.selectionStart;
                        const textBefore = target.value.substring(0, cursorPos);
                        
                        // If closing slash is typed, check if we have a complete /formula/ pattern
                        if (e.key === '/') {
                          // Check if there's an opening slash before cursor
                          const lastOpenSlash = textBefore.lastIndexOf('/');
                          if (lastOpenSlash !== -1) {
                            const formula = textBefore.substring(lastOpenSlash + 1);
                            // If we have a valid formula pattern, convert it immediately
                            if (formula.length > 0 && /^[A-Z][A-Za-z0-9]*$/.test(formula)) {
                              setTimeout(() => {
                                const textAfter = target.value.substring(cursorPos + 1); // +1 to skip the / we just typed
                                const beforeFormula = target.value.substring(0, lastOpenSlash);
                                const convertedFormula = formula.replace(/\d/g, (digit: string) => {
                                  const subscriptMap: Record<string, string> = {
                                    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
                                    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
                                  };
                                  return subscriptMap[digit] || digit;
                                });
                                const newValue = beforeFormula + convertedFormula + textAfter;
                                updateBulletPoint(index, newValue);
                                // Position cursor after converted formula
                                setTimeout(() => {
                                  const newCursorPos = beforeFormula.length + convertedFormula.length;
                                  target.setSelectionRange(newCursorPos, newCursorPos);
                                }, 0);
                              }, 0);
                            }
                          }
                        }
                        
                        // Process chemistry notation on space
                        if (e.key === ' ') {
                          setTimeout(() => {
                            const processed = convertChemistryNotation(target.value);
                            if (processed !== target.value) {
                              updateBulletPoint(index, processed);
                              // Restore cursor position (adjust for length change)
                              const lengthDiff = processed.length - target.value.length;
                              setTimeout(() => {
                                target.setSelectionRange(cursorPos + lengthDiff, cursorPos + lengthDiff);
                              }, 0);
                            }
                          }, 10);
                        }
                      }}
                    />
                    {formData.bulletPoints.length > 1 && (
                      <button
                        onClick={() => removeBulletPoint(index)}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Remove point"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addBulletPoint}
                className="mt-3 flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Another Point
              </button>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags (optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${gradientClass} text-white flex items-center gap-2`}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-white/20 rounded-full p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`w-full bg-gradient-to-r ${gradientClass} text-white py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition-all press-effect disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{editingPoint ? 'Update' : 'Save'} Learning Points</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Spaced Repetition Review Section */}
        {mergedSessions.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                <RotateCcw className={`w-6 h-6 bg-gradient-to-br ${gradientClass} bg-clip-text text-transparent`} />
                Review Sessions
              </h2>
            </div>
            
            <div className="space-y-3">
              {mergedSessions
                .filter(session => {
                  const status = getReviewStatus(session.sessionDate);
                  return status.isDue;
                })
                .map((session, index) => {
                  const status = getReviewStatus(session.sessionDate);
                  return (
                    <div
                      key={session.sessionDate}
                      className="p-4 border-2 border-yellow-300 bg-yellow-50 rounded-lg animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="font-semibold text-gray-800">
                            {format(parseISO(session.sessionDate), 'EEEE, d MMMM yyyy')}
                          </span>
                          {status.reviewCount !== undefined && (
                            <span className="text-xs text-gray-600">
                              (Reviewed {status.reviewCount} time{status.reviewCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await markAsReviewed(session.sessionDate);
                            } catch (err) {
                              console.error('Failed to mark as reviewed:', err);
                              setError('Failed to save review status. Please try again.');
                            }
                          }}
                          className={`px-4 py-2 bg-gradient-to-r ${gradientClass} text-white rounded-lg hover:opacity-90 transition-all font-medium text-sm flex items-center gap-2`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark as Reviewed
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Review these learning points to strengthen your memory!</p>
                      </div>
                    </div>
                  );
                })}
              {mergedSessions.filter(s => getReviewStatus(s.sessionDate).isDue).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>All sessions are up to date! 🎉</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Learning Points */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Previous Sessions</h2>
          
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : mergedSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No learning points yet</p>
              <p className="text-sm">Add your first learning points above! ✨</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mergedSessions.map((session, index) => {
                const reviewStatus = getReviewStatus(session.sessionDate);
                // Use the first point's ID for editing (we'll edit all points for that date)
                const firstPoint = session.originalPoints[0];
                
                return (
                  <div
                    key={session.sessionDate}
                    className={`p-5 border-2 rounded-xl transition-all card-hover animate-fade-in-up ${
                      reviewStatus.isDue 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold text-gray-800">
                            {format(parseISO(session.sessionDate), 'EEEE, d MMMM yyyy')}
                          </span>
                          {reviewStatus.isDue && (
                            <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                              Due for Review
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Posted: {format(parseISO(session.createdAt), 'd MMM yyyy, h:mm a')}
                          </span>
                          {session.updatedAt !== session.createdAt && (
                            <span className="flex items-center gap-1">
                              <Edit2 className="w-3 h-3" />
                              Edited: {format(parseISO(session.updatedAt), 'd MMM yyyy, h:mm a')}
                            </span>
                          )}
                          {reviewStatus.lastReviewed && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <RotateCcw className="w-3 h-3" />
                              Last reviewed: {format(parseISO(reviewStatus.lastReviewed), 'd MMM yyyy, h:mm a')}
                            </span>
                          )}
                          {reviewStatus.nextReview && !reviewStatus.isDue && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Next review: {format(reviewStatus.nextReview, 'd MMM yyyy')}
                              {reviewStatus.daysUntil > 0 && ` (in ${reviewStatus.daysUntil} day${reviewStatus.daysUntil !== 1 ? 's' : ''})`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Delete all points for this session date
                            const idsToDelete = session.ids;
                            if (idsToDelete.length > 0) {
                              setDeleteConfirm({ isOpen: true, pointId: idsToDelete.join(',') });
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {session.bulletPoints.map((bp, bpIndex) => (
                        <div key={bpIndex} className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center mt-0.5`}>
                            <span className="text-white text-xs font-bold">•</span>
                          </div>
                          <p className="text-gray-700 flex-1 whitespace-pre-wrap">{convertChemistryNotation(bp)}</p>
                        </div>
                      ))}
                    </div>
                    
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {session.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${gradientClass} text-white flex items-center gap-1`}
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, pointId: null })}
        title="Delete Learning Point"
        message={
          deleteConfirm.pointId?.includes(',')
            ? "Are you sure you want to delete all learning points for this session? This action cannot be undone."
            : "Are you sure you want to delete this learning point? This action cannot be undone."
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default LearningPointsPage;

