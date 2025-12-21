import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, RotateCcw, AlertCircle } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { fetchLearningPoints, LearningPoint as LearningPointType } from '../../../services/componentService';
import { fetchLearningPointReviews } from '../../../services/learningPointReviewService';
import Skeleton from '../../ui/Skeleton';

interface LearningPointsProps {
  tutee: Tutee;
}

const LearningPoints = ({ tutee }: LearningPointsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [points, setPoints] = useState<LearningPointType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<Record<string, { lastReviewed: string; reviewCount: number }>>({});

  useEffect(() => {
    loadPoints();
    loadReviewData();
  }, [tutee.id]);

  const loadPoints = async () => {
    try {
      setLoading(true);
      const data = await fetchLearningPoints(tutee.id);
      setPoints(data);
    } catch (err) {
      console.error('Failed to load learning points:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviewData = async () => {
    try {
      const reviews = await fetchLearningPointReviews(tutee.id);
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
    }
  };

  // Calculate total learning points (count actual bullet points, not sessions)
  const totalLearningPoints = points.reduce((sum, point) => {
    const pointCount = point.points.split(/\n|•|-\s*/).filter(p => p.trim().length > 0).length;
    return sum + pointCount;
  }, 0);
  
  // Count unique session dates
  const uniqueSessionDates = new Set(points.map(p => p.sessionDate));
  const totalSessions = uniqueSessionDates.size;
  const gradientClass = tutee.colorScheme.gradient;

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
    const review = reviewData[sessionDate];
    const now = new Date();
    
    if (!review) {
      // Never reviewed - due immediately
      return { isDue: true };
    }

    const nextReview = getNextReviewDate(review.reviewCount, review.lastReviewed);
    const daysUntil = Math.ceil((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isDue: daysUntil <= 0,
    };
  };

  // Calculate sessions due for review
  const sessionsDueForReview = (() => {
    const sessionDates = Array.from(uniqueSessionDates);
    return sessionDates.filter(sessionDate => {
      return getReviewStatus(sessionDate).isDue;
    }).length;
  })();
  
  const handleClick = () => {
    setSearchParams({ learningPoints: 'true' });
  };
  
  // Use lighter background colors like quiz cards based on tutee's color scheme
  const getBgClass = () => {
    const primary = tutee.colorScheme.primary;
    if (primary === 'pink' || primary === 'purple') return 'bg-purple-50';
    if (primary === 'green' || primary === 'teal') return 'bg-teal-50';
    if (primary === 'blue' || primary === 'cyan') return 'bg-cyan-50';
    if (primary === 'indigo') return 'bg-indigo-50';
    if (primary === 'orange' || primary === 'red') return 'bg-orange-50';
    if (primary === 'yellow' || primary === 'amber') return 'bg-yellow-50';
    return 'bg-purple-50';
  };
  
  const getTextClass = () => {
    const primary = tutee.colorScheme.primary;
    if (primary === 'pink' || primary === 'purple') return 'text-purple-600';
    if (primary === 'green' || primary === 'teal') return 'text-teal-600';
    if (primary === 'blue' || primary === 'cyan') return 'text-cyan-600';
    if (primary === 'indigo') return 'text-indigo-600';
    if (primary === 'orange' || primary === 'red') return 'text-orange-600';
    if (primary === 'yellow' || primary === 'amber') return 'text-yellow-600';
    return 'text-purple-600';
  };
  
  const bgClass = getBgClass();
  const textClass = getTextClass();

  // Card view (compact, like quiz cards)
  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="h-12 rounded-lg w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-smooth card-hover animate-fade-in-up relative">
        {/* Review Badge */}
        {sessionsDueForReview > 0 && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg animate-pulse z-10">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">{sessionsDueForReview}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 sm:p-3 bg-gradient-to-br ${gradientClass} rounded-lg sm:rounded-xl flex-shrink-0`}>
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Learning Points</h2>
            <p className="text-sm sm:text-base text-gray-600">{tutee.name}</p>
          </div>
        </div>

        {/* Review Alert Banner */}
        {sessionsDueForReview > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg flex items-center gap-2 animate-fade-in">
            <RotateCcw className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                {sessionsDueForReview} session{sessionsDueForReview !== 1 ? 's' : ''} due for review! 📚
              </p>
              <p className="text-xs text-yellow-700">Review your learning points to strengthen your memory</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className={`${bgClass} rounded-lg p-3 sm:p-4`}>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Sessions</p>
            <p className={`text-xl sm:text-2xl font-bold ${textClass}`}>
              {totalSessions}
            </p>
          </div>
          <div className={`${bgClass} rounded-lg p-3 sm:p-4`}>
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Learning Points</p>
            <p className={`text-xl sm:text-2xl font-bold ${textClass}`}>
              {totalLearningPoints}
            </p>
          </div>
        </div>

        <button
          onClick={handleClick}
          className={`w-full bg-gradient-to-r ${gradientClass} text-white py-3.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-smooth press-effect min-h-[44px] touch-manipulation relative`}
        >
          {points.length === 0 ? 'Add Learning Points ✨' : sessionsDueForReview > 0 ? `Review ${sessionsDueForReview} Session${sessionsDueForReview !== 1 ? 's' : ''} 🔔` : 'View & Manage Points'}
        </button>
      </div>
    </>
  );
};

export default LearningPoints;
