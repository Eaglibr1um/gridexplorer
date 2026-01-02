import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  X,
  Check,
  FileText,
  Bell,
  BellOff,
  Smile,
  Settings
} from 'lucide-react';
import AnimatedModal from './ui/AnimatedModal';
import ConfirmationModal from './ui/ConfirmationModal';
import { notificationService } from '../services/notificationService';
import {
  fetchSections,
  createSection,
  updateSection,
  deleteSection,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  getDailyEntry,
  fetchDailyEntries,
  createOrUpdateDailyEntry,
  updateTaskEntryCount,
  subscribeWorkProgressNotifications,
  unsubscribeWorkProgressNotifications,
  isWorkProgressNotificationsEnabled,
  calculateStreak,
  hasTasksWithCount,
  type WorkProgressSection,
  type WorkProgressTask,
  type DailyEntryWithTasks
} from '../services/workProgressService';
import { importWorkProgressData } from '../utils/importWorkProgressData';
import { VAPID_PUBLIC_KEY } from '../config/notification';

// Helper to convert VAPID key
const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array<ArrayBuffer>;
};

const WorkProgressTracker = () => {
  const [sections, setSections] = useState<WorkProgressSection[]>([]);
  const [tasks, setTasks] = useState<WorkProgressTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [currentEntry, setCurrentEntry] = useState<DailyEntryWithTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'today' | 'stats'>('today');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState<DailyEntryWithTasks[]>([]);
  const [streak, setStreak] = useState<{ current: number; longest: number }>({ current: 0, longest: 0 });
  const [allEntries, setAllEntries] = useState<DailyEntryWithTasks[]>([]);

  // Modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingSection, setEditingSection] = useState<WorkProgressSection | null>(null);
  const [editingTask, setEditingTask] = useState<WorkProgressTask | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'section' | 'task'; id: string; name: string } | null>(null);
  
  // Form states
  const [sectionName, setSectionName] = useState('');
  const [taskName, setTaskName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bellLongPressTimer, setBellLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const [importingData, setImportingData] = useState(false);
  const [showImportButton, setShowImportButton] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [selectedTasksForToday, setSelectedTasksForToday] = useState<string[]>([]);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [titleClickTimer, setTitleClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Popular emoji options
  const EMOJI_OPTIONS = [
    '😊', '😄', '😃', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗',
    '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨',
    '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞',
    '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥',
    '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐',
    '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲',
    '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
    '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
    '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️',
    '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻',
    '😼', '😽', '🙀', '😿', '😾'
  ];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Check notification subscription status separately to avoid re-renders
  useEffect(() => {
    const checkSubscription = async () => {
      if (notificationService.isSupported()) {
        const subscribed = await notificationService.isSubscribed('work_progress');
        setNotificationsEnabled(subscribed);
      }
    };
    checkSubscription();
  }, []); // Only run once on mount

  // Load entry when date changes
  useEffect(() => {
    if (selectedDate) {
      loadDailyEntry(selectedDate);
    }
  }, [selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsData, tasksData, streakData, entriesData] = await Promise.all([
        fetchSections(),
        fetchTasks(),
        calculateStreak(),
        fetchDailyEntries() // Load all entries for stats
      ]);
      setSections(sectionsData);
      setTasks(tasksData);
      setStreak(streakData);
      setAllEntries(entriesData);
      // Show import button if no sections exist
      setShowImportButton(sectionsData.length === 0);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load entries for current month when month changes
  const loadMonthEntries = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
      const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      const entries = await fetchDailyEntries(firstDay, lastDay);
      setMonthEntries(entries);
    } catch (error) {
      console.error('Error loading month entries:', error);
    }
  };

  // Load month entries when month changes
  useEffect(() => {
    if (viewMode === 'calendar') {
      loadMonthEntries();
    }
  }, [currentMonth, viewMode]);

  const handleImportData = async () => {
    if (!confirm('This will import initial tasks and historical data. Continue?')) return;
    try {
      setImportingData(true);
      await importWorkProgressData();
      await loadData();
      setShowImportButton(false);
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. Check console for details.');
    } finally {
      setImportingData(false);
    }
  };

  const loadDailyEntry = async (date: string) => {
    try {
      const entry = await getDailyEntry(date);
      setCurrentEntry(entry);
      if (entry) {
        setNotes(entry.notes || '');
        setSelectedEmoji(entry.moodEmoji || '');
        setNotificationsEnabled(entry.notificationsEnabled || false);
      } else {
        setNotes('');
        setSelectedEmoji('');
        setNotificationsEnabled(false);
      }
      // Check notification status
      const isEnabled = await isWorkProgressNotificationsEnabled();
      setNotificationsEnabled(isEnabled);
    } catch (error) {
      console.error('Error loading daily entry:', error);
    }
  };

  const handleSaveNotes = async () => {
    try {
      await createOrUpdateDailyEntry(selectedDate, { notes });
      await loadDailyEntry(selectedDate);
      await loadData(); // Reload to update streak
      setShowNotesModal(false);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  // Word count for notes
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = (text: string): number => {
    return text.length;
  };

  const handleEmojiSelect = async (emoji: string) => {
    try {
      // Visual feedback before saving
      setSelectedEmoji(emoji);
      await createOrUpdateDailyEntry(selectedDate, { moodEmoji: emoji });
      await loadDailyEntry(selectedDate);
      // Delay close for better UX
      setTimeout(() => {
        setShowEmojiModal(false);
      }, 200);
    } catch (error) {
      console.error('Error saving emoji:', error);
    }
  };

  const handleNotificationToggle = async () => {
    try {
      if (notificationsEnabled) {
        await unsubscribeWorkProgressNotifications();
        setNotificationsEnabled(false);
        await createOrUpdateDailyEntry(selectedDate, { notificationsEnabled: false });
      } else {
        // Request notification permission and subscribe
        if ('Notification' in window && 'serviceWorker' in navigator) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            await subscribeWorkProgressNotifications(subscription.toJSON());
            setNotificationsEnabled(true);
            await createOrUpdateDailyEntry(selectedDate, { notificationsEnabled: true });
          } else {
            alert('Notification permission denied. Please enable notifications in your browser settings.');
          }
        } else {
          alert('Notifications are not supported in this browser.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to update notification settings. Please try again.');
    }
  };

  const handleSendTestNotification = async () => {
    if (!notificationsEnabled || isSendingTestNotification) return;

    setIsSendingTestNotification(true);
    try {
      // Calculate current streak for the test message
      const currentStreak = streak.current;
      
      // Send a test notification using the browser's Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = `Test Notification! ${currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '🔥'}`;
        const body = currentStreak > 0 
          ? `Keep up the amazing ${currentStreak}-day streak! This is what your 8 PM reminder will look like.`
          : "This is what your 8 PM reminder will look like! Start logging to build a streak!";
        
        new Notification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'work-progress-test',
          requireInteraction: false,
        });
      }
      
      // Visual feedback
      setTimeout(() => {
        setIsSendingTestNotification(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setIsSendingTestNotification(false);
    }
  };

  const handleBellPressStart = () => {
    if (!notificationsEnabled) return;
    
    const timer = setTimeout(() => {
      handleSendTestNotification();
    }, 800); // Long press = 800ms
    
    setBellLongPressTimer(timer);
  };

  const handleBellPressEnd = () => {
    if (bellLongPressTimer) {
      clearTimeout(bellLongPressTimer);
      setBellLongPressTimer(null);
    }
  };

  const handleBellClick = () => {
    if (bellLongPressTimer) {
      // Was a long press, don't toggle
      clearTimeout(bellLongPressTimer);
      setBellLongPressTimer(null);
    } else {
      // Normal click, toggle
      handleNotificationToggle();
    }
  };

  const handleTaskCountChange = async (taskId: string, delta: number) => {
    try {
      const entryId = currentEntry?.id;
      if (!entryId) {
        // Create entry first
        const newEntry = await createOrUpdateDailyEntry(selectedDate, {});
        const currentCount = 0;
        await updateTaskEntryCount(newEntry.id, taskId, currentCount + delta);
      } else {
        const taskEntry = currentEntry?.taskEntries.find(te => te.taskId === taskId);
        const currentCount = taskEntry?.count || 0;
        await updateTaskEntryCount(entryId, taskId, currentCount + delta);
      }
      await loadDailyEntry(selectedDate);
      
      // Trigger animation
      const element = document.querySelector(`[data-task-id="${taskId}"]`);
      if (element) {
        element.classList.add('task-count-pulse');
        setTimeout(() => element.classList.remove('task-count-pulse'), 300);
      }
    } catch (error) {
      console.error('Error updating task count:', error);
    }
  };

  const handleTaskCountDirectEdit = async (taskId: string, newCount: number) => {
    try {
      const count = Math.max(0, Math.floor(newCount)); // Ensure non-negative integer
      const entryId = currentEntry?.id;
      if (!entryId) {
        const newEntry = await createOrUpdateDailyEntry(selectedDate, {});
        await updateTaskEntryCount(newEntry.id, taskId, count);
      } else {
        await updateTaskEntryCount(entryId, taskId, count);
      }
      await loadDailyEntry(selectedDate);
    } catch (error) {
      console.error('Error updating task count:', error);
    }
  };

  const handleCreateSection = async () => {
    if (!sectionName.trim()) return;
    try {
      await createSection(sectionName.trim());
      await loadData();
      setShowSectionModal(false);
      setSectionName('');
    } catch (error) {
      console.error('Error creating section:', error);
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !sectionName.trim()) return;
    try {
      await updateSection(editingSection.id, { name: sectionName.trim() });
      await loadData();
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionName('');
    } catch (error) {
      console.error('Error updating section:', error);
    }
  };

  const handleDeleteSection = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteSection(deleteConfirm.id);
      await loadData();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!taskName.trim() || !selectedSectionId) return;
    try {
      await createTask(selectedSectionId, taskName.trim());
      await loadData();
      setShowTaskModal(false);
      setTaskName('');
      setSelectedSectionId(null);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !taskName.trim() || !selectedSectionId) return;
    try {
      await updateTask(editingTask.id, { 
        name: taskName.trim(),
        sectionId: selectedSectionId 
      });
      await loadData();
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskName('');
      setSelectedSectionId(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteTask(deleteConfirm.id);
      await loadData();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const openEditSection = (section: WorkProgressSection) => {
    setEditingSection(section);
    setSectionName(section.name);
    setShowSectionModal(true);
  };

  const openEditTask = (task: WorkProgressTask) => {
    setEditingTask(task);
    setTaskName(task.name);
    setSelectedSectionId(task.sectionId);
    setShowTaskModal(true);
  };

  const getTaskCount = (taskId: string): number => {
    return currentEntry?.taskEntries.find(te => te.taskId === taskId)?.count || 0;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null): boolean => {
    if (!date) return false;
    return formatDate(date) === selectedDate;
  };

  const hasEntryWithTasks = (date: Date | null): boolean => {
    if (!date) return false;
    const dateStr = formatDate(date);
    const entry = monthEntries.find(e => e.entryDate === dateStr);
    return entry ? hasTasksWithCount(entry) : false;
  };

  const getTasksBySection = (sectionId: string) => {
    return tasks.filter(task => task.sectionId === sectionId);
  };

  const getActiveTasksForToday = () => {
    if (!currentEntry) return [];
    return tasks.filter(task => {
      const taskEntry = currentEntry.taskEntries.find(te => te.taskId === task.id);
      return taskEntry && taskEntry.count > 0;
    });
  };

  const handleTitleClick = () => {
    setTitleClickCount(prev => prev + 1);
    
    if (titleClickTimer) {
      clearTimeout(titleClickTimer);
    }
    
    const timer = setTimeout(() => {
      setTitleClickCount(0);
    }, 1000); // Reset after 1 second
    
    setTitleClickTimer(timer);
    
    if (titleClickCount + 1 === 3) {
      // Triple click detected
      window.location.href = '/tuition?stay=true';
    }
  };

  const handleAddTasksToToday = () => {
    setShowAddTaskForm(true);
  };

  const handleTaskSelectionToggle = (taskId: string) => {
    setSelectedTasksForToday(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleConfirmAddTasks = async () => {
    // Initialize selected tasks with count of 1 so they appear immediately
    for (const taskId of selectedTasksForToday) {
      await handleTaskCountDirectEdit(taskId, 1);
    }
    setShowAddTaskForm(false);
    setSelectedTasksForToday([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-safe">
      <style>{`
        @keyframes task-pulse {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.4);
          }
          50% { 
            transform: scale(1.15); 
            box-shadow: 0 0 0 10px rgba(147, 51, 234, 0);
          }
        }
        .task-count-pulse {
          animation: task-pulse 0.3s ease-in-out;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        @keyframes emoji-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .emoji-hover:hover {
          animation: emoji-wiggle 0.5s ease-in-out;
        }
      `}</style>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 shadow-lg">
        <div className="container-padding py-6">
          <div className="flex items-center justify-between mb-4">
            <div 
              onClick={handleTitleClick}
              className="cursor-pointer select-none"
            >
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                ✨ Work Progress
              </h1>
              <div className="flex items-center gap-2 mt-2">
                {streak.current > 0 ? (
                  <>
                    <span className="text-2xl animate-pulse">🔥</span>
                    <span className="text-sm font-bold text-white/90">
                      {streak.current} day streak!
                    </span>
                    {streak.longest > streak.current && (
                      <span className="text-xs text-white/70">
                        (Best: {streak.longest})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-lg opacity-50">🔥</span>
                    <span className="text-xs text-white/60 italic">
                      Start your streak today!
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all active:scale-95 border border-white/30"
                title="Settings"
              >
                <Settings className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'stats' ? 'today' : 'stats')}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all active:scale-95 border border-white/30"
                title="Statistics"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'calendar' ? 'today' : 'calendar')}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all active:scale-95 border border-white/30"
                title="Calendar"
              >
                <Calendar className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Date Selector */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(formatDate(yesterday));
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95 shadow-lg"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              
              <div className="text-center flex-1 px-4">
                <div className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long'
                  })}
                </div>
                <div className="text-sm sm:text-base text-white/95 font-semibold">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="text-xs text-white/80 font-bold mt-2 hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full hover:bg-white/20"
                >
                  Jump to Today →
                </button>
              </div>
              
              <button
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(formatDate(tomorrow));
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95 shadow-lg"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="container-padding py-6">
          <div className="bg-white rounded-3xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() - 1);
                  setCurrentMonth(newMonth);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-black text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => {
                  const newMonth = new Date(currentMonth);
                  newMonth.setMonth(newMonth.getMonth() + 1);
                  setCurrentMonth(newMonth);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {getDaysInMonth(currentMonth).map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }
                const dateStr = formatDate(date);
                const isSelectedDate = isSelected(date);
                const isTodayDate = isToday(date);
                const hasEntry = hasEntryWithTasks(date);
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setViewMode('today');
                    }}
                    className={`aspect-square rounded-xl font-bold transition-all active:scale-95 relative ${
                      isSelectedDate
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                        : isTodayDate
                        ? 'bg-purple-100 text-purple-700'
                        : hasEntry
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {date.getDate()}
                    {hasEntry && !isSelectedDate && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Statistics View */}
      {viewMode === 'stats' && (
        <div className="container-padding py-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6">📊 Progress Statistics</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white">
                <div className="text-sm font-semibold opacity-90">Total Days Logged</div>
                <div className="text-3xl font-black mt-1">
                  {allEntries.filter(e => e.taskEntries.some(t => t.count > 0)).length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white">
                <div className="text-sm font-semibold opacity-90">Current Streak</div>
                <div className="text-3xl font-black mt-1 flex items-center gap-1">
                  🔥 {streak.current}
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4 text-white">
                <div className="text-sm font-semibold opacity-90">Longest Streak</div>
                <div className="text-3xl font-black mt-1">
                  {streak.longest}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
                <div className="text-sm font-semibold opacity-90">Total Tasks Done</div>
                <div className="text-3xl font-black mt-1">
                  {allEntries.reduce((sum, entry) => 
                    sum + entry.taskEntries.reduce((taskSum, t) => taskSum + t.count, 0), 0
                  )}
                </div>
              </div>
            </div>

            {/* Task Breakdown */}
            <h3 className="text-lg font-bold text-gray-900 mb-4">Task Breakdown (All Time)</h3>
            <div className="space-y-3">
              {tasks.map(task => {
                const totalCount = allEntries.reduce((sum, entry) => {
                  const taskEntry = entry.taskEntries.find(t => t.taskId === task.id);
                  return sum + (taskEntry?.count || 0);
                }, 0);
                
                if (totalCount === 0) return null;
                
                const section = sections.find(s => s.id === task.sectionId);
                const maxCount = Math.max(...tasks.map(t => 
                  allEntries.reduce((sum, entry) => {
                    const te = entry.taskEntries.find(te => te.taskId === t.id);
                    return sum + (te?.count || 0);
                  }, 0)
                ));
                const percentage = (totalCount / maxCount) * 100;

                return (
                  <div key={task.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold text-gray-900">{task.name}</div>
                        <div className="text-xs text-gray-500">{section?.name}</div>
                      </div>
                      <div className="text-2xl font-black text-purple-600">{totalCount}</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <h3 className="text-lg font-bold text-gray-900 mb-4 mt-8">Recent Activity (Last 30 Days)</h3>
            <div className="space-y-2">
              {allEntries
                .filter(entry => {
                  const entryDate = new Date(entry.entryDate);
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  return entryDate >= thirtyDaysAgo && entry.taskEntries.some(t => t.count > 0);
                })
                .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
                .slice(0, 10)
                .map(entry => {
                  const totalCount = entry.taskEntries.reduce((sum, t) => sum + t.count, 0);
                  const date = new Date(entry.entryDate);
                  const isToday = formatDate(date) === formatDate(new Date());
                  
                  return (
                    <button
                      key={entry.id}
                      onClick={() => {
                        setSelectedDate(entry.entryDate);
                        setViewMode('today');
                      }}
                      className="w-full bg-gray-50 hover:bg-gray-100 rounded-xl p-4 flex items-center justify-between transition-all"
                    >
                      <div className="text-left">
                        <div className="font-bold text-gray-900">
                          {date.toLocaleDateString('en-SG', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                          {isToday && <span className="ml-2 text-purple-600 text-sm">(Today)</span>}
                        </div>
                        {entry.moodEmoji && (
                          <div className="text-2xl mt-1">{entry.moodEmoji}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-purple-600">{totalCount}</div>
                        <div className="text-xs text-gray-500">tasks</div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Today's Tasks View */}
      {viewMode === 'today' && (
        <div className="container-padding py-6 space-y-6">
          {/* Mood Emoji, Notes, and Notifications */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setShowEmojiModal(true)}
              className={`rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2 border-2 ${
                selectedEmoji
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:border-yellow-400'
                  : 'bg-white border-dashed border-gray-200 hover:border-purple-300'
              }`}
            >
              {selectedEmoji ? (
                <span className="text-5xl hover:scale-110 transition-transform">{selectedEmoji}</span>
              ) : (
                <>
                  <Smile className="w-8 h-8 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">Mood</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowNotesModal(true)}
              className={`rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2 border-2 ${
                notes.trim()
                  ? 'bg-blue-50 border-blue-300 hover:border-blue-400'
                  : 'bg-white border-dashed border-gray-200 hover:border-purple-300'
              }`}
            >
              <FileText className={`w-8 h-8 ${notes.trim() ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${notes.trim() ? 'text-blue-600' : 'text-gray-600'}`}>
                {notes.trim() ? `${getWordCount(notes)} words` : 'Add Notes'}
              </span>
            </button>
            <button
              onClick={handleBellClick}
              onMouseDown={handleBellPressStart}
              onMouseUp={handleBellPressEnd}
              onMouseLeave={handleBellPressEnd}
              onTouchStart={handleBellPressStart}
              onTouchEnd={handleBellPressEnd}
              className={`rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2 border-2 relative ${
                notificationsEnabled
                  ? 'bg-green-50 border-green-300 hover:border-green-400'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              } ${isSendingTestNotification ? 'ring-4 ring-green-400 scale-105' : ''}`}
              title={notificationsEnabled ? "Click to disable • Long press to test" : "Click to enable notifications"}
            >
              {isSendingTestNotification && (
                <div className="absolute inset-0 rounded-2xl bg-green-500 opacity-20 animate-pulse" />
              )}
              {notificationsEnabled ? (
                <>
                  <Bell className={`w-8 h-8 text-green-600 ${isSendingTestNotification ? 'animate-bounce' : ''}`} />
                  <span className="text-xs font-semibold text-green-600">
                    {isSendingTestNotification ? 'Sending...' : '8:00 PM'}
                  </span>
                </>
              ) : (
                <>
                  <BellOff className="w-8 h-8 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Off</span>
                </>
              )}
            </button>
          </div>

          {/* Notes Display */}
          {notes.trim() && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-blue-100">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-black text-white">Today's Notes</h3>
                </div>
                <button
                  onClick={() => setShowNotesModal(true)}
                  className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-all"
                >
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {notes}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>{getWordCount(notes)} words</span>
                    <span>{getCharCount(notes)} characters</span>
                  </div>
                  {currentEntry?.updatedAt && (
                    <span className="text-gray-400">
                      {new Date(currentEntry.updatedAt).toLocaleString('en-SG', {
                        timeZone: 'Asia/Singapore',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} SGT
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Today's Active Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Today's Tasks
              </h2>
              <button
                onClick={handleAddTasksToToday}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Add Task
              </button>
            </div>

            {getActiveTasksForToday().length === 0 ? (
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl p-12 text-center border-2 border-dashed border-purple-200">
                <div className="text-6xl mb-4 animate-bounce">📝</div>
                <p className="text-gray-800 text-lg font-bold mb-2">Ready to be productive?</p>
                <p className="text-gray-600 text-sm mb-4">Add tasks to start building your streak! 🔥</p>
                <button
                  onClick={handleAddTasksToToday}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Get Started
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getActiveTasksForToday().map(task => {
                  const section = sections.find(s => s.id === task.sectionId);
                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all border border-gray-100 hover:border-purple-200 group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">{task.name}</h3>
                          <p className="text-sm text-gray-500">{section?.name}</p>
                        </div>
                        <button
                          onClick={() => handleTaskCountDirectEdit(task.id, 0)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from today"
                        >
                          <X className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleTaskCountChange(task.id, -1)}
                          disabled={getTaskCount(task.id) === 0}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 text-red-600 font-black text-2xl hover:from-red-200 hover:to-red-300 active:scale-90 transition-all flex items-center justify-center hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={getTaskCount(task.id)}
                          onChange={(e) => handleTaskCountDirectEdit(task.id, parseInt(e.target.value) || 0)}
                          data-task-id={task.id}
                          className="w-20 h-14 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center font-black text-3xl text-purple-900 shadow-inner border-2 border-transparent focus:border-purple-500 focus:outline-none focus:shadow-lg transition-all"
                          min="0"
                        />
                        <button
                          onClick={() => handleTaskCountChange(task.id, 1)}
                          className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 text-green-600 font-black text-2xl hover:from-green-200 hover:to-green-300 active:scale-90 transition-all flex items-center justify-center hover:shadow-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Modal */}
      <AnimatedModal
        isOpen={showSectionModal}
        onClose={() => {
          setShowSectionModal(false);
          setEditingSection(null);
          setSectionName('');
        }}
        title={editingSection ? 'Edit Section' : 'New Section'}
      >
        <div className="space-y-4">
          <input
            type="text"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="Section name"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-lg"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editingSection ? handleUpdateSection() : handleCreateSection();
              }
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSectionModal(false);
                setEditingSection(null);
                setSectionName('');
              }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={editingSection ? handleUpdateSection : handleCreateSection}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-black hover:shadow-lg transition-all"
            >
              {editingSection ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Task Modal */}
      <AnimatedModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          setTaskName('');
          setSelectedSectionId(null);
        }}
        title={editingTask ? 'Edit Task' : 'New Task'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Section</label>
            <select
              value={selectedSectionId || ''}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-lg"
            >
              <option value="">Select a section</option>
              {sections.map(section => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Task Name</label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 text-lg"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editingTask ? handleUpdateTask() : handleCreateTask();
                }
              }}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowTaskModal(false);
                setEditingTask(null);
                setTaskName('');
                setSelectedSectionId(null);
              }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={editingTask ? handleUpdateTask : handleCreateTask}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-black hover:shadow-lg transition-all"
            >
              {editingTask ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Emoji Modal */}
      <AnimatedModal
        isOpen={showEmojiModal}
        onClose={() => {
          setShowEmojiModal(false);
        }}
        title="How are you feeling today?"
        size="lg"
      >
        <div className="space-y-4">
          {currentEntry?.moodEmoji && (
            <div className="text-center py-4 bg-purple-50 rounded-xl">
              <div className="text-6xl mb-2 animate-bounce">{currentEntry.moodEmoji}</div>
              <p className="text-sm font-semibold text-purple-700">Current mood</p>
            </div>
          )}
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-96 overflow-y-auto p-2 smooth-scroll">
            {EMOJI_OPTIONS.map((emoji) => {
              const isSelected = currentEntry?.moodEmoji === emoji;
              return (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`aspect-square flex items-center justify-center text-3xl sm:text-4xl p-2 rounded-xl transition-all transform emoji-hover ${
                    isSelected 
                      ? 'bg-gradient-to-br from-purple-200 to-pink-200 ring-4 ring-purple-500 scale-110 shadow-lg' 
                      : 'bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:scale-110 hover:shadow-md active:scale-95'
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          {currentEntry?.moodEmoji && (
            <button
              onClick={() => handleEmojiSelect('')}
              className="w-full px-6 py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Clear Mood Emoji
            </button>
          )}
        </div>
      </AnimatedModal>

      {/* Notes Modal */}
      <AnimatedModal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setNotes(currentEntry?.notes || '');
        }}
        title="Daily Notes"
        size="xl"
      >
        <div className="space-y-4">
          {/* Editor Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 px-2">
            <span>{getWordCount(notes)} words</span>
            <span>{getCharCount(notes)} characters</span>
          </div>

          {/* Textarea with better styling */}
          <div className="relative">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened today? Share your thoughts, achievements, challenges..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-base leading-relaxed min-h-[300px] resize-y"
              autoFocus
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowNotesModal(false);
                setNotes(currentEntry?.notes || '');
              }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNotes}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-black hover:shadow-lg transition-all"
            >
              Save Notes
            </button>
          </div>
        </div>
      </AnimatedModal>


      {/* Settings Modal */}
      <AnimatedModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="⚙️ Settings"
        size="lg"
      >
        <div className="space-y-6">
          {/* Manage Sections */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sections</h3>
            <div className="space-y-2">
              {sections.map(section => (
                <div key={section.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <span className="font-semibold text-gray-900">{section.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        openEditSection(section);
                        setShowSettingsModal(false);
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm({ type: 'section', id: section.id, name: section.name });
                        setShowSettingsModal(false);
                      }}
                      className="p-2 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  setEditingSection(null);
                  setSectionName('');
                  setShowSectionModal(true);
                  setShowSettingsModal(false);
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Section
              </button>
            </div>
          </div>

          {/* Manage Tasks */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">All Tasks</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {sections.map(section => {
                const sectionTasks = getTasksBySection(section.id);
                if (sectionTasks.length === 0) return null;
                
                return (
                  <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">{section.name}</h4>
                      <button
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          setShowTaskModal(true);
                          setShowSettingsModal(false);
                        }}
                        className="p-1.5 hover:bg-white/50 rounded-lg transition-all"
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                    <div className="p-2 space-y-1">
                      {sectionTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <span className="font-medium text-gray-900">{task.name}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                openEditTask(task);
                                setShowSettingsModal(false);
                              }}
                              className="p-1.5 hover:bg-gray-200 rounded-lg transition-all"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({ type: 'task', id: task.id, name: task.name });
                                setShowSettingsModal(false);
                              }}
                              className="p-1.5 hover:bg-red-100 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowSettingsModal(false)}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Close
          </button>
        </div>
      </AnimatedModal>

      {/* Add Task Today Modal */}
      <AnimatedModal
        isOpen={showAddTaskForm}
        onClose={() => {
          setShowAddTaskForm(false);
          setSelectedTasksForToday([]);
        }}
        title="Add Tasks for Today"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">Select tasks you want to track today</p>
          
          <div className="max-h-96 overflow-y-auto space-y-4">
            {sections.map(section => {
              const sectionTasks = getTasksBySection(section.id).filter(task => {
                // Don't show tasks that already have count > 0 today
                const taskEntry = currentEntry?.taskEntries.find(te => te.taskId === task.id);
                return !taskEntry || taskEntry.count === 0;
              });
              
              if (sectionTasks.length === 0) return null;
              
              return (
                <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2">
                    <h3 className="font-bold text-gray-900">{section.name}</h3>
                  </div>
                  <div className="p-2 space-y-1">
                    {sectionTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => handleTaskSelectionToggle(task.id)}
                        className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                          selectedTasksForToday.includes(task.id)
                            ? 'bg-purple-100 border-2 border-purple-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">{task.name}</span>
                          {selectedTasksForToday.includes(task.id) && (
                            <Check className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTasksForToday.length === 0 && tasks.filter(task => {
            const taskEntry = currentEntry?.taskEntries.find(te => te.taskId === task.id);
            return !taskEntry || taskEntry.count === 0;
          }).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>All tasks are already added for today! 🎉</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowAddTaskForm(false);
                setSelectedTasksForToday([]);
              }}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAddTasks}
              disabled={selectedTasksForToday.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-black hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {selectedTasksForToday.length > 0 ? `(${selectedTasksForToday.length})` : ''}
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm?.type === 'section') {
            handleDeleteSection();
          } else {
            handleDeleteTask();
          }
        }}
        title={`Delete ${deleteConfirm?.type === 'section' ? 'Section' : 'Task'}`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default WorkProgressTracker;

