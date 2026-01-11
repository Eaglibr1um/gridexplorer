import { useState, useEffect } from 'react';
import { 
  GraduationCap, Lock, BookOpen, Shield, LogOut, ChevronRight,
  User, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, 
  Brain, Rocket, Sparkles, BookMarked, School, PenTool, 
  Calculator, FlaskConical, Atom, Music, Palette, Camera, 
  Gamepad2, Code, Globe, Coffee, Smile
} from 'lucide-react';
import { getTutees, verifyPin } from '../config/tutees';
import { ADMIN_CONFIG } from '../config/admin';
import { Tutee } from '../types/tuition';
import PinProtection from './tuition/PinProtection';
import AdminPinProtection from './tuition/AdminPinProtection';
import TuteeDashboard from './tuition/TuteeDashboard';
import BookingRequestsAdmin from './tuition/BookingRequestsAdmin';
import Skeleton from './ui/Skeleton';
import TuteeEditor from './tuition/admin/TuteeEditor';
import TuteeCreator from './tuition/admin/TuteeCreator';
import TuteeDeleteModal from './tuition/admin/TuteeDeleteModal';
import ComponentManager from './tuition/admin/ComponentManager';
import FeedbackAdmin from './tuition/admin/FeedbackAdmin';
import EarningsAdmin from './tuition/admin/EarningsAdmin';
import SpellingQuizConfig from './tuition/admin/SpellingQuizConfig';
import GPTChatAdmin from './tuition/admin/GPTChatAdmin';
import GlobalFileManager from './tuition/admin/GlobalFileManager';
import NotificationAdmin from './tuition/admin/NotificationAdmin';
import MessagingAdmin from './tuition/admin/MessagingAdmin';
import AdminQuickLinks from './tuition/admin/AdminQuickLinks';
import LearningPointsAdmin from './tuition/admin/LearningPointsAdmin';
import ProgressReportAdmin from './tuition/admin/ProgressReportAdmin';
import LandingPageSettings from './tuition/admin/LandingPageSettings';
import StudentManagement from './tuition/admin/StudentManagement';
import AdminTuitionCalendar from './tuition/admin/AdminTuitionCalendar';
import { notificationService } from '../services/notificationService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import { getLandingPagePreference } from '../utils/landingPagePreference';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

const Tuition = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedTutee, setSelectedTutee] = useState<Tutee | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTutee, setPendingTutee] = useState<Tutee | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [tutees, setTutees] = useState<Tutee[]>([]);
  const [loadingTutees, setLoadingTutees] = useState(true);
  const [selectedEarningsTuteeId, setSelectedEarningsTuteeId] = useState<string | null>(null);
  const [isAdminSubscribed, setIsAdminSubscribed] = useState(false);
  const [isCheckingAdminSub, setIsCheckingAdminSub] = useState(true);
  const [isTogglingAdminSub, setIsTogglingAdminSub] = useState(false);
  const [isAdminTestingNotification, setIsAdminTestingNotification] = useState(false);

  // Auto-redirect based on landing page preference (bypass with ?stay=true)
  useEffect(() => {
    const shouldStay = searchParams.get('stay') === 'true';
    if (shouldStay) return; // Don't redirect if ?stay=true
    
    const preference = getLandingPagePreference();
    // Only redirect if preference is explicitly set AND it's not /tuition
    if (preference !== null && preference !== '/tuition') {
      navigate(preference, { replace: true });
    }
  }, [navigate, searchParams]);

  // Check admin subscription status
  useEffect(() => {
    const checkAdminSub = async () => {
      if (isAdmin && notificationService.isSupported()) {
        const subscribed = await notificationService.isSubscribed('admin');
        setIsAdminSubscribed(subscribed);
      }
      setIsCheckingAdminSub(false);
    };
    checkAdminSub();
  }, [isAdmin]);

  const handleAdminNotificationToggle = async () => {
    try {
      setIsTogglingAdminSub(true);
      if (isAdminSubscribed) {
        await notificationService.unsubscribeUser('admin');
        setIsAdminSubscribed(false);
      } else {
        await notificationService.subscribeUser('admin');
        setIsAdminSubscribed(true);
        
        // Immediate "Welcome" notification for the Admin
        setTimeout(() => {
          notificationService.notify({
            type: 'admin_welcome',
            tuteeId: 'admin',
            title: 'Admin Notifications Enabled! 🛡️',
            message: 'You will now receive alerts for new requests, feedback, and uploads.',
            url: '/tuition'
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to toggle admin notifications:', error);
      alert('Failed to update notification settings.');
    } finally {
      setIsTogglingAdminSub(false);
    }
  };

  const handleAdminTestNotification = async (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isAdminSubscribed || isAdminTestingNotification) return;

    setIsAdminTestingNotification(true);
    const btn = e.currentTarget as HTMLButtonElement;

    try {
      await notificationService.notify({
        type: 'admin_test',
        tuteeId: 'admin',
        title: 'Admin Test! 🚀',
        message: 'Your admin notification system is working perfectly.',
        url: '/tuition'
      });
      
      // Success feedback: quick flash
      const originalColor = btn.className;
      btn.className = `${originalColor} ring-4 ring-green-400 scale-95 transition-all`;
      setTimeout(() => {
        btn.className = originalColor;
      }, 500);
    } catch (error) {
      console.error('Failed to send admin test notification:', error);
    } finally {
      setIsAdminTestingNotification(false);
    }
  };

  // Load tutees from Supabase
  useEffect(() => {
    const loadTutees = async () => {
      try {
        setLoadingTutees(true);
        const loadedTutees = await getTutees();
        setTutees(loadedTutees);
      } catch (error) {
        console.error('Failed to load tutees:', error);
      } finally {
        setLoadingTutees(false);
      }
    };
    loadTutees();
  }, []);

  // Listen for PIN entered event (tutee PIN)
  useEffect(() => {
    const handlePinEntered = async (e: CustomEvent<{ pin: string }>) => {
      if (pendingTutee) {
        const isValid = await verifyPin(pendingTutee.id, e.detail.pin);
        
        // Dispatch result back to PinProtection component
        const resultEvent = new CustomEvent('pinResult', { 
          detail: { verified: isValid } 
        });
        window.dispatchEvent(resultEvent);

        if (isValid) {
          // Reload tutee to get latest colors
          const updatedTutee = tutees.find(t => t.id === pendingTutee.id) || pendingTutee;
          setSelectedTutee(updatedTutee);
          setShowPinModal(false);
          setPendingTutee(null);
        }
      }
    };

    window.addEventListener('pinEntered' as any, handlePinEntered as unknown as EventListener);
    return () => {
      window.removeEventListener('pinEntered' as any, handlePinEntered as unknown as EventListener);
    };
  }, [pendingTutee, tutees]);

  // Listen for admin PIN entered event
  useEffect(() => {
    const handleAdminPinEntered = async (e: CustomEvent<{ pin: string }>) => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-admin', {
          body: { pin: e.detail.pin }
        });

        const isValid = !error && data?.verified;
        
        // Dispatch result back to AdminPinProtection component
        const resultEvent = new CustomEvent('adminPinResult', { 
          detail: { verified: isValid } 
        });
        window.dispatchEvent(resultEvent);

        if (isValid) {
          setIsAdmin(true);
          setShowAdminPinModal(false);
        }
      } catch (err) {
        console.error('Failed to verify admin PIN:', err);
        const resultEvent = new CustomEvent('adminPinResult', { 
          detail: { verified: false } 
        });
        window.dispatchEvent(resultEvent);
      }
    };

    window.addEventListener('adminPinEntered' as any, handleAdminPinEntered as any);
    return () => {
      window.removeEventListener('adminPinEntered' as any, handleAdminPinEntered as any);
    };
  }, []);

  const handleTuteeClick = (tutee: Tutee) => {
    setPendingTutee(tutee);
    setShowPinModal(true);
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setPendingTutee(null);
  };

  const handlePinVerified = () => {
    // This is called after PIN is verified
    // The state is already updated in the event handler
  };

  const handleBackToPortal = async () => {
    setSelectedTutee(null);
    // Reload tutees to get updated icons/names/descriptions
    try {
      const loadedTutees = await getTutees();
      setTutees(loadedTutees);
    } catch (error) {
      console.error('Failed to reload tutees:', error);
    }
  };

  const handleAdminClick = () => {
    setShowAdminPinModal(true);
  };

  const handleAdminPinCancel = () => {
    setShowAdminPinModal(false);
  };

  const handleAdminPinVerified = () => {
    // State is already updated in the event handler
  };

  const handleExitAdmin = () => {
    setIsAdmin(false);
  };

  // Update document title
  useDocumentTitle(selectedTutee ? `Tuition - ${selectedTutee.name}` : 'Tuition Portal');

  // Force light theme for tuition pages
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      // Don't restore theme on unmount - let ThemeContext handle it
    };
  }, []);

  // Show tutee dashboard if one is selected
  if (selectedTutee) {
    return <TuteeDashboard tutee={selectedTutee} onBack={handleBackToPortal} />;
  }

  // Get icon component
  const getIcon = (iconName: string) => {
    // Try direct mapping first
    if (iconMap[iconName]) {
      return iconMap[iconName];
    }
    // Try dynamic lookup from iconMap
    const IconComponent = iconMap[iconName];
    return IconComponent || GraduationCap;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 pb-20 sm:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <GraduationCap className="w-12 h-12 sm:w-20 sm:h-20 text-indigo-600 mx-auto mb-4 sm:mb-6 animate-bounce-slow" />
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 px-2">
            Tuition Portal
          </h1>
          <p className="text-gray-600 text-base sm:text-xl px-2 max-w-2xl mx-auto">
            Select your tutee page to access quizzes and learning materials
          </p>
        </div>

        {/* Tutee Selection Grid */}
        {loadingTutees ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {tutees.map((tutee, index) => {
            const IconComponent = getIcon(tutee.icon);
            const gradientClass = `bg-gradient-to-br ${tutee.colorScheme.gradient}`;
            
            return (
              <div
                key={tutee.id}
                className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-5 sm:p-8 transition-smooth card-hover animate-fade-in-up touch-manipulation"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {isAdmin && (
                  <div className="absolute top-3 right-3 z-10 flex gap-1 items-center bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-sm">
                    <TuteeDeleteModal tutee={tutee} onDeleted={(id) => setTutees(prev => prev.filter(t => t.id !== id))} />
                    <TuteeEditor tutee={tutee} onUpdate={(updated) => setTutees(prev => prev.map(t => t.id === updated.id ? updated : t))} />
                  </div>
                )}
                <button
                  onClick={() => handleTuteeClick(tutee)}
                  className="w-full text-left group flex flex-col h-full"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 ${gradientClass} rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform-smooth group-active:scale-95`}>
                      <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                        {tutee.name}
                      </h2>
                      {tutee.description && (
                        <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                          {tutee.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Lock className="w-4 h-4" />
                      <span className="font-medium">PIN Protected</span>
                    </div>
                    <div className="p-2 rounded-full bg-gray-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
          {isAdmin && (
            <TuteeCreator 
              onCreated={(newTutee) => setTutees(prev => [...prev, newTutee])}
            />
          )}
          </div>
        )}

        {/* Admin Section (only in admin mode) */}
        {isAdmin && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-white/10">
              <div className="flex items-center gap-2.5 sm:gap-4 text-center sm:text-left w-full sm:w-auto justify-center sm:justify-start">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl sm:rounded-2xl backdrop-blur-md flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-xl lg:text-2xl">Admin Mode Active</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {notificationService.isSupported() && (
                  <button
                    onClick={handleAdminNotificationToggle}
                    onContextMenu={handleAdminTestNotification}
                    onTouchStart={(e) => {
                      const timer = setTimeout(() => handleAdminTestNotification(e as any), 800);
                      (e.currentTarget as any)._longPressTimer = timer;
                    }}
                    onTouchEnd={(e) => {
                      clearTimeout((e.currentTarget as any)._longPressTimer);
                    }}
                    disabled={isCheckingAdminSub || isTogglingAdminSub || isAdminTestingNotification}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-lg flex-1 sm:flex-none justify-center relative overflow-hidden min-h-[44px] touch-manipulation ${
                      isAdminSubscribed 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                    }`}
                    title={isAdminSubscribed ? 'Right-click to test / Click to disable' : 'Enable Admin Notifs'}
                  >
                    {/* Background Pulse during testing */}
                    {isAdminTestingNotification && (
                      <div className="absolute inset-0 bg-green-200/50 animate-pulse" />
                    )}

                    <div className="relative flex items-center gap-1.5 sm:gap-2">
                      {isTogglingAdminSub || isAdminTestingNotification ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : isAdminSubscribed ? (
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                      ) : (
                        <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span className="whitespace-nowrap">
                        {isAdminTestingNotification 
                          ? 'Testing...' 
                          : isAdminSubscribed 
                            ? 'Notifs On' 
                            : 'Notifs Off'}
                      </span>
                    </div>
                  </button>
                )}
                <button
                  onClick={handleExitAdmin}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-indigo-600 font-bold text-xs sm:text-sm rounded-xl hover:bg-purple-50 transition-all shadow-lg press-effect flex-1 sm:flex-none justify-center min-h-[44px] touch-manipulation whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Exit</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <AdminTuitionCalendar />
              <BookingRequestsAdmin />
              <FeedbackAdmin />
              <EarningsAdmin 
                tutees={tutees} 
                initialTuteeId={selectedEarningsTuteeId}
                onTuteeSelectChange={setSelectedEarningsTuteeId}
              />
              <ComponentManager tutees={tutees} />
              <GlobalFileManager tutees={tutees} />
              <MessagingAdmin tutees={tutees} />
              <NotificationAdmin />
              <SpellingQuizConfig tutees={tutees} />
              <StudentManagement tutees={tutees} />
              <GPTChatAdmin />
              <LearningPointsAdmin tutees={tutees} />
              <ProgressReportAdmin tutees={tutees} />
              <LandingPageSettings />
              <AdminQuickLinks />
            </div>
          </div>
        )}

        {/* Admin Access Button (only when not in admin mode) */}
        {!isAdmin && (
          <div className="text-center py-8">
            <button
              onClick={handleAdminClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600/10 text-purple-700 rounded-xl hover:bg-purple-600 hover:text-white transition-all duration-300 font-bold group press-effect"
            >
              <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span>Admin Access</span>
            </button>
          </div>
        )}
      </div>


      {/* PIN Protection Modal */}
      {showPinModal && pendingTutee && (
        <PinProtection
          tuteeName={pendingTutee.name}
          onPinVerified={handlePinVerified}
          onCancel={handlePinCancel}
        />
      )}

      {/* Admin PIN Protection Modal */}
      {showAdminPinModal && (
        <AdminPinProtection
          onPinVerified={handleAdminPinVerified}
          onCancel={handleAdminPinCancel}
          pinLength={ADMIN_CONFIG.pinLength}
        />
      )}
    </div>
  );
};

export default Tuition;

