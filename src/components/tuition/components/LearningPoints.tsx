import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import {
  fetchLearningPoints,
  LearningPoint as LearningPointType,
} from '../../../services/componentService';

interface LearningPointsProps {
  tutee: Tutee;
}

const LearningPoints = ({ tutee }: LearningPointsProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [points, setPoints] = useState<LearningPointType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoints();
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

  // Calculate total learning points (count actual bullet points, not sessions)
  const totalLearningPoints = points.reduce((sum, point) => {
    const pointCount = point.points.split(/\n|•|-\s*/).filter(p => p.trim().length > 0).length;
    return sum + pointCount;
  }, 0);
  
  // Count unique session dates
  const uniqueSessionDates = new Set(points.map(p => p.sessionDate));
  const totalSessions = uniqueSessionDates.size;
  const gradientClass = tutee.colorScheme.gradient;
  
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
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 animate-fade-in-up">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-smooth card-hover animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 sm:p-3 bg-gradient-to-br ${gradientClass} rounded-lg sm:rounded-xl flex-shrink-0`}>
            <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Learning Points</h2>
            <p className="text-sm sm:text-base text-gray-600">{tutee.name}</p>
          </div>
        </div>

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
          className={`w-full bg-gradient-to-r ${gradientClass} text-white py-3.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-smooth press-effect min-h-[44px] touch-manipulation`}
        >
          {points.length === 0 ? 'Add Learning Points ✨' : 'View & Manage Points'}
        </button>
      </div>
    </>
  );
};

export default LearningPoints;
