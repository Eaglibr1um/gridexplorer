import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, BookOpen, Plus, Trash2, Edit2, Save, Sparkles, CheckCircle2, Calendar, Tag, Clock, RotateCcw, X, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [showTags, setShowTags] = useState(false);
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
  const [showTips, setShowTips] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

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

  const totalReviewsCompleted = useMemo(() => {
    return Object.values(reviewData).reduce((sum, review) => sum + review.reviewCount, 0);
  }, [reviewData]);

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
      return { isDue: true, nextReview: null, daysUntil: 0, daysOverdue: 0, lastReviewed: null };
    }

    const nextReview = getNextReviewDate(review.reviewCount, review.lastReviewed);
    const daysUntil = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isDue: daysUntil <= 0,
      nextReview,
      daysUntil: Math.max(0, daysUntil),
      daysOverdue: daysUntil < 0 ? Math.abs(daysUntil) : 0,
      reviewCount: review.reviewCount,
      lastReviewed: review.lastReviewed,
    };
  };

  const dueReviewsCount = useMemo(() => {
    return mergedSessions.filter(session => getReviewStatus(session.sessionDate).isDue).length;
  }, [mergedSessions, reviewData]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    return { daysInMonth, startDayOfWeek, year, month };
  };

  const getDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasLearningPoint = (dateStr: string) => {
    return mergedSessions.some(s => s.sessionDate === dateStr);
  };

  const hasReview = (dateStr: string) => {
    return Object.entries(reviewData).some(([_, review]) => {
      const reviewDate = review.lastReviewed.split('T')[0];
      return reviewDate === dateStr;
    });
  };

  const goToPreviousMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCalendarDate(new Date());
  };

  const getSessionsForDate = (dateStr: string) => {
    return mergedSessions.filter(s => s.sessionDate === dateStr);
  };

  const getReviewsForDate = (dateStr: string) => {
    return Object.entries(reviewData)
      .filter(([_, review]) => {
        const reviewDate = review.lastReviewed.split('T')[0];
        return reviewDate === dateStr;
      })
      .map(([sessionDate, review]) => ({
        sessionDate,
        ...review,
      }));
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
                <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight truncate">
                    Vault
                  </h1>
                  <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${gradientClass} text-white shadow-sm flex-shrink-0`}>
                    Points
                  </span>
                  {dueReviewsCount > 0 && (
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-white shadow-md shadow-yellow-200 animate-pulse flex-shrink-0">
                      {dueReviewsCount} Due
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xs sm:text-lg font-medium truncate">{tutee.name}'s Knowledge Base</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-8">
              <div className={`bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/50 shadow-sm`}>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 sm:mb-1">Sessions</p>
                <p className="text-xl sm:text-3xl font-black text-gray-800 tracking-tighter">{uniqueSessionDates.size}</p>
              </div>
              <div className={`bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/50 shadow-sm`}>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 sm:mb-1">Points</p>
                <p className="text-xl sm:text-3xl font-black text-gray-800 tracking-tighter">{totalLearningPoints}</p>
              </div>
              <div className={`bg-white/60 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/50 shadow-sm col-span-2 sm:col-span-1`}>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 sm:mb-1">Reviews Completed</p>
                <p className="text-xl sm:text-3xl font-black text-gray-800 tracking-tighter">{totalReviewsCompleted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Section: Calendar + Review Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calendar View */}
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-5 sm:p-8 border border-white/40">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-gradient-to-br ${gradientClass} rounded-xl shadow-md`}>
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">Activity</h2>
                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Track your progress</p>
              </div>
            </div>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-all active:scale-95"
            >
              Today
            </button>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-base sm:text-lg font-black text-gray-800">
              {format(calendarDate, 'MMMM yyyy')}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white/40 rounded-2xl p-3 sm:p-4 border border-white/50">
            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {(() => {
                const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(calendarDate);
                const days = [];
                
                // Empty cells before first day
                for (let i = 0; i < startDayOfWeek; i++) {
                  days.push(
                    <div key={`empty-${i}`} className="aspect-square" />
                  );
                }
                
                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = getDateString(year, month, day);
                  const hasPoint = hasLearningPoint(dateStr);
                  const hasReviewMark = hasReview(dateStr);
                  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                  const isClickable = hasPoint || hasReviewMark;
                  
                  days.push(
                    <button
                      key={day}
                      onClick={() => isClickable && setSelectedDate(dateStr)}
                      disabled={!isClickable}
                      className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-bold transition-all ${
                        isToday
                          ? `bg-gradient-to-br ${gradientClass} text-white shadow-md`
                          : hasPoint || hasReviewMark
                          ? 'bg-white/60 text-gray-700 hover:bg-white/80 cursor-pointer active:scale-95'
                          : 'text-gray-300 hover:bg-white/30 cursor-default'
                      }`}
                    >
                      <span>{day}</span>
                      <div className="flex gap-0.5">
                        {hasPoint && (
                          <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                            isToday ? 'bg-white' : 'bg-indigo-400'
                          }`} />
                        )}
                        {hasReviewMark && (
                          <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                            isToday ? 'bg-white' : 'bg-green-400'
                          }`} />
                        )}
                      </div>
                    </button>
                  );
                }
                
                return days;
              })()}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-400" />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">Learning Point</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-400" />
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-500">Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Review Hub */}
        {mergedSessions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-5 sm:p-8 border border-white/40">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-gradient-to-br ${gradientClass} rounded-xl shadow-md`}>
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight">Review Hub</h2>
                  <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    📚 Intervals: 1, 3, 7, 14, 30, 60, 90 days
                  </p>
                </div>
              </div>
            </div>
            
            {(() => {
              const dueItems = mergedSessions.filter(s => getReviewStatus(s.sessionDate).isDue);
              const upcomingItems = mergedSessions
                .filter(s => !getReviewStatus(s.sessionDate).isDue && getReviewStatus(s.sessionDate).reviewCount !== undefined)
                .sort((a, b) => {
                  const aStatus = getReviewStatus(a.sessionDate);
                  const bStatus = getReviewStatus(b.sessionDate);
                  if (!aStatus.nextReview || !bStatus.nextReview) return 0;
                  return aStatus.nextReview.getTime() - bStatus.nextReview.getTime();
                });
              const completedItems = mergedSessions.filter(s => {
                const status = getReviewStatus(s.sessionDate);
                return status.reviewCount !== undefined && status.reviewCount > 0 && !status.isDue;
              });

              return (
                <div className="space-y-6">
                  {/* DUE NOW Section */}
                  {dueItems.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-black text-gray-800 tracking-tight flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
                          DUE NOW ({dueItems.length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {dueItems
                          .sort((a, b) => {
                            const aStatus = getReviewStatus(a.sessionDate);
                            const bStatus = getReviewStatus(b.sessionDate);
                            return (bStatus.daysOverdue || 0) - (aStatus.daysOverdue || 0);
                          })
                          .map((session, index) => {
                            const status = getReviewStatus(session.sessionDate);
                            return (
                              <div
                                key={session.sessionDate}
                                className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 border-yellow-200 rounded-2xl sm:rounded-3xl shadow-sm animate-fade-in-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                                    <span className="font-black text-gray-800 text-base sm:text-lg tracking-tight">
                                      {format(parseISO(session.sessionDate), 'EEE, MMM d')}
                                    </span>
                                    {status.reviewCount !== undefined && (
                                      <span className="px-2 py-0.5 bg-white/60 text-[8px] font-black text-yellow-700 uppercase tracking-widest rounded-full border border-yellow-200 shadow-sm">
                                        Review #{status.reviewCount + 1}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] sm:text-xs font-bold text-yellow-700 uppercase tracking-widest opacity-80">
                                    {status.reviewCount === 0 ? (
                                      'First review - strengthen memory!'
                                    ) : status.daysOverdue === 0 ? (
                                      'Due today - review now!'
                                    ) : status.daysOverdue === 1 ? (
                                      '⏰ 1 day overdue'
                                    ) : (
                                      `⏰ ${status.daysOverdue} days overdue`
                                    )}
                                  </p>
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
                      </div>
                    </div>
                  )}

                  {/* UPCOMING Section */}
                  {upcomingItems.length > 0 && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                        className="w-full flex items-center justify-between p-3 bg-blue-50/50 hover:bg-blue-50 rounded-xl transition-all active:scale-[0.99]"
                      >
                        <h3 className="text-sm sm:text-base font-black text-gray-800 tracking-tight flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-400" />
                          UPCOMING ({upcomingItems.length})
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500">
                            {showAllUpcoming ? 'Show Less' : 'View All'}
                          </span>
                          <div className={`transition-transform ${showAllUpcoming ? 'rotate-180' : ''}`}>
                            ▼
                          </div>
                        </div>
                      </button>
                      <div className="bg-white/40 rounded-2xl p-3 border border-white/50">
                        <div className="grid gap-2">
                          {(showAllUpcoming ? upcomingItems : upcomingItems.slice(0, 6)).map(session => {
                            const status = getReviewStatus(session.sessionDate);
                            return (
                              <div
                                key={session.sessionDate}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-all"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-700 truncate">
                                      {format(parseISO(session.sessionDate), 'MMM d, yyyy')}
                                    </p>
                                    <p className="text-[9px] text-gray-500 font-medium truncate">
                                      {session.bulletPoints.length} point{session.bulletPoints.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {status.reviewCount !== undefined && (
                                    <span className="px-2 py-0.5 bg-white/60 rounded-full text-[8px] font-black text-gray-500 uppercase tracking-wider">
                                      R{status.reviewCount}
                                    </span>
                                  )}
                                  {status.nextReview && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-blue-100">
                                      {format(status.nextReview, 'MMM d')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COMPLETED Section */}
                  {completedItems.length > 0 && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="w-full flex items-center justify-between p-3 bg-green-50/50 hover:bg-green-50 rounded-xl transition-all active:scale-[0.99]"
                      >
                        <h3 className="text-sm sm:text-base font-black text-gray-800 tracking-tight flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-400" />
                          COMPLETED ({completedItems.length})
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500">
                            {showCompleted ? 'Hide' : 'View History'}
                          </span>
                          <div className={`transition-transform ${showCompleted ? 'rotate-180' : ''}`}>
                            ▼
                          </div>
                        </div>
                      </button>
                      {showCompleted && (
                        <div className="bg-white/40 rounded-2xl p-3 border border-white/50">
                          <div className="grid gap-2">
                            {completedItems.slice(0, 10).map(session => {
                              const status = getReviewStatus(session.sessionDate);
                              return (
                                <div
                                  key={session.sessionDate}
                                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50/30 border border-gray-100"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    <p className="text-xs font-medium text-gray-600 truncate">
                                      {format(parseISO(session.sessionDate), 'MMM d')}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="px-2 py-0.5 bg-green-100 rounded-full text-[8px] font-black text-green-700 uppercase tracking-wider">
                                      {status.reviewCount}x
                                    </span>
                                    {status.lastReviewed && (
                                      <span className="text-[9px] text-gray-400 font-medium">
                                        Last: {format(parseISO(status.lastReviewed), 'MMM d')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Caught Up State */}
                  {dueItems.length === 0 && upcomingItems.length === 0 && completedItems.length === 0 && (
                    <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-50">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                      </div>
                      <p className="text-xl font-black text-gray-400 uppercase tracking-tight">All Caught Up!</p>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">No reviews scheduled yet</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTips(!showTips)}
                    onMouseEnter={() => setShowTips(true)}
                    onMouseLeave={() => setShowTips(false)}
                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:from-indigo-100 hover:to-purple-100 transition-all border border-indigo-100 shadow-sm"
                  >
                    <Info className="w-3 h-3" />
                    Tips
                  </button>
                  {showTips && (
                      <div 
                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border-2 border-indigo-100 p-4 z-50 animate-fade-in"
                        onMouseEnter={() => setShowTips(true)}
                        onMouseLeave={() => setShowTips(false)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Multiline Paste</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Paste multiple lines at once - they'll auto-split into separate points</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-black text-purple-600">H₂</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Subscripts</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Use <code className="px-1 py-0.5 bg-gray-100 rounded text-[9px] font-mono">/H2O/</code> for H₂O</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-black text-pink-600">cm³</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Superscripts</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Use <code className="px-1 py-0.5 bg-gray-100 rounded text-[9px] font-mono">cm^3^</code> for cm³</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-black text-orange-600">°C</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Temperature</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Use <code className="px-1 py-0.5 bg-gray-100 rounded text-[9px] font-mono">25C</code> for 25°C</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-black text-green-600">⇌</span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">Chemistry Symbols</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Use <code className="px-1 py-0.5 bg-gray-100 rounded text-[9px] font-mono">&lt;-&gt;</code> for ⇌, auto Greek letters (delta → Δ)</p>
                            </div>
                          </div>
                        </div>
                      </div>
                  )}
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
              <button
                type="button"
                onClick={() => setShowTags(!showTags)}
                className="w-full text-left block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1 flex items-center gap-2 hover:text-gray-600 transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                Category Tags
                <span className="text-[8px] text-gray-400 ml-auto mr-1">(Click to {showTags ? 'hide' : 'show'})</span>
              </button>
              {showTags && (
                <>
                  <div className="flex gap-2 mb-4 animate-fade-in">
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
                    <div className="flex flex-wrap gap-2 animate-fade-in">
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
                </>
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
                              Review Due
                            </span>
                          )}
                          {!reviewStatus.isDue && reviewStatus.nextReview && (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-blue-200">
                              Next: {format(reviewStatus.nextReview, 'MMM d')}
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

      {/* Date Details Modal */}
      {selectedDate && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedDate(null)}
        >
          <div 
            className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 p-6 rounded-t-[2rem] z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">
                    {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                    Activity Summary
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Learning Points Created */}
              {getSessionsForDate(selectedDate).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-indigo-400" />
                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                      Learning Points Created
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {getSessionsForDate(selectedDate).map((session) => (
                      <div
                        key={session.sessionDate}
                        className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100"
                      >
                        <div className="space-y-2">
                          {session.bulletPoints.map((point, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <div className={`flex-shrink-0 w-5 h-5 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center mt-0.5`}>
                                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                              </div>
                              <p className="text-sm text-gray-700 font-medium flex-1">
                                {convertChemistryNotation(point)}
                              </p>
                            </div>
                          ))}
                        </div>
                        {session.tags && session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-indigo-100">
                            {session.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-white/60 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Completed */}
              {getReviewsForDate(selectedDate).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-widest">
                      Reviews Completed
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {getReviewsForDate(selectedDate).map((review) => {
                      const session = mergedSessions.find(s => s.sessionDate === review.sessionDate);
                      return (
                        <div
                          key={review.sessionDate}
                          className="bg-green-50/50 rounded-2xl p-4 border border-green-100"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-gray-700">
                              Session from {format(parseISO(review.sessionDate), 'MMM d, yyyy')}
                            </p>
                            <span className="px-2 py-1 bg-white/60 rounded-lg text-[9px] font-black uppercase tracking-widest text-green-600">
                              Review #{review.reviewCount}
                            </span>
                          </div>
                          {session && (
                            <p className="text-xs text-gray-500 font-medium">
                              {session.bulletPoints.length} point{session.bulletPoints.length !== 1 ? 's' : ''} reviewed
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {getSessionsForDate(selectedDate).length === 0 && getReviewsForDate(selectedDate).length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No activity on this date
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

