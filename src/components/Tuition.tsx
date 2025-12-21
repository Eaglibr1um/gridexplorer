import { useState, useEffect } from 'react';
import { 
  GraduationCap, Lock, BookOpen, Shield, LogOut, ChevronRight,
  User, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, 
  Brain, Rocket, Sparkles, BookMarked, School, PenTool, 
  Calculator, FlaskConical, Atom, Music, Palette, Camera, 
  Gamepad2, Code, Globe, Coffee, Smile
} from 'lucide-react';
import { getTutees, verifyPin } from '../config/tutees';
import { verifyAdminPin, ADMIN_CONFIG } from '../config/admin';
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
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
  const [selectedTutee, setSelectedTutee] = useState<Tutee | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTutee, setPendingTutee] = useState<Tutee | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [tutees, setTutees] = useState<Tutee[]>([]);
  const [loadingTutees, setLoadingTutees] = useState(true);
  const [selectedEarningsTuteeId, setSelectedEarningsTuteeId] = useState<string | null>(null);

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
    const handleAdminPinEntered = (e: CustomEvent<{ pin: string }>) => {
      const isValid = verifyAdminPin(e.detail.pin);
      
      // Dispatch result back to AdminPinProtection component
      const resultEvent = new CustomEvent('adminPinResult', { 
        detail: { verified: isValid } 
      });
      window.dispatchEvent(resultEvent);

      if (isValid) {
        setIsAdmin(true);
        setShowAdminPinModal(false);
      }
    };

    window.addEventListener('adminPinEntered' as any, handleAdminPinEntered as EventListener);
    return () => {
      window.removeEventListener('adminPinEntered' as any, handleAdminPinEntered as EventListener);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 safe-area-inset pb-20 sm:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="text-center pt-8 mb-8 sm:mb-12">
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
                className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-5 sm:p-8 hover:shadow-2xl transition-smooth card-hover animate-fade-in-up touch-manipulation"
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
                    <div className={`p-4 ${gradientClass} rounded-2xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform-smooth group-active:scale-95`}>
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
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-xl sm:text-2xl">Admin Mode Active</h3>
                </div>
              </div>
              <button
                onClick={handleExitAdmin}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-purple-50 transition-all shadow-lg press-effect w-full sm:w-auto justify-center"
              >
                <LogOut className="w-5 h-5" />
                <span>Exit Admin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <BookingRequestsAdmin />
              <FeedbackAdmin />
              <EarningsAdmin 
                tutees={tutees} 
                initialTuteeId={selectedEarningsTuteeId}
                onTuteeSelectChange={setSelectedEarningsTuteeId}
              />
              <ComponentManager tutees={tutees} />
              <GlobalFileManager tutees={tutees} />
              <SpellingQuizConfig tutees={tutees} />
              <GPTChatAdmin />
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

