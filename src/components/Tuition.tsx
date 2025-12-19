import { useState, useEffect } from 'react';
import { GraduationCap, Lock, BookOpen, Shield, LogOut } from 'lucide-react';
import { getTutees, verifyPin } from '../config/tutees';
import { verifyAdminPin, ADMIN_CONFIG } from '../config/admin';
import { Tutee } from '../types/tuition';
import PinProtection from './tuition/PinProtection';
import AdminPinProtection from './tuition/AdminPinProtection';
import TuteeDashboard from './tuition/TuteeDashboard';
import BookingRequestsAdmin from './tuition/BookingRequestsAdmin';
import TuteeEditor from './tuition/admin/TuteeEditor';
import TuteeCreator from './tuition/admin/TuteeCreator';
import TuteeDeleteModal from './tuition/admin/TuteeDeleteModal';
import ComponentManager from './tuition/admin/ComponentManager';
import FeedbackAdmin from './tuition/admin/FeedbackAdmin';
import EarningsAdmin from './tuition/admin/EarningsAdmin';
import EarningsSettingsEditor from './tuition/admin/EarningsSettingsEditor';
import SpellingQuizConfig from './tuition/admin/SpellingQuizConfig';
import GPTChatAdmin from './tuition/admin/GPTChatAdmin';
import GlobalFileManager from './tuition/admin/GlobalFileManager';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Icon mapping for tutees - dynamically import icons as needed
import * as LucideIcons from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  // Add more icons dynamically
  User: LucideIcons.User,
  Star: LucideIcons.Star,
  Heart: LucideIcons.Heart,
  Zap: LucideIcons.Zap,
  Target: LucideIcons.Target,
  Award: LucideIcons.Award,
  Trophy: LucideIcons.Trophy,
  Lightbulb: LucideIcons.Lightbulb,
  Brain: LucideIcons.Brain,
  Rocket: LucideIcons.Rocket,
  Sparkles: LucideIcons.Sparkles,
  BookMarked: LucideIcons.BookMarked,
  School: LucideIcons.School,
  PenTool: LucideIcons.PenTool,
  Calculator: LucideIcons.Calculator,
  FlaskConical: LucideIcons.FlaskConical,
  Atom: LucideIcons.Atom,
  Music: LucideIcons.Music,
  Palette: LucideIcons.Palette,
  Camera: LucideIcons.Camera,
  Gamepad2: LucideIcons.Gamepad2,
  Code: LucideIcons.Code,
  Globe: LucideIcons.Globe,
  Coffee: LucideIcons.Coffee,
  Smile: LucideIcons.Smile,
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
    // Try dynamic lookup from LucideIcons
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || GraduationCap;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 sm:p-6 md:p-8 safe-area-inset">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <GraduationCap className="w-16 h-16 sm:w-20 sm:h-20 text-indigo-600 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-indigo-700 mb-3 px-2">
            Tuition Portal
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl px-2">
            Select your tutee page to access quizzes and learning materials
          </p>
        </div>

        {/* Tutee Selection Grid */}
        {loadingTutees ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tutees...</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {tutees.map((tutee) => {
            const IconComponent = getIcon(tutee.icon);
            const gradientClass = `bg-gradient-to-br ${tutee.colorScheme.gradient}`;
            
            // Update tutee in list when edited
            const handleTuteeUpdate = (updatedTutee: Tutee) => {
              setTutees(prev => prev.map(t => t.id === updatedTutee.id ? updatedTutee : t));
            };

            const handleTuteeDelete = (deletedId: string) => {
              setTutees(prev => prev.filter(t => t.id !== deletedId));
            };
            
            return (
              <div
                key={tutee.id}
                className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8 hover:shadow-2xl transition-smooth card-hover animate-fade-in-up"
                style={{ animationDelay: `${tutees.indexOf(tutee) * 100}ms` }}
              >
                {isAdmin && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1 items-center">
                    <TuteeDeleteModal tutee={tutee} onDeleted={handleTuteeDelete} />
                    <TuteeEditor tutee={tutee} onUpdate={handleTuteeUpdate} />
                    <EarningsSettingsEditor 
                      tutee={tutee} 
                      onSelectTutee={(tuteeId) => {
                        setSelectedEarningsTuteeId(tuteeId);
                      }}
                    />
                  </div>
                )}
                <button
                  onClick={() => handleTuteeClick(tutee)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 sm:p-4 ${gradientClass} rounded-xl sm:rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform-smooth`}>
                      <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
                        {tutee.name}
                      </h2>
                      {tutee.description && (
                        <p className="text-sm sm:text-base text-gray-600 truncate">
                          {tutee.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                    <Lock className="w-4 h-4" />
                    <span>PIN Protected</span>
                  </div>
                </button>
              </div>
            );
          })}
          {isAdmin && (
            <TuteeCreator 
              onCreated={(newTutee) => {
                setTutees(prev => [...prev, newTutee]);
              }}
            />
          )}
          </div>
        )}

        {/* Admin Banner */}
        {isAdmin && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-lg">Admin Mode Active</h3>
                <p className="text-sm text-purple-100">You can now manage calendar dates</p>
              </div>
            </div>
            <button
              onClick={handleExitAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors-smooth press-effect"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Admin</span>
            </button>
          </div>
        )}

        {/* Calendar Section */}
        <div className="mb-8">
        </div>

        {/* Booking Requests Admin (only in admin mode) */}
        {isAdmin && (
          <div className="mb-8">
            <BookingRequestsAdmin />
          </div>
        )}

        {/* Feedback Admin (only in admin mode) */}
        {isAdmin && (
          <div id="feedback-admin-section" className="mb-8">
            <FeedbackAdmin />
          </div>
        )}

        {/* Earnings Admin (only in admin mode) */}
        {isAdmin && (
          <div id="earnings-admin-section" className="mb-8">
            <EarningsAdmin 
              tutees={tutees} 
              initialTuteeId={selectedEarningsTuteeId}
              onTuteeSelectChange={setSelectedEarningsTuteeId}
            />
          </div>
        )}

        {/* Module Manager (only in admin mode) */}
        {isAdmin && (
          <div id="module-manager-section" className="mb-8">
            <ComponentManager tutees={tutees} />
          </div>
        )}

        {/* Global File Manager (only in admin mode) */}
        {isAdmin && (
          <div id="global-file-admin-section" className="mb-8">
            <GlobalFileManager tutees={tutees} />
          </div>
        )}

        {/* Spelling Quiz Config (only in admin mode) */}
        {isAdmin && (
          <div id="spelling-quiz-admin-section" className="mb-8">
            <SpellingQuizConfig tutees={tutees} />
          </div>
        )}

        {/* GPT Chat History (only in admin mode) */}
        {isAdmin && (
          <div id="gpt-chat-admin-section" className="mb-8">
            <GPTChatAdmin />
          </div>
        )}

        {/* Admin Access Button (only when not in admin mode) */}
        {!isAdmin && (
          <div className="text-center mb-8">
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors-smooth press-effect text-sm font-medium mx-auto"
            >
              <Shield className="w-4 h-4" />
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

