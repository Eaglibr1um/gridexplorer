import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, GraduationCap, BarChart3, Clock, Trophy, Play, Bell, BellOff, Info, Share, Loader2 } from 'lucide-react';
import { Tutee, QuizRecord } from '../../types/tuition';
import ScienceSpellingQuiz from '../ScienceSpellingQuiz';
import IBChemistryQuiz from '../IBChemistryQuiz';
import TuitionCalendar from './TuitionCalendar';
import ProfileCustomization from './ProfileCustomization';
import PinChange from './PinChange';
import LearningPoints from './components/LearningPoints';
import WorksheetTracker from './components/WorksheetTracker';
import SharedFiles from './components/SharedFiles';
import LearningPointsPage from './LearningPointsPage';
import FeedbackButton from './FeedbackButton';
import MyFeedback from './MyFeedback';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchTuteeComponents, TuteeComponent } from '../../services/componentService';
import { notificationService } from '../../services/notificationService';
import { supabase } from '../../config/supabase';
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
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  
  // Update document title
  useDocumentTitle(`Tuition - ${tutee.name}`);

  useEffect(() => {
    const checkSubscription = async () => {
      if (notificationService.isSupported()) {
        const subscribed = await notificationService.isSubscribed(tutee.id);
        setIsSubscribed(subscribed);
        
        // Show iOS tip if on iOS and not in standalone mode
        if (notificationService.isIOS() && !notificationService.isStandalone()) {
          setShowIOSTip(true);
        }
      }
      setIsCheckingSubscription(false);
    };
    checkSubscription();
  }, [tutee.id]);

  const handleNotificationToggle = async () => {
    try {
      if (notificationService.isIOS() && !notificationService.isStandalone()) {
        setShowIOSTip(true);
        return;
      }
      
      if (isSubscribed) {
        await notificationService.unsubscribeUser(tutee.id);
        setIsSubscribed(false);
      } else {
        await notificationService.subscribeUser(tutee.id);
        setIsSubscribed(true);

        // Immediate "Welcome" notification for the Student
        setTimeout(() => {
          notificationService.notify({
            type: 'student_welcome',
            tuteeId: tutee.id,
            title: 'Notifications Enabled! ✨',
            message: `Hey ${tutee.name}, you'll now get reminders when it's time to review your learning points!`,
            url: '/tuition'
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      alert('Failed to update notification settings. Please check your browser permissions.');
    }
  };

  const handleTestNotification = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isSubscribed || isTestingNotification) return;

    setIsTestingNotification(true);
    const btn = e.currentTarget as HTMLButtonElement;

    try {
      const { error } = await supabase.functions.invoke('send-notifications', {
        body: { test: true },
      });
      if (error) throw error;
      
      // Success feedback: quick flash
      const originalColor = btn.className;
      btn.className = `${originalColor} ring-4 ring-green-400 scale-95 transition-all`;
      setTimeout(() => {
        btn.className = originalColor;
      }, 500);
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setIsTestingNotification(false);
    }
  };
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 pb-20 sm:pb-8 safe-area-inset">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header - Mobile Friendly */}
        <div className="pt-6 mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 transition-all bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Back</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white/40 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/20">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                  {tutee.id === 'primary-school' ? tutee.name : tutee.name}
                </h1>
                <span 
                  className={`px-4 py-1.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r ${tutee.colorScheme.gradient} text-white shadow-lg uppercase tracking-wider`}
                >
                  Dashboard
                </span>
              </div>
              <p className="text-gray-600 text-base sm:text-lg max-w-xl">{tutee.description}</p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              {notificationService.isSupported() && (
                <button
                  onClick={handleNotificationToggle}
                  onContextMenu={handleTestNotification}
                  onTouchStart={(e) => {
                    const timer = setTimeout(() => handleTestNotification(e as any), 800);
                    (e.currentTarget as any)._longPressTimer = timer;
                  }}
                  onTouchEnd={(e) => {
                    clearTimeout((e.currentTarget as any)._longPressTimer);
                  }}
                  disabled={isCheckingSubscription || isTestingNotification}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all font-bold relative overflow-hidden ${
                    isSubscribed 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-white/50 text-indigo-600 hover:bg-white/80'
                  } ${isTestingNotification ? 'pr-10' : ''}`}
                  title={isSubscribed ? 'Right-click to test / Click to disable' : 'Enable Notifications'}
                >
                  {/* Background Pulse during testing */}
                  {isTestingNotification && (
                    <div className="absolute inset-0 bg-green-200/50 animate-pulse" />
                  )}
                  
                  <div className="relative flex items-center gap-2">
                    {isTestingNotification ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="hidden sm:inline">Sending Test...</span>
                      </>
                    ) : isSubscribed ? (
                      <>
                        <Bell className="w-5 h-5 fill-current" />
                        <span className="hidden sm:inline">Notifications On</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-5 h-5" />
                        <span className="hidden sm:inline">Enable Notifications</span>
                      </>
                    )}
                  </div>
                </button>
              )}
              <ProfileCustomization tutee={tutee} onUpdate={setTutee} />
              <PinChange tutee={tutee} onUpdate={setTutee} />
            </div>
          </div>
        </div>

        {/* iOS Notification Tip */}
        {showIOSTip && (
          <div className="mb-6 animate-fade-in">
            <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-lg flex items-start gap-4 border-2 border-indigo-400">
              <div className="p-2 bg-white/20 rounded-xl mt-1">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-lg mb-1 uppercase tracking-tight">Enable Notifications on iOS 📱</h4>
                <p className="text-indigo-50 text-sm font-medium leading-relaxed mb-3">
                  To receive review reminders on iPhone, you must add this app to your Home Screen:
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-black/10 p-3 rounded-2xl">
                    <span className="bg-white text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                    <p className="text-xs font-bold">Tap the <Share className="w-4 h-4 inline mx-1" /> "Share" button in Safari</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/10 p-3 rounded-2xl">
                    <span className="bg-white text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                    <p className="text-xs font-bold">Scroll down and tap "Add to Home Screen"</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/10 p-3 rounded-2xl">
                    <span className="bg-white text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                    <p className="text-xs font-bold">Open the app from your Home Screen to enable notifications!</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowIOSTip(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <TuitionCalendar isAdmin={false} tutee={tutee} onTuteeUpdate={setTutee} />
        </div>

        {/* Dashboard Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group border border-white/40 overflow-hidden flex flex-col animate-fade-in-up touch-manipulation"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="p-6 sm:p-8 flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`p-4 bg-gradient-to-br ${gradientClass} rounded-2xl shadow-lg transform group-hover:rotate-6 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-2xl font-black text-gray-800 leading-tight">{quiz.name}</h2>
                      <p className="text-gray-500 font-medium">Practice & Master</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                    <div className={`${bgClass} rounded-2xl p-4 border border-white/50 shadow-inner`}>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Best Score</p>
                      <p className={`text-2xl font-black ${textClass}`}>
                        {bestScore ? `${bestScore}%` : '---'}
                      </p>
                    </div>
                    <div className={`${bgClass} rounded-2xl p-4 border border-white/50 shadow-inner`}>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Attempts</p>
                      <p className={`text-2xl font-black ${textClass}`}>{totalAttempts}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => navigateToQuiz(quiz.type)}
                    className={`w-full bg-gradient-to-r ${gradientClass} text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-95 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2`}
                  >
                    <span>Start Practice</span>
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* My Feedback Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <MyFeedback tutee={tutee} />
        </div>

        {/* Recent Activity */}
        {availableQuizzes.some(q => getTotalAttempts(q.type) > 0) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 sm:p-8 border border-white/40 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-800">Recent Activity</h3>
              </div>
            </div>

            <div className="space-y-8">
              {availableQuizzes.map((quiz) => {
                if (getTotalAttempts(quiz.type) === 0) return null;
                
                const bgClass = quiz.type === 'spelling' ? 'bg-purple-50' : 'bg-teal-50';
                const textClass = quiz.type === 'spelling' ? 'text-purple-600' : 'text-teal-600';
                const Icon = quiz.type === 'spelling' ? Clock : Trophy;

                return (
                  <div key={quiz.type} className="animate-fade-in">
                    <h4 className={`font-black uppercase tracking-widest text-sm ${textClass} mb-4 flex items-center gap-2 px-1`}>
                      <Icon className="w-4 h-4" />
                      {quiz.name} History
                    </h4>
                    <div className="space-y-3">
                      {getRecentAttempts(quiz.type, 5).map((record, index) => (
                        <div key={index} className={`${bgClass} rounded-2xl p-4 sm:p-5 flex justify-between items-center gap-4 border border-white shadow-sm hover:shadow-md transition-shadow`}>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-bold text-gray-800 truncate">
                              {quiz.type === 'spelling' && record.student 
                                ? record.student
                                : quiz.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-0.5">
                              <span className="bg-white/60 px-2 py-0.5 rounded-lg border border-gray-100">
                                {format(new Date(record.timestamp || record.date), 'MMM d, h:mm a')}
                              </span>
                              {record.timeSpent && (
                                <span className="bg-white/60 px-2 py-0.5 rounded-lg border border-gray-100 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.floor(record.timeSpent / 60)}m {record.timeSpent % 60}s
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm min-w-[80px]">
                            <p className={`text-xl font-black ${textClass}`}>
                              {record.percentage}%
                            </p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                              {record.score}/{record.total} Correct
                            </p>
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

