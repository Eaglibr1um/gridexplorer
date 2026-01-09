import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  DollarSign, Calendar, TrendingUp, History, Copy, Check, Plus, Trash2, Edit2, Settings, FileText, Eye, Save, X, GraduationCap, ChevronRight, Search, User,
  BookOpen, Star, Heart, Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket, Sparkles, BookMarked, School, PenTool, Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile
} from 'lucide-react';

// Icon mapping for tutees
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
import { Tutee } from '../../../types/tuition';
import {
  fetchEarningsRecords,
  fetchTuitionSessions,
  fetchEarningsSettings,
  upsertEarningsSettings,
  upsertEarningsRecord,
  createTuitionSession,
  updateTuitionSession,
  deleteTuitionSession,
  calculateSessionAmount,
  generateEarningsMessage,
  recalculateSessionAmounts,
  fetchAllEarningsRecordsByMonth,
  EarningsRecord,
  TuitionSession,
  EarningsSettings,
} from '../../../services/earningsService';
import { format, parseISO, startOfMonth, endOfMonth, getYear, getMonth } from 'date-fns';
import ConfirmationModal from '../../ui/ConfirmationModal';

interface EarningsAdminProps {
  tutees: Tutee[];
  initialTuteeId?: string | null;
  onTuteeSelectChange?: (tuteeId: string | null) => void;
}

const EarningsAdmin = ({ tutees, initialTuteeId = null, onTuteeSelectChange }: EarningsAdminProps) => {
  const [selectedTuteeId, setSelectedTuteeId] = useState<string | null>(initialTuteeId);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentMonthRecord, setCurrentMonthRecord] = useState<EarningsRecord | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsRecord[]>([]);
  const [sessions, setSessions] = useState<TuitionSession[]>([]);
  const [settings, setSettings] = useState<EarningsSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [editingSession, setEditingSession] = useState<TuitionSession | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    messageTemplate: '',
    feePerHour: 140,
    feePerSession: 200,
    calculationType: 'hourly' as 'hourly' | 'per_session',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [previewSessions, setPreviewSessions] = useState<TuitionSession[]>([]);
  const [allGroupsMonthlyTotal, setAllGroupsMonthlyTotal] = useState<{
    totalAmount: number;
    totalSessions: number;
    totalHours: number;
    records: EarningsRecord[];
  } | null>(null);

  const [sessionForm, setSessionForm] = useState({
    sessionDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '15:00',
    endTime: '17:00',
  });

  const selectedTutee = useMemo(
    () => tutees.find((t) => t.id === selectedTuteeId) || null,
    [tutees, selectedTuteeId]
  );

  const filteredTutees = useMemo(() => {
    if (!searchTerm.trim()) return tutees;
    return tutees.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tutees, searchTerm]);

  const currentDate = new Date();
  const currentYear = getYear(currentDate);
  const currentMonth = getMonth(currentDate) + 1;

  // Icon helper
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || GraduationCap;
  };

  // Update selected tutee when initialTuteeId changes
  useEffect(() => {
    if (initialTuteeId !== null && initialTuteeId !== selectedTuteeId) {
      setSelectedTuteeId(initialTuteeId);
    }
  }, [initialTuteeId]);

  useEffect(() => {
    if (selectedTuteeId) {
      loadEarningsData();
      if (showSettings) {
        loadSettingsForEdit();
      }
    } else {
      loadAllGroupsEarnings();
    }
  }, [selectedTuteeId, currentYear, currentMonth, showSettings]);

  const loadAllGroupsEarnings = async () => {
    try {
      setLoading(true);
      
      // First, fetch existing records
      let records = await fetchAllEarningsRecordsByMonth(currentYear, currentMonth);
      const tuteeIdsWithRecords = new Set(records.map(r => r.tuteeId));
      
      // Generate records for tutees that have sessions but no record yet
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;
      
      const missingRecords = await Promise.all(
        tutees
          .filter(tutee => !tuteeIdsWithRecords.has(tutee.id))
          .map(async (tutee) => {
            try {
              // Fetch sessions for this tutee for current month
              const sessions = await fetchTuitionSessions(tutee.id, startDate, endDate);
              
              // If there are sessions, create the record
              if (sessions.length > 0) {
                const record = await upsertEarningsRecord(
                  tutee.id,
                  currentYear,
                  currentMonth,
                  sessions
                );
                return record;
              }
              return null;
            } catch (err) {
              console.error(`Failed to generate record for ${tutee.name}:`, err);
              return null;
            }
          })
      );
      
      // Add newly created records to the list
      const newRecords = missingRecords.filter((r): r is EarningsRecord => r !== null);
      records = [...records, ...newRecords];
      
      // Calculate totals
      const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalSessions = records.reduce((sum, r) => sum + r.totalSessions, 0);
      const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);
      
      setAllGroupsMonthlyTotal({
        totalAmount,
        totalSessions,
        totalHours,
        records
      });
    } catch (err) {
      console.error('Failed to load all groups earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettingsForEdit = async () => {
    if (!selectedTuteeId) return;
    
    try {
      const data = await fetchEarningsSettings(selectedTuteeId);
      if (data) {
        setSettingsForm({
          messageTemplate: data.messageTemplate,
          feePerHour: data.feePerHour,
          feePerSession: data.feePerSession || 200,
          calculationType: data.calculationType,
        });
      } else {
        // Use default template based on tutee name
        const tutee = selectedTutee;
        const defaultTemplate = tutee?.name.toLowerCase().includes('shermaine')
          ? `Tuition fees for {month}:\n\n{tutee_name}\n\n{sessions_list}\n\nTotal: {total_sessions} x {fee_per_hour}= {total_amount}\n\nThank you! 😄`
          : `Hi Janie, {month} tution fees are as following:\n\n{fee_per_session}/lesson \n{total_sessions} lessons this month \n{sessions_dates}\n\nTotal: {total_amount}\n\nThank you!`;
        
        setSettingsForm({
          messageTemplate: defaultTemplate,
          feePerHour: 140,
          feePerSession: 200,
          calculationType: tutee?.name.toLowerCase().includes('shermaine') ? 'hourly' : 'per_session',
        });
      }
      
      // Load preview sessions
      const currentDate = new Date();
      const year = getYear(currentDate);
      const month = getMonth(currentDate) + 1;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      const previewSess = await fetchTuitionSessions(selectedTuteeId, startDate, endDate);
      setPreviewSessions(previewSess);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedTuteeId) return;
    
    if (!settingsForm.messageTemplate.trim()) {
      setSettingsError('Message template is required');
      return;
    }

    if (settingsForm.feePerHour <= 0) {
      setSettingsError('Fee per hour must be greater than 0');
      return;
    }

    try {
      setSavingSettings(true);
      setSettingsError('');

      const updated = await upsertEarningsSettings({
        tuteeId: selectedTuteeId,
        messageTemplate: settingsForm.messageTemplate.trim(),
        feePerHour: settingsForm.feePerHour,
        feePerSession: settingsForm.feePerSession,
        calculationType: settingsForm.calculationType,
      });

      setSettings(updated);

      // Recalculate amounts for current month sessions if fee changed
      const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;
      await recalculateSessionAmounts(
        selectedTuteeId, 
        settingsForm.calculationType === 'hourly' ? settingsForm.feePerHour : settingsForm.feePerSession, 
        settingsForm.calculationType,
        startDate, 
        endDate
      );

      // Re-upsert the record for current month to update the message and totals in DB
      const updatedSessions = await fetchTuitionSessions(selectedTuteeId, startDate, endDate);
      if (updatedSessions.length > 0) {
        await upsertEarningsRecord(selectedTuteeId, currentYear, currentMonth, updatedSessions);
      }

      await loadEarningsData(); // Reload to update UI
      setShowSettings(false); // Switch back to earnings view after saving
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings. Please try again.');
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Generate preview message
  const previewMessage = useMemo(() => {
    if (!settingsForm.messageTemplate || settingsForm.feePerHour <= 0 || previewSessions.length === 0 || !selectedTutee) {
      return null;
    }

    try {
      const currentDate = new Date();
      const year = getYear(currentDate);
      const month = getMonth(currentDate) + 1;
      const previewSettings: EarningsSettings = {
        id: '',
        tuteeId: selectedTutee.id,
        messageTemplate: settingsForm.messageTemplate,
        feePerHour: settingsForm.feePerHour,
        feePerSession: settingsForm.feePerSession,
        calculationType: settingsForm.calculationType,
        createdAt: '',
        updatedAt: '',
      };
      return generateEarningsMessage(
        previewSettings,
        previewSessions,
        year,
        month,
        selectedTutee.name
      );
    } catch (err) {
      return 'Error generating preview. Please check your template syntax.';
    }
  }, [settingsForm.messageTemplate, settingsForm.feePerHour, previewSessions, selectedTutee]);

  const handleTuteeSelect = (tuteeId: string | null) => {
    // Toggle: if clicking the same tutee, unselect it
    const newTuteeId = selectedTuteeId === tuteeId ? null : tuteeId;
    setSelectedTuteeId(newTuteeId);
    onTuteeSelectChange?.(newTuteeId);
  };

  const loadEarningsData = async () => {
    if (!selectedTuteeId) return;

    try {
      setLoading(true);
      setError('');

      const [records, allSessions, earningsSettings] = await Promise.all([
        fetchEarningsRecords(selectedTuteeId),
        fetchTuitionSessions(selectedTuteeId),
        fetchEarningsSettings(selectedTuteeId),
      ]);

      setEarningsHistory(records);
      setSettings(earningsSettings);

      // Load settings for settings view
      if (earningsSettings) {
        setSettingsForm({
          messageTemplate: earningsSettings.messageTemplate,
          feePerHour: earningsSettings.feePerHour,
          feePerSession: earningsSettings.feePerSession || 200,
          calculationType: earningsSettings.calculationType,
        });
      } else {
        // Use default template based on tutee name
        const defaultTemplate = selectedTutee?.name.toLowerCase().includes('shermaine')
          ? `Tuition fees for {month}:\n\n{tutee_name}\n\n{sessions_list}\n\nTotal: {total_sessions} x {fee_per_hour}= {total_amount}\n\nThank you! 😄`
          : `Hi Janie, {month} tution fees are as following:\n\n{fee_per_session}/lesson \n{total_sessions} lessons this month \n{sessions_dates}\n\nTotal: {total_amount}\n\nThank you!`;
        setSettingsForm({
          messageTemplate: defaultTemplate,
          feePerHour: 140,
          feePerSession: 200,
          calculationType: selectedTutee?.name.toLowerCase().includes('shermaine') ? 'hourly' : 'per_session',
        });
      }

      // Filter sessions for current month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const currentMonthSessions = allSessions.filter((session) => {
        const sessionDate = parseISO(session.sessionDate);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      });

      setSessions(currentMonthSessions);
      setPreviewSessions(currentMonthSessions); // For settings preview

      // Find or create current month record
      const currentRecord = records.find(
        (r) => r.year === currentYear && r.month === currentMonth
      );

      if (currentRecord) {
        setCurrentMonthRecord(currentRecord);
      } else if (currentMonthSessions.length > 0) {
        // Create record from sessions
        const record = await upsertEarningsRecord(
          selectedTuteeId,
          currentYear,
          currentMonth,
          currentMonthSessions
        );
        setCurrentMonthRecord(record);
      } else {
        setCurrentMonthRecord(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load earnings data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async () => {
    if (!selectedTuteeId || !settings) return;

    try {
      setError('');

      const { durationHours, amount } = calculateSessionAmount(
        sessionForm.startTime,
        sessionForm.endTime,
        settings.calculationType === 'hourly' ? settings.feePerHour : (settings.feePerSession || 0),
        settings.calculationType
      );

      const newSession = await createTuitionSession({
        tuteeId: selectedTuteeId,
        sessionDate: sessionForm.sessionDate,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        durationHours,
        amount,
      });

      // Reload data to update current month record
      await loadEarningsData();
      setShowAddSession(false);
      setSessionForm({
        sessionDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '15:00',
        endTime: '17:00',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add session. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateSession = async () => {
    if (!editingSession || !settings) return;

    try {
      setError('');

      const { durationHours, amount } = calculateSessionAmount(
        sessionForm.startTime,
        sessionForm.endTime,
        settings.calculationType === 'hourly' ? settings.feePerHour : (settings.feePerSession || 0),
        settings.calculationType
      );

      await updateTuitionSession({
        id: editingSession.id,
        sessionDate: sessionForm.sessionDate,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        durationHours,
        amount,
      });

      await loadEarningsData();
      setEditingSession(null);
      setSessionForm({
        sessionDate: format(new Date(), 'yyyy-MM-dd'),
        startTime: '15:00',
        endTime: '17:00',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update session. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteConfirm.sessionId) return;

    try {
      await deleteTuitionSession(deleteConfirm.sessionId);
      await loadEarningsData();
      setDeleteConfirm({ isOpen: false, sessionId: null });
    } catch (err: any) {
      setError(err.message || 'Failed to delete session. Please try again.');
      console.error(err);
    }
  };

  const handleCopyMessage = () => {
    if (currentMonthRecord?.generatedMessage && selectedTutee) {
      const finalMessage = currentMonthRecord.generatedMessage.replace(/{tutee_name}/g, selectedTutee.name);
      navigator.clipboard.writeText(finalMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateMessage = async () => {
    if (!selectedTuteeId || !currentMonthRecord) return;

    try {
      setError('');
      await upsertEarningsRecord(
        selectedTuteeId,
        currentMonthRecord.year,
        currentMonthRecord.month,
        sessions
      );
      await loadEarningsData();
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate message. Please try again.');
      console.error(err);
    }
  };


  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex-shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Tuition Earnings</h2>
            <p className="text-xs sm:text-sm text-gray-600">Manage earnings and generate invoices</p>
          </div>
        </div>
        {selectedTuteeId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSettings(true);
                loadSettingsForEdit();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors-smooth press-effect text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        )}
      </div>

      {/* Tutee Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" />
            Select Tuition Group
          </label>
          {tutees.length > 5 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none w-48 transition-all text-gray-900"
              />
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
          {filteredTutees.map((tutee) => {
            const IconComp = getIcon(tutee.icon);
            const isActive = selectedTuteeId === tutee.id;
            
            return (
              <button
                key={tutee.id}
                onClick={() => handleTuteeSelect(tutee.id)}
                className={`group relative flex flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 min-h-[64px] sm:min-h-[80px] touch-manipulation ${
                  isActive 
                    ? `bg-gradient-to-br ${tutee.colorScheme.gradient} text-white shadow-lg scale-105 z-10` 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-2 border-transparent hover:border-indigo-100'
                }`}
              >
                <div className={`mb-1.5 sm:mb-3 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-colors duration-300 ${
                  isActive ? 'bg-white/20' : 'bg-white shadow-sm group-hover:shadow-md'
                }`}>
                  <IconComp className={`w-4 h-4 sm:w-6 sm:h-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold text-center line-clamp-1 leading-tight ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  {tutee.name}
                </span>
                {isActive && (
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-white text-indigo-600 rounded-full p-0.5 sm:p-1 shadow-md animate-in zoom-in-50 duration-300">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[4]" />
                  </div>
                )}
              </button>
            );
          })}
          {filteredTutees.length === 0 && (
            <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm italic">No groups found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings data...</p>
        </div>
      ) : (
        selectedTuteeId && selectedTutee ? (
          /* Earnings View */
          <div className="space-y-6">
          {/* Current Month Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {monthNames[currentMonth - 1]} {currentYear}
              </h3>
              <button
                onClick={() => setShowAddSession(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors-smooth press-effect text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Session
              </button>
            </div>

            {currentMonthRecord ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100 flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{currentMonthRecord.totalSessions}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 flex items-center gap-4">
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                    <History className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{currentMonthRecord.totalHours.toFixed(2)}h</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">${currentMonthRecord.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-white/50 rounded-xl border-2 border-dashed border-indigo-100 mb-6">
                <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-gray-600 font-medium">No earnings record for this month yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first session to get started</p>
              </div>
            )}

            {/* Sessions List */}
            {sessions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Sessions</h4>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{sessions.length} total</span>
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                          <span className="text-[10px] font-bold uppercase">{format(parseISO(session.sessionDate), 'MMM')}</span>
                          <span className="text-lg font-bold leading-none">{format(parseISO(session.sessionDate), 'd')}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-800 truncate">
                            {format(parseISO(session.sessionDate), 'EEEE, d MMMM')}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="w-3 h-3" />
                              {session.startTime} - {session.endTime}
                            </span>
                            <span className="text-gray-300 hidden sm:inline">•</span>
                            <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                              {session.durationHours.toFixed(1)}h
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <p className="text-lg font-bold text-gray-900">${session.amount.toFixed(2)}</p>
                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingSession(session);
                              setSessionForm({
                                sessionDate: session.sessionDate,
                                startTime: session.startTime,
                                endTime: session.endTime,
                              });
                            }}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit session"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, sessionId: session.id })}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Message */}
            {currentMonthRecord?.generatedMessage && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-4 sm:px-5 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">Invoice Message Preview</h4>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleRegenerateMessage}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                      title="Regenerate message"
                    >
                      <Plus className="w-4 h-4 rotate-45" />
                    </button>
                    <button
                      onClick={handleCopyMessage}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all transform active:scale-95 ${
                        copied 
                          ? 'bg-green-500 text-white shadow-green-200' 
                          : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                      } shadow-lg whitespace-nowrap`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-4 sm:p-6 relative">
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm whitespace-pre-wrap border border-gray-100 text-gray-800 leading-relaxed min-h-[120px] sm:min-h-[150px]">
                    {currentMonthRecord.generatedMessage.replace(/{tutee_name}/g, selectedTutee.name)}
                  </div>
                  <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-gray-200 pointer-events-none">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 opacity-10" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Earnings History */}
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                Earnings History
              </h3>
            </div>
            {earningsHistory.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-xl border border-gray-100">
                <p className="text-gray-400 italic">No past earnings recorded for this tutee.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {earningsHistory.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                          {record.year}
                        </p>
                        <h4 className="text-lg font-bold text-gray-900">
                          {monthNames[record.month - 1]}
                        </h4>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs uppercase tracking-tighter font-semibold">Sessions</span>
                        <span className="text-gray-700 font-bold">{record.totalSessions}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-gray-400 text-xs uppercase tracking-tighter font-semibold">Total</span>
                        <span className="text-gray-900 font-bold text-base">${record.totalAmount.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          )}
        </div>
      </div>
    ) : (
      /* No tutee selected - show total monthly summary */
      <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-medium text-indigo-100 mb-1">Total Monthly Earnings</h3>
                  <p className="text-3xl font-bold">
                    {monthNames[currentMonth - 1]} {currentYear}
                  </p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider mb-1">Total Amount</p>
                  <p className="text-3xl font-bold">${allGroupsMonthlyTotal?.totalAmount.toFixed(2) || '0.00'}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider mb-1">Total Sessions</p>
                  <p className="text-3xl font-bold">{allGroupsMonthlyTotal?.totalSessions || 0}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider mb-1">Total Hours</p>
                  <p className="text-3xl font-bold">{allGroupsMonthlyTotal?.totalHours.toFixed(1) || '0.0'}h</p>
                </div>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {allGroupsMonthlyTotal?.records && allGroupsMonthlyTotal.records.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Breakdown by Group
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allGroupsMonthlyTotal.records.map((record) => {
                  const tutee = tutees.find(t => t.id === record.tuteeId);
                  if (!tutee) return null;
                  const IconComp = getIcon(tutee.icon);
                  
                  return (
                    <button
                      key={record.id}
                      onClick={() => handleTuteeSelect(tutee.id)}
                      className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${tutee.colorScheme.gradient} text-white`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {tutee.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Sessions: {record.totalSessions}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Hours: {record.totalHours.toFixed(1)}h</p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">${record.totalAmount.toFixed(2)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {(!allGroupsMonthlyTotal?.records || allGroupsMonthlyTotal.records.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">No earnings recorded for this month</p>
              <p className="text-sm text-gray-400 mt-1">Select a group to add sessions</p>
            </div>
          )}
        </div>
      )
    )}

    {/* Add/Edit Session Modal */}
      {(showAddSession || editingSession) && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-md w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                  <Plus className={`w-7 h-7 transition-transform duration-500 ${editingSession ? 'rotate-90' : ''}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
                    {editingSession ? 'Edit Session' : 'Add Session'}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Earnings Record</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddSession(false);
                  setEditingSession(null);
                  setSessionForm({
                    sessionDate: format(new Date(), 'yyyy-MM-dd'),
                    startTime: '15:00',
                    endTime: '17:00',
                  });
                }}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Date</label>
                <input
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Start Time</label>
                  <input
                    type="time"
                    value={sessionForm.startTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner text-center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">End Time</label>
                  <input
                    type="time"
                    value={sessionForm.endTime}
                    onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner text-center"
                  />
                </div>
              </div>
              {settings && (
                <div className="p-5 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Estimated Earnings</p>
                      <p className="text-lg font-black text-indigo-700">
                        {settings.calculationType === 'hourly' 
                          ? `${calculateSessionAmount(sessionForm.startTime, sessionForm.endTime, settings.feePerHour, 'hourly').durationHours.toFixed(2)}h • $${calculateSessionAmount(sessionForm.startTime, sessionForm.endTime, settings.feePerHour, 'hourly').amount.toFixed(2)}`
                          : `$${(settings.feePerSession || 0).toFixed(2)} total`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowAddSession(false);
                    setEditingSession(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={editingSession ? handleUpdateSession : handleAddSession}
                  className="flex-[2] px-6 py-4 text-white bg-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-indigo-700 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingSession ? 'Update' : 'Add'} Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Earnings Settings Modal */}
      {showSettings && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-2xl w-full my-auto animate-modal-content border border-white/20 relative">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                  <Settings className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">Earnings Settings</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{selectedTutee?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                disabled={savingSettings}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
              >
                <X className="w-6 h-6 text-gray-300" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Calculation Type Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fee Calculation Method</label>
                <div className="flex p-2 bg-gray-100 rounded-2xl">
                  <button
                    onClick={() => setSettingsForm({ ...settingsForm, calculationType: 'hourly' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      settingsForm.calculationType === 'hourly'
                        ? 'bg-white text-indigo-600 shadow-sm scale-[1.02]'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Hourly Rate
                  </button>
                  <button
                    onClick={() => setSettingsForm({ ...settingsForm, calculationType: 'per_session' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      settingsForm.calculationType === 'per_session'
                        ? 'bg-white text-indigo-600 shadow-sm scale-[1.02]'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Per Session
                  </button>
                </div>
              </div>

              {/* Fee Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  {settingsForm.calculationType === 'hourly' ? 'Fee Per Hour ($)' : 'Fee Per Session ($)'}
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</div>
                  <input
                    type="number"
                    value={settingsForm.feePerHour === 0 && settingsForm.calculationType === 'hourly' ? '' : (settingsForm.calculationType === 'hourly' ? settingsForm.feePerHour : settingsForm.feePerSession)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (settingsForm.calculationType === 'hourly') {
                        setSettingsForm({ ...settingsForm, feePerHour: value });
                      } else {
                        setSettingsForm({ ...settingsForm, feePerSession: value });
                      }
                      setSettingsError('');
                    }}
                    className="w-full pl-10 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-gray-800 shadow-inner"
                    placeholder="0.00"
                    disabled={savingSettings}
                  />
                </div>
              </div>

              {/* Message Template */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message Template</label>
                <textarea
                  value={settingsForm.messageTemplate}
                  onChange={(e) => {
                    setSettingsForm({ ...settingsForm, messageTemplate: e.target.value });
                    setSettingsError('');
                  }}
                  rows={6}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-mono text-xs text-gray-800 shadow-inner resize-none"
                  placeholder="Enter message template..."
                  disabled={savingSettings}
                />
                
                {/* Live Preview Section */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Preview</span>
                  </div>
                  {previewMessage ? (
                    <div className="bg-white rounded-2xl p-5 border-2 border-indigo-50 shadow-sm relative overflow-hidden group">
                      <div className="font-mono text-[11px] whitespace-pre-wrap text-gray-600 leading-relaxed relative z-10 max-h-[150px] overflow-y-auto">
                        {previewMessage}
                      </div>
                      <div className="absolute -right-2 -bottom-2 text-indigo-50 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <Eye className="w-16 h-16 opacity-10" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50/50 rounded-2xl p-6 border-2 border-dashed border-gray-100 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                        Preview Unavailable
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {settingsError && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl animate-shake flex items-center gap-3">
                  <X className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-bold text-red-700 uppercase tracking-wide">{settingsError}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowSettings(false)}
                  disabled={savingSettings}
                  className="flex-1 px-6 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings || !settingsForm.messageTemplate.trim() || (settingsForm.calculationType === 'hourly' ? settingsForm.feePerHour <= 0 : settingsForm.feePerSession <= 0)}
                  className={`flex-[2] px-6 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${selectedTutee?.colorScheme.gradient || 'from-indigo-600 to-purple-600'}`}
                >
                  {savingSettings ? (
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation */}
      {deleteConfirm.isOpen && createPortal(
        <ConfirmationModal
          isOpen={deleteConfirm.isOpen}
          onConfirm={handleDeleteSession}
          onCancel={() => setDeleteConfirm({ isOpen: false, sessionId: null })}
          title="Delete Session"
          message="Are you sure you want to delete this session? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />,
        document.body
      )}
    </div>
  );
};

export default EarningsAdmin;
