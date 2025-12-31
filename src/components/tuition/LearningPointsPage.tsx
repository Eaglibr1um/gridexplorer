import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, Plus, Trash2, Edit2, Save, Sparkles, CheckCircle2, Calendar, Tag, Clock, RotateCcw, X, Loader2 } from 'lucide-react';
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
import { convertChemistryNotation } from '../../utils/chemistryNotation';
import { fetchLearningPointReviews, upsertLearningPointReview } from '../../services/learningPointReviewService';
import LearningPointReviewGPTModal from './components/LearningPointReviewGPTModal';

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
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    sessionDate: string;
    learningPoints: string[];
  }>({
    isOpen: false,
    sessionDate: '',
    learningPoints: [],
  });
  
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

  // Parse pasted text into bullet points and extract date
  const parsePastedText = (text: string): { points: string[]; date?: string } => {
    // Remove zero-width spaces and other invisible characters
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    
    // Split by newlines
    const lines = text.split(/\r?\n/);
    
    const points: string[] = [];
    let detectedDate: string | undefined;
    
    const monthNames: Record<string, number> = {
      'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    
    // Function to parse and validate date
    const parseDate = (line: string): string | null => {
      let trimmed = line.trim();
      
      // Remove common prefixes like "learning points", "for", etc.
      trimmed = trimmed.replace(/^(learning\s+points?|for|date:?)\s*/i, '');
      trimmed = trimmed.trim();
      
      // Pattern 1: 6/12/25 or 6/12/2025 (with optional text after)
      let match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s|$)/i);
      if (match) {
        try {
          let day = parseInt(match[1]);
          let month = parseInt(match[2]) - 1; // 0-indexed
          let year = parseInt(match[3]);
          if (year < 100) year += 2000; // Convert 25 to 2025
          
          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        } catch (e) {
          // Invalid date
        }
      }
      
      // Pattern 2: 6 Dec 2025 or 6 December 2025 (with optional text after)
      match = trimmed.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{2,4})(?:\s|$)/i);
      if (match) {
        try {
          const day = parseInt(match[1]);
          const monthName = match[2].toLowerCase().substring(0, 3);
          const month = monthNames[monthName] ?? -1;
          let year = parseInt(match[3]);
          if (year < 100) year += 2000;
          
          if (month >= 0) {
            const date = new Date(year, month, day);
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
              return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
          }
        } catch (e) {
          // Invalid date
        }
      }
      
      // Pattern 3: 2025-12-06 or 2025/12/06
      match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s|$)/i);
      if (match) {
        try {
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1;
          const day = parseInt(match[3]);
          
          const date = new Date(year, month, day);
          if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        } catch (e) {
          // Invalid date
        }
      }
      
      return null;
    };
    
    for (let i = 0; i < lines.length; i++) {
      let trimmed = lines[i].trim();
      
      // Skip empty lines
      if (!trimmed) continue;
      
      // Check if this line contains a date (only check first 2 lines)
      if (i < 2 && !detectedDate) {
        const date = parseDate(trimmed);
        if (date) {
          detectedDate = date;
          continue; // Skip this line, it's a date
        }
      }
      
      // Remove bullet point markers
      // Match: - , • , 1. , 1) , etc.
      trimmed = trimmed.replace(/^[-•]\s*/, ''); // Remove - or • at start
      trimmed = trimmed.replace(/^\d+[.)]\s*/, ''); // Remove numbered lists (1. or 1))
      trimmed = trimmed.replace(/^[⁠\u200B-\u200D\uFEFF]+/, ''); // Remove any remaining invisible chars at start
      
      // Clean up any remaining leading/trailing whitespace
      trimmed = trimmed.trim();
      
      // Skip if it looks like a date line (already processed)
      if (trimmed.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i) || 
          trimmed.match(/^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}/i) ||
          trimmed.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/i)) {
        continue;
      }
      
      if (trimmed) {
        // Convert molecular formulas to subscripts automatically
        // Pattern: Letter(s) followed by number(s) - like C4H8, H2O, CO2, C4H10
        // Match: [A-Z][a-z]? followed by [0-9]+ (one or more digits)
        trimmed = trimmed.replace(/([A-Z][a-z]?)(\d+)/g, (_, element, number) => {
          // Convert all digits in the number to subscripts
          const subscriptMap: Record<string, string> = {
            '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
            '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
          };
          const subscriptNumber = (number as string).split('').map((digit: string) => subscriptMap[digit] || digit).join('');
          return element + subscriptNumber;
        });
        
        points.push(trimmed);
      }
    }
    
    return { points, date: detectedDate };
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, index: number) => {
    // Only process paste in the first textarea (index 0) or if it's empty
    if (index !== 0 && formData.bulletPoints[0].trim() !== '') {
      return; // Let default paste behavior happen for other fields
    }
    
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const { points: parsedPoints, date: detectedDate } = parsePastedText(pastedText);
    
    if (parsedPoints.length === 0) {
      return; // No valid points found
    }
    
    // Update form data with parsed points and detected date
    const updatedFormData = {
      ...formData,
      bulletPoints: parsedPoints.length > 1 ? parsedPoints : parsedPoints,
      ...(detectedDate && { sessionDate: detectedDate }),
    };
    
    setFormData(updatedFormData);
    
    // Auto-expand all textareas after a brief delay
    setTimeout(() => {
      const textareas = document.querySelectorAll('textarea[placeholder*="Learning point"]') as NodeListOf<HTMLTextAreaElement>;
      textareas.forEach((textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(44, textarea.scrollHeight)}px`;
      });
    }, 10);
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
        // Split by newlines first, then process each line
        const lines = point.points.split(/\n/);
        const bulletPoints: string[] = [];
        
        for (const line of lines) {
          let trimmed = line.trim();
          
          // Skip empty lines
          if (!trimmed) continue;
          
          // Remove bullet markers only at the START of the line
          // Match: - or • at the beginning, followed by optional space
          trimmed = trimmed.replace(/^[-•]\s+/, ''); // Only match - or • at start with space after
          trimmed = trimmed.replace(/^•\s*/, ''); // Also handle • without space
          
          // Don't split on -> arrows or other dashes in the middle of text
          // Only process if this line starts with a bullet marker
          if (trimmed) {
            bulletPoints.push(trimmed);
          }
        }
        
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

  const saveReviewData = async (sessionDate: string, reviewInfo: { lastReviewed: string; reviewCount: number; reviewHistory?: any[] }) => {
    try {
      // Update local state immediately
      const newData = {
        ...reviewData,
        [sessionDate]: {
          lastReviewed: reviewInfo.lastReviewed,
          reviewCount: reviewInfo.reviewCount,
        },
      };
      setReviewData(newData);
      
      // Save to Supabase
      await upsertLearningPointReview({
        tuteeId: tutee.id,
        sessionDate,
        lastReviewed: reviewInfo.lastReviewed,
        reviewCount: reviewInfo.reviewCount,
        reviewHistory: reviewInfo.reviewHistory,
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

  const markAsReviewed = async (sessionDate: string, history?: any[]) => {
    const sessionKey = sessionDate;
    const current = reviewData[sessionKey];
    const reviewInfo = {
      lastReviewed: new Date().toISOString(),
      reviewCount: current ? current.reviewCount + 1 : 1,
      reviewHistory: history,
    };
    await saveReviewData(sessionKey, reviewInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 pb-20 sm:pb-8 safe-area-inset">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="pt-4 sm:pt-6 mb-4 sm:mb-8">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 sm:mb-6 transition-all bg-white/50 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm hover:shadow-md active:scale-95 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back</span>
          </button>
          
          <div className="bg-white/40 backdrop-blur-md p-4 sm:p-8 rounded-[2rem] sm:rounded-3xl shadow-xl border border-white/20">
            <div className="flex flex-row items-center gap-3 sm:gap-6">
              <div className={`p-3 sm:p-4 bg-gradient-to-br ${gradientClass} rounded-xl sm:rounded-2xl shadow-lg flex-shrink-0`}>
                <BookOpen className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                  <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight truncate">
                    Vault
                  </h1>
                  <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${gradientClass} text-white shadow-sm flex-shrink-0`}>
                    Points
                  </span>
                </div>
                <p className="text-gray-600 text-xs sm:text-lg font-medium truncate">{tutee.name}'s Knowledge Base</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-8">
              <div className={`bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/50 shadow-sm`}>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 sm:mb-1">Sessions</p>
                <p className="text-xl sm:text-3xl font-black text-gray-800 tracking-tighter">{uniqueSessionDates.size}</p>
              </div>
              <div className={`bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/50 shadow-sm`}>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 sm:mb-1">Points</p>
                <p className="text-xl sm:text-3xl font-black text-gray-800 tracking-tighter">{totalLearningPoints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Feedback */}
        <div className="space-y-4 mb-6">
          {showSuccess && (
            <div className="bg-green-500 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-green-100 animate-fade-in">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <p className="font-bold text-sm">Learning points secured! 🎉</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500 text-white rounded-2xl p-4 shadow-lg shadow-red-100 animate-shake">
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-5 sm:p-10 mb-8 border border-white/40 animate-fade-in-up">
          <div className="flex flex-row items-center justify-between mb-6 sm:mb-8">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight leading-tight truncate">
                {editingPoint ? 'Refine Points' : 'Record Progress'}
              </h2>
              <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1 truncate">
                {editingPoint ? 'Update your existing session' : 'Log what you learned today'}
              </p>
            </div>
            {editingPoint && (
              <button
                onClick={handleAddNew}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-500 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 flex-shrink-0"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-8">
            {/* Date Input */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Session Date
              </label>
              <input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-2xl outline-none transition-all text-lg font-bold text-gray-800 shadow-inner"
              />
            </div>

            {/* Bullet Points Input */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Insights & Notes *
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit">
                    Multiline Paste Supported
                  </div>
                  <div className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[9px] font-black uppercase tracking-tighter w-fit">
                    Tip: Use /H2O/ for subscripts
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {formData.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 group animate-fade-in">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform`}>
                      <span className="text-white font-black text-sm">{index + 1}</span>
                    </div>
                    <textarea
                      value={point}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        const lastChar = newValue.slice(-1);
                        
                        // Check if we should trigger conversion (on space or enter)
                        if (lastChar === ' ' || lastChar === '\n') {
                          const processed = convertChemistryNotation(newValue);
                          updateBulletPoint(index, processed);
                        } else {
                          updateBulletPoint(index, newValue);
                        }
                      }}
                      onPaste={(e) => handlePaste(e, index)}
                      onBlur={(e) => {
                        const processed = convertChemistryNotation(e.target.value);
                        if (processed !== e.target.value) {
                          updateBulletPoint(index, processed);
                        }
                      }}
                      placeholder={index === 0 ? "What's the key takeaway?" : "Add another point..."}
                      className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all text-[16px] sm:text-base font-medium text-gray-800 shadow-inner min-h-[60px]"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.max(60, target.scrollHeight)}px`;
                      }}
                    />
                    {formData.bulletPoints.length > 1 && (
                      <button
                        onClick={() => removeBulletPoint(index)}
                        className="flex-shrink-0 p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        aria-label="Remove point"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addBulletPoint}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-gray-50 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all font-black text-xs uppercase tracking-widest active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" />
                Category Tags
              </label>
              <div className="flex gap-2 mb-4">
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
                  placeholder="Topic (e.g. Physics)"
                  className="flex-1 min-w-0 px-3 sm:px-6 py-2.5 sm:py-4 bg-gray-50/50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-xl sm:rounded-2xl outline-none transition-all font-bold text-gray-800 shadow-inner text-xs sm:text-base"
                />
                <button
                  onClick={addTag}
                  className="px-4 sm:px-8 py-2.5 sm:py-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-xs shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex-shrink-0"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${gradientClass} text-white flex items-center gap-2 sm:gap-3 shadow-sm`}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-white/20 rounded-lg p-0.5 sm:p-1"
                      >
                        <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
              className={`w-full bg-gradient-to-r ${gradientClass} text-white py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black text-base sm:text-xl shadow-xl hover:shadow-2xl hover:opacity-95 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest mt-4`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                  <span className="text-sm sm:text-base">Syncing...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">{editingPoint ? 'Confirm Edit' : 'Commit to Vault'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Spaced Repetition Review Section */}
        {mergedSessions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-xl p-6 sm:p-10 mb-8 border border-white/40 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Memory Refresh</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Review items due today</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-2xl">
                <RotateCcw className="w-6 h-6 text-yellow-600 animate-spin-slow" />
              </div>
            </div>
            
            <div className="space-y-4">
              {mergedSessions
                .filter(session => getReviewStatus(session.sessionDate).isDue)
                .map((session, index) => {
                  const status = getReviewStatus(session.sessionDate);
                  return (
                    <div
                      key={session.sessionDate}
                      className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 border-yellow-100 rounded-2xl sm:rounded-3xl shadow-sm animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                          <span className="font-black text-gray-800 text-base sm:text-lg tracking-tight">
                            {format(parseISO(session.sessionDate), 'EEE, MMM d')}
                          </span>
                          {status.reviewCount !== undefined && (
                            <span className="px-2 py-0.5 bg-white/60 text-[8px] font-black text-yellow-700 uppercase tracking-widest rounded-full border border-yellow-200 shadow-sm">
                              Cycle {status.reviewCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs font-bold text-yellow-700 uppercase tracking-widest opacity-80">Strengthen your neural pathways!</p>
                      </div>
                      <button
                        onClick={() => {
                          setReviewModal({
                            isOpen: true,
                            sessionDate: session.sessionDate,
                            learningPoints: session.bulletPoints,
                          });
                        }}
                        className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r ${gradientClass} text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3`}
                      >
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                        <span>Start Review</span>
                      </button>
                    </div>
                  );
                })}
              {mergedSessions.filter(s => getReviewStatus(s.sessionDate).isDue).length === 0 && (
                <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <p className="text-xl font-black text-gray-400 uppercase tracking-tight">All Caught Up!</p>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">Your memory is sharp today</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Learning Points */}
        <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] shadow-xl p-6 sm:p-10 border border-white/40">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight text-left">The Archive</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Historical Learning Data</p>
            </div>
            <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              {mergedSessions.length} Sessions
            </div>
          </div>
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading vault...</p>
            </div>
          ) : mergedSessions.length === 0 ? (
            <div className="py-24 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
                <BookOpen className="w-12 h-12 text-gray-200" />
              </div>
              <h3 className="text-2xl font-black text-gray-400 uppercase tracking-tight">Vault Empty</h3>
              <p className="text-gray-300 font-bold uppercase tracking-widest text-[10px] mt-2 px-6">Start logging to build your library</p>
            </div>
          ) : (
            <div className="space-y-6">
              {mergedSessions.map((session, index) => {
                const reviewStatus = getReviewStatus(session.sessionDate);
                
                return (
                  <div
                    key={session.sessionDate}
                    className={`relative p-4 sm:p-8 border-2 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all duration-300 group hover:shadow-2xl active:scale-[0.99] touch-manipulation overflow-hidden ${
                      reviewStatus.isDue 
                        ? 'border-yellow-200 bg-yellow-50/30' 
                        : 'border-gray-50 bg-white/50 hover:border-indigo-100'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-6 mb-4 sm:mb-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
                          <span className="font-black text-gray-800 text-base sm:text-xl tracking-tight leading-tight">
                            {format(parseISO(session.sessionDate), 'EEEE, d MMM')}
                          </span>
                          {reviewStatus.isDue && (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-yellow-500 text-white rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-lg shadow-yellow-100 animate-pulse">
                              Urgent Review
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-4">
                          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-50 text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest rounded-lg border border-gray-100">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {format(parseISO(session.createdAt), 'MMM d, h:mm a')}
                          </div>
                          {reviewStatus.lastReviewed && (
                            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-50 text-[8px] sm:text-[9px] font-black text-blue-500 uppercase tracking-widest rounded-lg border border-blue-100">
                              <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              Refreshed: {format(parseISO(reviewStatus.lastReviewed), 'MMM d')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleEdit(session)}
                          className="p-3 sm:p-4 bg-white text-indigo-600 rounded-xl sm:rounded-2xl shadow-sm border border-gray-50 hover:bg-indigo-50 active:scale-90 transition-all group-hover:shadow-md"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const idsToDelete = session.ids;
                            if (idsToDelete.length > 0) {
                              setDeleteConfirm({ isOpen: true, pointId: idsToDelete.join(',') });
                            }
                          }}
                          className="p-3 sm:p-4 bg-white text-red-400 rounded-xl sm:rounded-2xl shadow-sm border border-gray-50 hover:bg-red-50 active:scale-90 transition-all group-hover:shadow-md"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-8 bg-white/40 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-inner border border-white/20">
                      {session.bulletPoints.map((bp, bpIndex) => (
                        <div key={bpIndex} className="flex items-start gap-3 sm:gap-4">
                          <div className={`flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md transform -rotate-12`}>
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
                          </div>
                          <p className="text-gray-700 flex-1 font-medium leading-relaxed text-xs sm:text-sm md:text-base">{convertChemistryNotation(bp)}</p>
                        </div>
                      ))}
                    </div>
                    
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 px-1">
                        {session.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 border border-gray-200 shadow-sm`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${gradientClass} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
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
        onClose={() => setDeleteConfirm({ isOpen: false, pointId: null })}
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

      <LearningPointReviewGPTModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
        onSuccess={async (history) => {
          await markAsReviewed(reviewModal.sessionDate, history);
          setReviewModal(prev => ({ ...prev, isOpen: false }));
        }}
        tutee={tutee}
        sessionDate={reviewModal.sessionDate}
        learningPoints={reviewModal.learningPoints}
      />
    </div>
  );
};

export default LearningPointsPage;

