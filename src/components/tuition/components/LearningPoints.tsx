import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, RotateCcw, AlertCircle, ArrowRight, Bell } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { fetchLearningPoints, LearningPoint as LearningPointType } from '../../../services/componentService';
import { fetchLearningPointReviews } from '../../../services/learningPointReviewService';
import { notificationService } from '../../../services/notificationService';
import Skeleton from '../../ui/Skeleton';

interface LearningPointsProps {
  tutee: Tutee;
}

const LearningPoints = ({ tutee }: LearningPointsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [points, setPoints] = useState<LearningPointType[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewData, setReviewData] = useState<Record<string, { lastReviewed: string; reviewCount: number }>>({});
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    loadPoints();
    loadReviewData();
    checkSubscription();
  }, [tutee.id]);

  const checkSubscription = async () => {
    if (notificationService.isSupported()) {
      const subscribed = await notificationService.isSubscribed();
      setIsSubscribed(subscribed);
    }
  };

  const handleSubscribe = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.subscribeUser(tutee.id);
      setIsSubscribed(true);
    } catch (err) {
      console.error('Failed to subscribe:', err);
    }
  };

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
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/40 overflow-hidden flex flex-col animate-fade-in-up touch-manipulation relative h-full">
        {/* Review Badge */}
        {sessionsDueForReview > 0 && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg animate-pulse z-10">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-black">{sessionsDueForReview}</span>
          </div>
        )}
        
        <div className="p-6 sm:p-8 flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-4 bg-gradient-to-br ${gradientClass} rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black text-gray-800 leading-tight">Learning Points</h2>
              <p className="text-gray-500 font-medium">Spaced Repetition</p>
            </div>
          </div>

          {/* Review Alert Banner */}
          {sessionsDueForReview > 0 && (
            <div className="mb-6 flex flex-col gap-2">
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl flex items-center gap-3 animate-fade-in shadow-sm">
                <RotateCcw className="w-6 h-6 text-yellow-600 flex-shrink-0 animate-spin-slow" />
                <div className="flex-1">
                  <p className="text-sm font-black text-yellow-800 uppercase tracking-tight">
                    Review Due! 📚
                  </p>
                  <p className="text-xs font-bold text-yellow-700/80 uppercase tracking-widest mt-0.5">Time to strengthen memory</p>
                </div>
              </div>
              
              {!isSubscribed && notificationService.isSupported() && (
                <button
                  onClick={handleSubscribe}
                  className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 hover:bg-indigo-100 transition-colors group/notif"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 group-hover/notif:scale-110 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-indigo-900">Get reminders?</p>
                    <p className="text-[10px] text-indigo-600 font-medium">Get notified when reviews are due</p>
                  </div>
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className={`${bgClass} rounded-2xl p-4 border border-white/50 shadow-inner`}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Sessions</p>
              <p className={`text-2xl font-black ${textClass}`}>
                {totalSessions}
              </p>
            </div>
            <div className={`${bgClass} rounded-2xl p-4 border border-white/50 shadow-inner`}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Points</p>
              <p className={`text-2xl font-black ${textClass}`}>
                {totalLearningPoints}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={handleClick}
            className={`w-full bg-gradient-to-r ${gradientClass} text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-xl hover:opacity-95 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-widest`}
          >
            {points.length === 0 ? 'Start Learning ✨' : sessionsDueForReview > 0 ? `Review Now 🔔` : 'View points'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};

export default LearningPoints;
