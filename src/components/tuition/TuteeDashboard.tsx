import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, BarChart3, Clock, Trophy } from 'lucide-react';
import { Tutee, QuizRecord } from '../../types/tuition';
import ScienceSpellingQuiz from '../ScienceSpellingQuiz';
import IBChemistryQuiz from '../IBChemistryQuiz';
import TuitionCalendar from './TuitionCalendar';
import ColorCustomization from './ColorCustomization';
import PinChange from './PinChange';
import IconCustomization from './IconCustomization';
import LearningPoints from './components/LearningPoints';
import WorksheetTracker from './components/WorksheetTracker';
import SharedFiles from './components/SharedFiles';
import LearningPointsPage from './LearningPointsPage';
import FeedbackButton from './FeedbackButton';
import MyFeedback from './MyFeedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchTuteeComponents, TuteeComponent } from '../../services/componentService';
import Skeleton from '../ui/Skeleton';

interface TuteeDashboardProps {
  tutee: Tutee;
  onBack: () => void;
}

const TuteeDashboard = ({ tutee: initialTutee, onBack }: TuteeDashboardProps) => {
  const [tutee, setTutee] = useState<Tutee>(initialTutee);
  const [searchParams, setSearchParams] = useSearchParams();
  const [components, setComponents] = useState<TuteeComponent[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(true);
  
  // Update document title
  useDocumentTitle(`Tuition - ${tutee.name}`);
  const quizParam = searchParams.get('quiz') as 'spelling' | 'chemistry' | null;
  const currentQuiz = quizParam && ['spelling', 'chemistry'].includes(quizParam) ? quizParam : null;
  const showLearningPoints = searchParams.get('learningPoints') === 'true';
  
  const [allRecords, setAllRecords] = useState<{
    spelling: { rayne: QuizRecord[]; jeffrey: QuizRecord[] };
    chemistry: QuizRecord[];
  }>({
    spelling: { rayne: [], jeffrey: [] },
    chemistry: []
  });

  useEffect(() => {
    // Load quiz records based on tutee
    const spellingRecords = localStorage.getItem(`spellingRecords_${tutee.id}`);
    const chemistryRecords = localStorage.getItem(`ibChemistryRecords_${tutee.id}`);
    
    if (spellingRecords) {
      setAllRecords(prev => ({
        ...prev,
        spelling: JSON.parse(spellingRecords)
      }));
    } else {
      // Clear spelling records if none for this tutee
      setAllRecords(prev => ({
        ...prev,
        spelling: { rayne: [], jeffrey: [] }
      }));
    }
    
    if (chemistryRecords) {
      setAllRecords(prev => ({
        ...prev,
        chemistry: JSON.parse(chemistryRecords)
      }));
    }
  }, [tutee.id]);

  // Load dashboard components
  useEffect(() => {
    const loadComponents = async () => {
      try {
        setLoadingComponents(true);
        const data = await fetchTuteeComponents(tutee.id);
        setComponents(data);
      } catch (error) {
        console.error('Failed to load components:', error);
      } finally {
        setLoadingComponents(false);
      }
    };
    loadComponents();
  }, [tutee.id]);

  const getBestScore = (quizType: 'spelling' | 'chemistry') => {
    if (quizType === 'spelling') {
      // For primary school, combine both Rayne and Jeffrey's scores
      const rayneScores = allRecords.spelling.rayne?.map((r) => r.percentage) || [];
      const jeffreyScores = allRecords.spelling.jeffrey?.map((r) => r.percentage) || [];
      const allScores = [...rayneScores, ...jeffreyScores];
      return allScores.length > 0 ? Math.max(...allScores) : null;
    } else {
      const scores = allRecords.chemistry.map((r) => r.percentage);
      return scores.length > 0 ? Math.max(...scores) : null;
    }
  };

  const getTotalAttempts = (quizType: 'spelling' | 'chemistry') => {
    if (quizType === 'spelling') {
      // For primary school, combine both Rayne and Jeffrey's attempts
      const rayneAttempts = allRecords.spelling.rayne?.length || 0;
      const jeffreyAttempts = allRecords.spelling.jeffrey?.length || 0;
      return rayneAttempts + jeffreyAttempts;
    } else {
      return allRecords.chemistry.length;
    }
  };

  const getRecentAttempts = (quizType: 'spelling' | 'chemistry', limit: number = 5): QuizRecord[] => {
    if (quizType === 'spelling') {
      // For primary school, combine both Rayne and Jeffrey's attempts
      const allAttempts: QuizRecord[] = [
        ...allRecords.spelling.rayne?.map((r) => ({ ...r, student: 'Rayne' })) || [],
        ...allRecords.spelling.jeffrey?.map((r) => ({ ...r, student: 'Jeffrey' })) || []
      ];
      return allAttempts
        .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime())
        .slice(0, limit);
    } else {
      return allRecords.chemistry
        .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime())
        .slice(0, limit);
    }
  };

  const refreshRecords = () => {
    const spellingRecords = localStorage.getItem(`spellingRecords_${tutee.id}`);
    const chemistryRecords = localStorage.getItem(`ibChemistryRecords_${tutee.id}`);
    
    if (spellingRecords) {
      setAllRecords(prev => ({
        ...prev,
        spelling: JSON.parse(spellingRecords)
      }));
    }
    
    if (chemistryRecords) {
      setAllRecords(prev => ({
        ...prev,
        chemistry: JSON.parse(chemistryRecords)
      }));
    }
  };

  const navigateToQuiz = (quiz: 'spelling' | 'chemistry') => {
    setSearchParams({ quiz });
  };

  const navigateToMenu = () => {
    refreshRecords();
    setSearchParams({});
  };

  // Force light theme and handle dynamic theme color for PWA
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    
    // Dynamic theme color for mobile status bar
    const colorMap: Record<string, string> = {
      pink: '#ec4899',
      blue: '#3b82f6',
      green: '#10b981',
      orange: '#f97316',
      indigo: '#6366f1',
      yellow: '#eab308',
      rose: '#f43f5e',
      emerald: '#10b981',
    };
    
    const themeColor = colorMap[tutee.colorScheme.primary] || '#6366f1';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', themeColor);

    return () => {
      // Restore default theme color on unmount
      const defaultMeta = document.querySelector('meta[name="theme-color"]');
      if (defaultMeta) defaultMeta.setAttribute('content', '#6366f1');
    };
  }, [tutee.colorScheme.primary]);

  // Show quiz if selected
  if (currentQuiz === 'spelling') {
    return <ScienceSpellingQuiz tutee={tutee} onBack={navigateToMenu} />;
  }

  if (currentQuiz === 'chemistry' && tutee.id === 'shermaine') {
    return <IBChemistryQuiz tutee={tutee} onBack={navigateToMenu} />;
  }

  // Show learning points page if selected
  if (showLearningPoints) {
    return <LearningPointsPage tutee={tutee} onBack={navigateToMenu} />;
  }

  // Determine available quizzes for this tutee
  const availableQuizzes = [];
  if (!loadingComponents) {
    components.forEach((tComp) => {
      const componentType = tComp.component?.componentType;
      if (componentType === 'spelling_quiz') {
        availableQuizzes.push({ type: 'spelling' as const, name: 'Science Spelling Quiz', icon: BookOpen });
      }
      if (componentType === 'chemistry_quiz') {
        availableQuizzes.push({ type: 'chemistry' as const, name: 'IB Chemistry Quiz', icon: GraduationCap });
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 sm:p-6 md:p-8 safe-area-inset">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Tuition Portal</span>
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-indigo-700 px-2">
                {tutee.id === 'primary-school' ? tutee.name : `${tutee.name}'s Dashboard`}
              </h1>
              <span 
                className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${tutee.colorScheme.gradient} text-white`}
              >
                {tutee.name}
              </span>
            </div>
            <p className="text-gray-600 text-base sm:text-lg px-2 mb-4">{tutee.description}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <ColorCustomization tutee={tutee} onUpdate={setTutee} />
              <IconCustomization tutee={tutee} onUpdate={setTutee} />
              <PinChange tutee={tutee} onUpdate={setTutee} />
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="mb-6 sm:mb-8">
          <TuitionCalendar isAdmin={false} tutee={tutee} onTuteeUpdate={setTutee} />
        </div>

        {/* Quiz Cards & Components */}
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {loadingComponents ? (
            <>
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 space-y-4">
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
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 space-y-4">
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
            </>
          ) : components.map((tComp) => {
            const componentType = tComp.component?.componentType;
            
            if (componentType === 'learning_points') {
              return <LearningPoints key={tComp.id} tutee={tutee} />;
            }
            
            if (componentType === 'worksheet_tracker') {
              const studentNames = tutee.id === 'primary-school' 
                ? ['Rayne', 'Jeffrey'] 
                : [tutee.name];
              return (
                <div key={tComp.id} className="md:col-span-2">
                  <WorksheetTracker 
                    tuteeId={tutee.id} 
                    studentNames={studentNames} 
                  />
                </div>
              );
            }

            if (componentType === 'shared_files') {
              return (
                <div key={tComp.id} className="md:col-span-2">
                  <SharedFiles 
                    tutee={tutee} 
                    isAdmin={false}
                  />
                </div>
              );
            }
            
            return null;
          })}
          
          {/* Quiz Cards */}
          {availableQuizzes.map((quiz, index) => {
            const Icon = quiz.icon;
            const bestScore = getBestScore(quiz.type);
            const totalAttempts = getTotalAttempts(quiz.type);
            const gradientClass = quiz.type === 'spelling' 
              ? 'from-pink-500 to-purple-600' 
              : 'from-green-500 to-teal-600';
            const bgClass = quiz.type === 'spelling'
              ? 'bg-purple-50'
              : 'bg-teal-50';
            const textClass = quiz.type === 'spelling'
              ? 'text-purple-600'
              : 'text-teal-600';

            return (
              <div 
                key={quiz.type} 
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-smooth card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 sm:p-3 bg-gradient-to-br ${gradientClass} rounded-lg sm:rounded-xl flex-shrink-0`}>
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{quiz.name}</h2>
                    <p className="text-sm sm:text-base text-gray-600">{tutee.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`${bgClass} rounded-lg p-3 sm:p-4`}>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Best Score</p>
                    <p className={`text-xl sm:text-2xl font-bold ${textClass}`}>
                      {bestScore ? `${bestScore}%` : 'N/A'}
                    </p>
                  </div>
                  <div className={`${bgClass} rounded-lg p-3 sm:p-4`}>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Attempts</p>
                    <p className={`text-xl sm:text-2xl font-bold ${textClass}`}>{totalAttempts}</p>
                  </div>
                </div>

                <button
                  onClick={() => navigateToQuiz(quiz.type)}
                  className={`w-full bg-gradient-to-r ${gradientClass} text-white py-3.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg hover:opacity-90 transition-smooth press-effect min-h-[44px] touch-manipulation`}
                >
                  Start {quiz.name}
                </button>
              </div>
            );
          })}
        </div>

        {/* My Feedback Section */}
        <div className="mb-6 sm:mb-8">
          <MyFeedback tutee={tutee} />
        </div>

        {/* Recent Activity */}
        {availableQuizzes.some(q => getTotalAttempts(q.type) > 0) && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Recent Activity</h3>
            </div>

            <div className="space-y-2">
              {availableQuizzes.map((quiz) => {
                if (getTotalAttempts(quiz.type) === 0) return null;
                
                const bgClass = quiz.type === 'spelling' ? 'bg-purple-50' : 'bg-teal-50';
                const textClass = quiz.type === 'spelling' ? 'text-purple-600' : 'text-teal-600';
                const Icon = quiz.type === 'spelling' ? Clock : Trophy;

                return (
                  <div key={quiz.type}>
                    <h4 className={`font-semibold ${textClass} mb-3 flex items-center gap-2`}>
                      <Icon className="w-5 h-5" />
                      {quiz.name} History
                    </h4>
                    <div className="space-y-2 mb-4">
                      {getRecentAttempts(quiz.type, 5).map((record, index) => (
                        <div key={index} className={`${bgClass} rounded-lg p-3 sm:p-4 flex justify-between items-center gap-3`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-medium text-gray-700">
                              {quiz.type === 'spelling' && record.student 
                                ? `${quiz.name} - ${record.student}`
                                : quiz.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(record.timestamp || record.date).toLocaleString()}
                              {record.timeSpent && ` • ${Math.floor(record.timeSpent / 60)}m ${record.timeSpent % 60}s`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-base sm:text-lg font-bold ${textClass}`}>
                              {record.percentage}%
                            </p>
                            <p className="text-xs text-gray-500">{record.score}/{record.total}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TuteeDashboard;

