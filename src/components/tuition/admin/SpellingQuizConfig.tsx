import { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Plus, Edit2, Trash2, Sparkles, X, Loader2, Save, BarChart3, Search, User, GraduationCap, CheckCircle2, AlertCircle,
  Star, Heart, Zap, Target, Award, Trophy, Lightbulb, Brain, Rocket, BookMarked, School, PenTool, Calculator, FlaskConical, Atom, Music, Palette, Camera, Gamepad2, Code, Globe, Coffee, Smile, Check, RotateCcw, Download, FileText, FileJson, FileSpreadsheet, Printer
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
import { SpellingWord, generateSpellingQuestions, WordStatistics, getWordStatistics, SpellingQuestionRecord, saveGeneratedQuestions, confirmQuestions, deleteSpellingQuestion, fetchActiveQuestionsWithDetails, updateSpellingQuestion, generateWordHints } from '../../../services/spellingQuizService';
import { fetchSpellingWords, createSpellingWord, updateSpellingWord, deleteSpellingWord } from '../../../services/spellingQuizService';
import { fetchStudentsForTutee } from '../../../services/tuteeService';
import { exportWordsAsCSV, exportWordsAsText, exportWordsAsJSON, exportPracticeSheet } from '../../../utils/exportUtils';
import { Tutee } from '../../../types/tuition';
import ConfirmationModal from '../../ui/ConfirmationModal';
import AnimatedCard from '../../ui/AnimatedCard';

interface SpellingQuizConfigProps {
  tutees: Tutee[];
  initialTuteeId?: string;
}

const SpellingQuizConfig = ({ tutees, initialTuteeId }: SpellingQuizConfigProps) => {
  const [selectedTuteeId, setSelectedTuteeId] = useState<string>(initialTuteeId || tutees[0]?.id || '');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [words, setWords] = useState<SpellingWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadedStudents, setLoadedStudents] = useState<{ value: string; label: string }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchWordsInput, setBatchWordsInput] = useState('');
  const [isBatchAdding, setIsBatchAdding] = useState(false);
  const [editingWord, setEditingWord] = useState<SpellingWord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; wordId: string | null }>({
    isOpen: false,
    wordId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<SpellingQuestionRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [wordStats, setWordStats] = useState<WordStatistics[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [activeQuestions, setActiveQuestions] = useState<SpellingQuestionRecord[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<SpellingQuestionRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCompletedWords, setShowCompletedWords] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const [questionEditForm, setQuestionEditForm] = useState({
    sentence: '',
    answer: '',
    hint: '',
  });

  const [newWord, setNewWord] = useState({
    word: '',
    hint: '',
  });

  const selectedTutee = useMemo(() => tutees.find(t => t.id === selectedTuteeId), [tutees, selectedTuteeId]);

  // Load students dynamically from database
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedTuteeId) return;
      
      try {
        const students = await fetchStudentsForTutee(selectedTuteeId);
        const options = students.map(s => ({
          value: s.studentName.toLowerCase(),
          label: s.studentName.charAt(0).toUpperCase() + s.studentName.slice(1)
        }));
        setLoadedStudents(options);
      } catch (err) {
        console.error('Error loading students:', err);
        setLoadedStudents([]);
      }
    };
    
    loadStudents();
  }, [selectedTuteeId]);

  const studentOptions = useMemo(() => {
    return loadedStudents;
  }, [loadedStudents]);

  // Set selectedStudent when studentOptions changes
  useEffect(() => {
    if (studentOptions.length > 0) {
      // If no student selected or current selection is invalid, select the first one
      if (!selectedStudent || !studentOptions.some(opt => opt.value === selectedStudent)) {
        setSelectedStudent(studentOptions[0].value);
      }
    } else {
      // No students available, clear selection
      setSelectedStudent('');
    }
  }, [studentOptions, selectedStudent]);

  useEffect(() => {
    if (selectedTuteeId && selectedStudent) {
      loadWords();
      loadStatistics();
      loadActiveQuestions();
    }
  }, [selectedTuteeId, selectedStudent]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.export-menu-container')) {
          setShowExportMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const loadActiveQuestions = async () => {
    try {
      const questions = await fetchActiveQuestionsWithDetails(selectedTuteeId, selectedStudent);
      setActiveQuestions(questions);
    } catch (err: any) {
      console.error('Failed to load active questions:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      setLoadingStats(true);
      const stats = await getWordStatistics(selectedTuteeId, selectedStudent);
      setWordStats(stats);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadWords = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchSpellingWords(selectedTuteeId, selectedStudent, true); // Always fetch all words
      setWords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load spelling words. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.word.trim() || !newWord.hint.trim()) {
      setError('Both word and hint are required');
      return;
    }

    try {
      setError('');
      await createSpellingWord({
        word: newWord.word.trim(),
        hint: newWord.hint.trim(),
        tuteeId: selectedTuteeId,
        studentName: selectedStudent,
      });
      await loadWords();
      await loadStatistics();
      setShowAddModal(false);
      setNewWord({ word: '', hint: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to add word. Please try again.');
      console.error(err);
    }
  };

  const handleUpdateWord = async () => {
    if (!editingWord) return;
    if (!newWord.word.trim() || !newWord.hint.trim()) {
      setError('Both word and hint are required');
      return;
    }

    try {
      setError('');
      await updateSpellingWord({
        id: editingWord.id,
        word: newWord.word.trim(),
        hint: newWord.hint.trim(),
      });
      await loadWords();
      await loadStatistics();
      setShowAddModal(false);
      setEditingWord(null);
      setNewWord({ word: '', hint: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to update word. Please try again.');
      console.error(err);
    }
  };

  const handleToggleWordStatus = async (wordId: string, currentStatus: 'active' | 'completed') => {
    try {
      const newStatus = currentStatus === 'active' ? 'completed' : 'active';
      await updateSpellingWord({
        id: wordId,
        status: newStatus,
      });
      await loadWords();
      await loadStatistics();
    } catch (err: any) {
      setError(err.message || 'Failed to update word status. Please try again.');
      console.error(err);
    }
  };

  const handleBatchAdd = async () => {
    if (!batchWordsInput.trim()) {
      setError('Please enter some words');
      return;
    }

    try {
      setIsBatchAdding(true);
      setError('');
      
      // Split by newlines or commas
      const wordLines = batchWordsInput.split(/[\n,]/).map(w => w.trim()).filter(w => w.length > 0);
      
      if (wordLines.length === 0) {
        setError('No valid words found');
        return;
      }

      const wordsToCreate: { word: string; hint: string | null }[] = wordLines.map(line => {
        if (line.includes(':')) {
          const parts = line.split(':');
          return { word: parts[0].trim(), hint: parts.slice(1).join(':').trim() };
        } else if (line.includes(' - ')) {
          const parts = line.split(' - ');
          return { word: parts[0].trim(), hint: parts.slice(1).join(' - ').trim() };
        }
        return { word: line, hint: null };
      });

      // Get words that need AI hints
      const wordsMissingHints = wordsToCreate.filter(w => !w.hint).map(w => w.word);
      let aiHints: Record<string, string> = {};
      
      if (wordsMissingHints.length > 0) {
        try {
          aiHints = await generateWordHints(wordsMissingHints);
        } catch (hintError) {
          console.error('Failed to generate AI hints, using fallback', hintError);
          // Fallback to generic hint if AI fails
          wordsMissingHints.forEach(w => {
            aiHints[w] = 'Science vocabulary word';
          });
        }
      }

      // Create all words
      for (const item of wordsToCreate) {
        await createSpellingWord({
          word: item.word,
          hint: item.hint || aiHints[item.word] || 'Science vocabulary word',
          tuteeId: selectedTuteeId,
          studentName: selectedStudent,
        });
      }

      await loadWords();
      await loadStatistics();
      setShowBatchModal(false);
      setBatchWordsInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to add words. Please try again.');
      console.error(err);
    } finally {
      setIsBatchAdding(false);
    }
  };

  const handleDeleteWord = (id: string) => {
    setDeleteConfirm({ isOpen: true, wordId: id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.wordId) return;

    try {
      setIsDeleting(true);
      setError('');
      await deleteSpellingWord(deleteConfirm.wordId);
      await loadWords();
      await loadStatistics();
      setDeleteConfirm({ isOpen: false, wordId: null });
    } catch (err: any) {
      setError(err.message || 'Failed to delete word. Please try again.');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const startEdit = (word: SpellingWord) => {
    setEditingWord(word);
    setNewWord({
      word: word.word,
      hint: word.hint,
    });
    setShowAddModal(true);
  };

  const cancelEdit = () => {
    setEditingWord(null);
    setShowAddModal(false);
    setNewWord({ word: '', hint: '' });
    setError('');
  };

  const handleGenerateQuestions = async () => {
    // Only use ACTIVE words for quiz generation
    const activeWords = words.filter(w => w.status === 'active');
    
    if (activeWords.length === 0) {
      setError('Please add some active words first before generating questions');
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      const wordList = activeWords.map(w => w.word);
      const questions = await generateSpellingQuestions(wordList, selectedTuteeId, selectedStudent, activeWords.length);
      
      // Save questions as draft first
      const savedQuestions = await saveGeneratedQuestions(questions, activeWords, selectedTuteeId, selectedStudent);
      setGeneratedQuestions(savedQuestions);
      setSelectedQuestions(new Set(savedQuestions.map(q => q.id))); // Select all by default
      setShowPreview(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteSpellingQuestion(id);
      setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
      const newSet = new Set(selectedQuestions);
      newSet.delete(id);
      setSelectedQuestions(newSet);
    } catch (err: any) {
      console.error('Failed to delete question:', err);
    }
  };

  const handleConfirmQuestions = async () => {
    if (selectedQuestions.size === 0) {
      setError('Please select at least one question to confirm');
      return;
    }

    try {
      setIsConfirming(true);
      setError('');
      await confirmQuestions(Array.from(selectedQuestions));
      setShowPreview(false);
      setGeneratedQuestions([]);
      setSelectedQuestions(new Set());
      await loadWords();
      await loadActiveQuestions();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm questions. Please try again.');
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const filteredWords = useMemo(() => {
    // Filter by status first
    let filtered = showCompletedWords 
      ? words.filter(w => w.status === 'completed')
      : words.filter(w => w.status === 'active');
    
    // Then filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(w => 
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
        w.hint.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [words, searchTerm, showCompletedWords]);

  const filteredTutees = useMemo(() => {
    if (!groupSearchTerm.trim()) return tutees;
    return tutees.filter(t => t.name.toLowerCase().includes(groupSearchTerm.toLowerCase()));
  }, [tutees, groupSearchTerm]);

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || GraduationCap;
  };

  return (
    <AnimatedCard className="overflow-hidden">
      <div id="spelling-quiz-admin-section" className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Spelling Quiz Manager</h2>
              <p className="text-sm text-gray-500">Curate words and generate AI-powered quiz questions</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setBatchWordsInput('');
                setShowBatchModal(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all font-bold text-xs sm:text-sm press-effect border border-purple-100"
            >
              <Sparkles className="w-4 h-4" />
              <span>Batch Add</span>
            </button>
            <button
              onClick={() => {
                setEditingWord(null);
                setNewWord({ word: '', hint: '' });
                setShowAddModal(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold text-xs sm:text-sm press-effect"
            >
              <Plus className="w-4 h-4" />
              <span>Add Word</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Tutee Group Selector */}
        <div className="mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Manage Quiz for Group
            </label>
            {tutees.length > 5 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={groupSearchTerm}
                  onChange={(e) => setGroupSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-xs bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-indigo-500 outline-none w-48 transition-all shadow-sm text-gray-900"
                />
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTutees.map((tutee) => {
              const IconComp = getIcon(tutee.icon);
              const isActive = selectedTuteeId === tutee.id;
              
              return (
                <button
                  key={tutee.id}
                  onClick={() => setSelectedTuteeId(tutee.id)}
                  className={`group relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-br ${tutee.colorScheme.gradient} text-white shadow-lg scale-105 z-10` 
                      : 'bg-white text-gray-500 hover:bg-gray-100 border-2 border-transparent hover:border-indigo-100 shadow-sm'
                  }`}
                >
                  <div className={`mb-2 p-2 rounded-xl transition-colors duration-300 ${
                    isActive ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-white'
                  }`}>
                    <IconComp className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                  </div>
                  <span className={`text-[10px] font-bold text-center line-clamp-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {tutee.name}
                  </span>
                  {isActive && (
                    <div className="absolute -top-1 -right-1 bg-white text-indigo-600 rounded-full p-1 shadow-md animate-in zoom-in-50 duration-300">
                      <CheckCircle2 className="w-2.5 h-2.5 stroke-[4]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Student Selector within group */}
        {studentOptions.length > 1 && (
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
            <span className="text-sm font-bold text-purple-700 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" />
              Configure for:
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              {studentOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStudent(opt.value)}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                    selectedStudent === opt.value
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-purple-600 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Word Management */}
          <div className="lg:col-span-8">
            {/* Status Toggle */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => setShowCompletedWords(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    !showCompletedWords
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Active Words ({words.filter(w => w.status === 'active').length})
                </button>
                <button
                  onClick={() => setShowCompletedWords(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    showCompletedWords
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed Words ({words.filter(w => w.status === 'completed').length})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search word bank..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-900"
                />
              </div>
              <div className="flex gap-2 ml-4">
                {/* Export Dropdown */}
                <div className="relative export-menu-container">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={words.length === 0}
                    className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-indigo-200 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all font-bold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                  
                  {showExportMenu && words.length > 0 && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            exportWordsAsCSV(filteredWords, wordStats, selectedStudent);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Excel (CSV)</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            exportWordsAsText(filteredWords, wordStats, selectedStudent, true);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Study List (TXT)</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            exportPracticeSheet(filteredWords, selectedStudent);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Printer className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium">Practice Sheet</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            exportWordsAsJSON(filteredWords, wordStats, selectedStudent);
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <FileJson className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium">Backup (JSON)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isGenerating || words.filter(w => w.status === 'active').length === 0}
                  className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:opacity-90 transition-all font-bold text-sm shadow-md disabled:opacity-50 disabled:grayscale"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="hidden sm:inline">AI Questions</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-gray-500 font-medium">Loading word bank...</p>
              </div>
            ) : filteredWords.length === 0 ? (
              <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <BookOpen className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Word bank is empty</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-1">Start by adding some spelling words for {selectedStudent}.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-6 text-indigo-600 font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add first word
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 px-3 sm:px-4 py-3 border-b border-gray-100 flex items-center">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Word ({filteredWords.length})
                    </span>
                  </div>
                  <div className="hidden md:block flex-[2] min-w-0 pr-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hint</span>
                  </div>
                  <div className="w-12 sm:w-24 text-center pr-1 sm:pr-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acc.</span>
                  </div>
                  <div className="w-24 sm:w-32"></div> {/* Actions spacer - increased width */}
                </div>
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                  {filteredWords.map((word) => {
                    const stat = wordStats.find(s => s.wordId === word.id);
                    return (
                      <div
                        key={word.id}
                        className="group flex items-center justify-between p-2.5 sm:p-4 hover:bg-indigo-50/30 transition-all"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-base font-bold text-gray-800 tracking-tight truncate">{word.word}</h4>
                            {word.status === 'completed' && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[8px] font-bold uppercase tracking-wider">
                                Done
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium truncate md:hidden">{word.hint}</p>
                        </div>
                        
                        <div className="hidden md:block flex-[2] min-w-0 pr-4">
                          <p className="text-xs text-gray-500 font-medium truncate">{word.hint}</p>
                        </div>

                        <div className="w-12 sm:w-24 text-center flex flex-col items-center pr-1 sm:pr-2">
                          {stat && stat.totalAttempts > 0 ? (
                            <>
                              <span className={`text-[10px] sm:text-sm font-black ${stat.accuracy >= 70 ? 'text-green-600' : stat.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {stat.accuracy}%
                              </span>
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter hidden sm:block">{stat.totalAttempts} {stat.totalAttempts === 1 ? 'try' : 'tries'}</span>
                            </>
                          ) : (
                            <span className="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase tracking-widest">New</span>
                          )}
                        </div>

                        <div className="w-24 sm:w-32 flex justify-end gap-1">
                          <button
                            onClick={() => handleToggleWordStatus(word.id, word.status)}
                            className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all shadow-sm border ${
                              word.status === 'active'
                                ? 'text-gray-400 hover:text-green-600 hover:bg-white border-transparent hover:border-green-100'
                                : 'text-gray-400 hover:text-indigo-600 hover:bg-white border-transparent hover:border-indigo-100'
                            }`}
                            title={word.status === 'active' ? 'Mark as completed' : 'Mark as active'}
                          >
                            {word.status === 'active' ? (
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEdit(word)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg sm:rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"
                          >
                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg sm:rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) /* end word bank */ }
          </div>

          {/* Sidebar Stats & Active Quiz */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Quiz Preview */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Active Quiz
                </h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                  {activeQuestions.length} Questions
                </span>
              </div>
              
              {activeQuestions.length > 0 ? (
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {activeQuestions.map((q) => (
                    <div key={q.id} className="bg-white p-3 rounded-xl border border-green-100 text-xs shadow-sm group">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-gray-700 font-medium line-clamp-2 leading-relaxed">
                          {q.sentence.replace('__________', '_____')}
                        </p>
                        <button
                          onClick={() => {
                            setEditingQuestion(q);
                            setQuestionEditForm({
                              sentence: q.sentence,
                              answer: q.answer,
                              hint: q.hint,
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-bold text-green-600">Answer: {q.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-green-600/50 bg-white/50 rounded-2xl border-2 border-dashed border-green-200 mb-6">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold uppercase tracking-wider">No active questions</p>
                </div>
              )}
              
              <button
                onClick={handleGenerateQuestions}
                disabled={isGenerating || words.length === 0}
                className="w-full py-3 bg-white text-green-700 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-green-200 press-effect"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Refresh with AI
              </button>
            </div>

            {/* Performance Snapshot */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Performance
              </h3>
              
              {loadingStats ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
              ) : wordStats.length === 0 ? (
                <p className="text-center text-gray-400 text-sm italic py-8">No data available yet.</p>
              ) : (
                <div className="space-y-4">
                  {wordStats
                    .sort((a, b) => a.accuracy - b.accuracy)
                    .slice(0, 5)
                    .map(stat => (
                      <div key={stat.wordId}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-700">{stat.word}</span>
                          <span className={`${stat.accuracy < 50 ? 'text-red-500' : 'text-yellow-600'}`}>{stat.accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${stat.accuracy < 50 ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${stat.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))
                  }
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center mt-4">
                    Showing 5 most challenging words
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full animate-modal-content border border-purple-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  {editingWord ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{editingWord ? 'Edit Word' : 'New Spelling Word'}</h3>
                  <p className="text-sm text-gray-500">For {selectedStudent}</p>
                </div>
              </div>
              <button onClick={cancelEdit} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">The Word *</label>
                <input
                  type="text"
                  value={newWord.word}
                  onChange={(e) => {
                    setNewWord({ ...newWord, word: e.target.value });
                    setError('');
                  }}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 outline-none transition-all text-xl font-black tracking-tight text-gray-900"
                  placeholder="e.g. Photosynthesis"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Helpful Hint *</label>
                <textarea
                  value={newWord.hint}
                  onChange={(e) => {
                    setNewWord({ ...newWord, hint: e.target.value });
                    setError('');
                  }}
                  rows={2}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 outline-none transition-all font-medium resize-none text-gray-900"
                  placeholder="e.g. Process plants use to make food"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={editingWord ? handleUpdateWord : handleAddWord}
                  disabled={!newWord.word.trim() || !newWord.hint.trim()}
                  className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingWord ? 'Save Changes' : 'Add to Bank'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Add Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full animate-modal-content border border-purple-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Batch Add Words</h3>
                  <p className="text-sm text-gray-500">For {selectedStudent}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchWordsInput('');
                }} 
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Paste Word List</label>
                <textarea
                  value={batchWordsInput}
                  onChange={(e) => {
                    setBatchWordsInput(e.target.value);
                    setError('');
                  }}
                  rows={8}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-purple-500 outline-none transition-all font-medium resize-none text-gray-900"
                  placeholder="Enter words separated by commas or new lines.&#10;Tip: Use 'Word: Hint' format to include hints!&#10;Example:&#10;Photosynthesis: Process of making food&#10;Chlorophyll: Green pigment in leaves"
                />
                <p className="mt-3 text-xs text-gray-400 italic">
                  Paste a list of words from your notes. If no hint is provided, one will be generated automatically.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowBatchModal(false);
                    setBatchWordsInput('');
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchAdd}
                  disabled={isBatchAdding || !batchWordsInput.trim()}
                  className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-100 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                  {isBatchAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isBatchAdding ? 'Adding Words...' : 'Add to Bank'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Questions Review Modal */}
      {showPreview && generatedQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-modal-content border border-pink-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Review AI Questions</h3>
                  <p className="text-sm text-gray-500">Select the best questions for your quiz</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedQuestions([]);
                  setSelectedQuestions(new Set());
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {generatedQuestions.map((q) => {
                const isSelected = selectedQuestions.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      const newSet = new Set(selectedQuestions);
                      if (newSet.has(q.id)) newSet.delete(q.id);
                      else newSet.add(q.id);
                      setSelectedQuestions(newSet);
                    }}
                    className={`text-left p-5 rounded-2xl border-2 transition-all relative group ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50/50 shadow-md'
                        : 'border-gray-100 bg-white hover:border-pink-200'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-300 group-hover:border-pink-300'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-bold leading-relaxed mb-3">{q.sentence}</p>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-white text-pink-600 border border-pink-100 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                            Answer: {q.answer}
                          </span>
                          <span className="px-3 py-1 bg-white text-gray-500 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Hint: {q.hint}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuestion(q.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-white rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 pt-8 border-t border-gray-50 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedQuestions([]);
                  setSelectedQuestions(new Set());
                }}
                className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Discard All
              </button>
              <button
                onClick={handleConfirmQuestions}
                disabled={isConfirming || selectedQuestions.size === 0}
                className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white bg-pink-600 hover:bg-pink-700 shadow-xl shadow-pink-100 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
              >
                {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Activate {selectedQuestions.size} Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-modal-backdrop">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-2xl w-full animate-modal-content border border-indigo-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Edit2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Edit Quiz Question</h3>
              </div>
              <button onClick={() => setEditingQuestion(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">The Sentence *</label>
                <textarea
                  value={questionEditForm.sentence}
                  onChange={(e) => setQuestionEditForm({ ...questionEditForm, sentence: e.target.value })}
                  rows={3}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 leading-relaxed text-gray-900"
                  placeholder="Use __________ for the blank"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Correct Answer *</label>
                  <input
                    type="text"
                    value={questionEditForm.answer}
                    onChange={(e) => setQuestionEditForm({ ...questionEditForm, answer: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-black text-indigo-600 tracking-tight text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Helpful Hint *</label>
                  <input
                    type="text"
                    value={questionEditForm.hint}
                    onChange={(e) => setQuestionEditForm({ ...questionEditForm, hint: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setIsUpdating(true);
                    try {
                      await updateSpellingQuestion(editingQuestion.id, {
                        sentence: questionEditForm.sentence.trim(),
                        answer: questionEditForm.answer.trim(),
                        hint: questionEditForm.hint.trim(),
                      });
                      await loadActiveQuestions();
                      setEditingQuestion(null);
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                  className="flex-[2] px-6 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Update Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, wordId: null })}
        onConfirm={confirmDelete}
        title="Delete Word"
        message="Are you sure you want to delete this word? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </AnimatedCard>
  );
};

export default SpellingQuizConfig;
