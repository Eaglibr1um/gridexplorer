import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Award, RefreshCw, Trophy, Users, Keyboard, PenTool, X } from 'lucide-react';
import { fetchActiveQuestions, recordWordAttempt, fetchSpellingWords, SpellingQuestion } from '../services/spellingQuizService';
import { Tutee } from '../types/tuition';

interface ScienceSpellingQuizProps {
  tutee: Tutee;
  onBack?: () => void;
}

const ScienceSpellingQuiz = ({ tutee, onBack }: ScienceSpellingQuizProps) => {
  // Fallback questions (used if no active questions in database)
  const rayneQuestionsFallback = [
    { sentence: "Towels can __________ water after a shower.", answer: "absorb", hint: "Soak up" },
    { sentence: "When you open a bottle of soda, it will __________ gas bubbles.", answer: "release", hint: "Let go" },
    { sentence: "A snake is a cold-blooded __________.", answer: "reptile", hint: "Group of animals" },
    { sentence: "The soil in the garden feels __________ after the rain.", answer: "moist", hint: "A little wet" },
    { sentence: "A __________ is so small that we cannot see it without a microscope.", answer: "microorganism", hint: "Micro + organism" },
    { sentence: "__________ grow on dead trees and help break them down.", answer: "fungi", hint: "Plural of fungus" },
    { sentence: "Bakers use __________ to make bread fluffy and soft.", answer: "yeast", hint: "Starts with Y" },
    { sentence: "Antarctica has some of the __________ temperatures on Earth.", answer: "coldest", hint: "Most cold" },
    { sentence: "Mount Everest has the __________ peak in the world.", answer: "highest", hint: "Most high" },
    { sentence: "We must __________ good hygiene to stay healthy.", answer: "practise", hint: "Do regularly" },
    { sentence: "Some dust particles can be seen with the __________.", answer: "microscope", hint: "Tool for seeing small things" },
    { sentence: "A __________ grows in damp forests and can be eaten.", answer: "mushroom", hint: "Type of fungus" },
    { sentence: "Old bread may grow __________ if left for too long.", answer: "mould", hint: "Fuzzy growth" },
    { sentence: "Living things can __________ to produce more of their kind.", answer: "reproduce", hint: "Make babies" },
    { sentence: "Sandpaper feels __________ compared to smooth glass.", answer: "rough", hint: "Not smooth" },
    { sentence: "Desert plants can __________ with little water.", answer: "survive", hint: "Stay alive" },
    { sentence: "A ruler can __________ slightly without breaking.", answer: "bend", hint: "Curve" },
    { sentence: "A soft sofa is very __________ to sit on.", answer: "comfortable", hint: "Feels nice" },
    { sentence: "Scientists are __________ the hardness of different rocks.", answer: "testing", hint: "Checking" },
    { sentence: "The __________ of the rope is tested by pulling on it.", answer: "strength", hint: "How strong" },
    { sentence: "Please __________ this box carefully with both hands.", answer: "handle", hint: "Hold and move" },
    { sentence: "The human __________ is an important sense organ.", answer: "eye", hint: "We see with it" },
    { sentence: "We take a __________ every few seconds to stay alive.", answer: "breath", hint: "Breathing in" },
    { sentence: "The __________ help us breathe in oxygen and breathe out carbon dioxide.", answer: "lungs", hint: "Body organs for breathing" },
    { sentence: "Iron is a type of __________.", answer: "metal", hint: "Material category" },
    { sentence: "Bottles are often made of __________ because it is light.", answer: "plastic", hint: "Man-made material" },
    { sentence: "Animals __________ to danger by running away or hiding.", answer: "respond", hint: "React" },
    { sentence: "Exercise will __________ your heartbeat.", answer: "increase", hint: "Make faster" },
    { sentence: "Resting will __________ your heartbeat.", answer: "decrease", hint: "Make slower" },
    { sentence: "Plants grow well __________ they get enough light and water.", answer: "when", hint: "At the time that" }
  ];

  const jeffreyQuestionsFallback = [
    { sentence: "Water is a __________ because it flows and takes the shape of its container.", answer: "liquid", hint: "State of matter that flows" },
    { sentence: "Ice is a __________ because it keeps its shape.", answer: "solid", hint: "State of matter with fixed shape" },
    { sentence: "The cheetah runs the __________ among all land animals.", answer: "fastest", hint: "Most fast" },
    { sentence: "The turtle runs the __________ among the three animals.", answer: "slowest", hint: "Most slow" },
    { sentence: "We use a __________ to measure how hot or cold something is.", answer: "thermometer", hint: "Temperature measuring tool" },
    { sentence: "The __________ in the classroom rose when the heater was turned on.", answer: "temperature", hint: "How hot or cold" },
    { sentence: "Wood is a common __________ used for making furniture.", answer: "material", hint: "What things are made of" },
    { sentence: "Draw a __________ line with your ruler.", answer: "straight", hint: "Not curved" },
    { sentence: "Magnets can __________ certain metals.", answer: "attract", hint: "Pull towards" },
    { sentence: "Two similar poles of a magnet will __________ each other.", answer: "repel", hint: "Push away" },
    { sentence: "Some solids are __________ dissolved in water.", answer: "easily", hint: "Without difficulty" },
    { sentence: "Glass is __________ so we can see through it.", answer: "transparent", hint: "See-through" },
    { sentence: "Frosted glass is __________ because it lets some light through.", answer: "translucent", hint: "Partly see-through" },
    { sentence: "A brick wall is __________ because light cannot pass through it.", answer: "opaque", hint: "Not see-through" },
    { sentence: "Exercise helps to increase muscle __________.", answer: "strength", hint: "How strong" },
    { sentence: "Food passes from the stomach into the __________ for digestion.", answer: "intestines", hint: "Long tube in body" },
    { sentence: "The __________ stores food and begins the digestion process.", answer: "stomach", hint: "Body part that holds food" },
    { sentence: "Turning up the heater will __________ the room temperature.", answer: "increase", hint: "Make higher" },
    { sentence: "Turning off the air conditioner will __________ the room temperature.", answer: "increase", hint: "Make higher" },
    { sentence: "The ball rolled __________ the two chairs.", answer: "between", hint: "In the middle of two things" },
    { sentence: "Lions and elephants are examples of __________.", answer: "mammals", hint: "Group of animals" },
    { sentence: "Plants need soil to __________ water and nutrients.", answer: "absorb", hint: "Soak up" },
    { sentence: "Salt is a type of __________ found in nature.", answer: "mineral", hint: "Natural substance" },
    { sentence: "We are __________ the length of the table using a measuring tape.", answer: "measuring", hint: "Finding the size" },
    { sentence: "A solid has a __________ shape that does not change.", answer: "fixed", hint: "Stays the same" },
    { sentence: "Mirrors __________ light to show our reflection.", answer: "reflect", hint: "Bounce back" }
  ];

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SpellingQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [records, setRecords] = useState<Record<string, any[]>>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [inputMode, setInputMode] = useState<'keyboard' | 'handwriting'>('keyboard');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wordIdMap, setWordIdMap] = useState<Map<string, string>>(new Map()); // Map answer -> wordId for statistics tracking

  const studentNames = useMemo(() => {
    if (tutee.id === 'primary-school') return ['Rayne', 'Jeffrey'];
    return [tutee.name];
  }, [tutee]);

  // Force light theme for quiz - ensure good contrast regardless of localStorage
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    return () => {
      // Don't restore theme on unmount - let ThemeContext handle it
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`spellingRecords_${tutee.id}`);
    if (saved) {
      setRecords(JSON.parse(saved));
    } else {
      // Initialize empty records for each student
      const initialRecords: Record<string, any[]> = {};
      studentNames.forEach(name => {
        initialRecords[name.toLowerCase()] = [];
      });
      setRecords(initialRecords);
    }
  }, [tutee.id, studentNames]);

  // Timer effect - countdown and auto-submit (30s total per question, not per attempt)
  useEffect(() => {
    // Only run timer when active and not showing final feedback
    const isFinalAnswer = showFeedback && (feedbackMsg.includes('Correct') || attempts >= 3);
    if (!timerActive || isFinalAnswer || completed || !selectedStudent || questions.length === 0) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Time's up - force final answer
      setTimerActive(false);
      const currentAnswer = userAnswer.trim();
      const correct = currentAnswer.toLowerCase() === questions[currentQ].answer.toLowerCase();
      
      const recordStats = async () => {
        if (selectedStudent && wordIdMap.size > 0) {
          const answer = questions[currentQ].answer.toLowerCase();
          const wordId = wordIdMap.get(answer);
          if (wordId) {
            try {
              await recordWordAttempt({
                wordId,
                tuteeId: tutee.id,
                studentName: selectedStudent,
                isCorrect: correct,
              });
            } catch (error) {
              console.error('Error recording word attempt:', error);
            }
          }
        }
      };
      
      if (currentAnswer && correct) {
        setFeedbackMsg('✓ Correct! Well done!');
        setShowFeedback(true);
        setScore(prev => prev + 1);
        setAttempts(0);
        recordStats();
      } else {
        // Time's up - show final answer regardless of attempts
        setAttempts(3); // Set to max attempts to show final answer
        setFeedbackMsg(`⏰ Time's up! The correct answer is: ${questions[currentQ].answer}`);
        setShowFeedback(true);
        recordStats();
      }
    }
  }, [timeLeft, timerActive, showFeedback, completed, selectedStudent, userAnswer, attempts, currentQ, questions, feedbackMsg, wordIdMap, tutee.id]);

  // Reset timer when question changes
  useEffect(() => {
    if (selectedStudent && questions.length > 0) {
      setTimeLeft(30);
      setTimerActive(true);
    }
  }, [currentQ, selectedStudent, questions.length]);

  // Handwriting canvas functions
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  setUserAnswer('');
};

  const startDrawing = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Convert handwriting to text using basic recognition
    // For now, we'll use a simple approach - users can manually type what they drew
    // Or we can integrate a handwriting recognition API later
  };

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && inputMode === 'handwriting') {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#4c1d95';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [inputMode]);

  const selectStudent = async (studentName: string) => {
    const studentKey = studentName.toLowerCase();
    setSelectedStudent(studentKey);
    
    try {
      // Try to load active questions from database
      const activeQuestions = await fetchActiveQuestions(tutee.id, studentKey);
      
      if (activeQuestions && activeQuestions.length > 0) {
        // Use database questions
        setQuestions(activeQuestions);
        
        // Build word ID map for statistics tracking
        const words = await fetchSpellingWords(tutee.id, studentKey);
        const idMap = new Map<string, string>();
        words.forEach(word => {
          idMap.set(word.word.toLowerCase(), word.id);
        });
        setWordIdMap(idMap);
      } else {
        // Fallback to hardcoded questions for known students
        if (tutee.id === 'primary-school') {
          setQuestions(studentKey === 'rayne' ? rayneQuestionsFallback : jeffreyQuestionsFallback);
        } else {
          setQuestions([]);
        }
        setWordIdMap(new Map());
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      // Fallback
      if (tutee.id === 'primary-school') {
        setQuestions(studentKey === 'rayne' ? rayneQuestionsFallback : jeffreyQuestionsFallback);
      } else {
        setQuestions([]);
      }
      setWordIdMap(new Map());
    }
  };

  const checkAnswer = async () => {
    const correct = userAnswer.toLowerCase().trim() === questions[currentQ].answer.toLowerCase();
    
    // Record statistics if we have word ID
    if (selectedStudent && wordIdMap.size > 0) {
      const answer = questions[currentQ].answer.toLowerCase();
      const wordId = wordIdMap.get(answer);
      if (wordId) {
        try {
          await recordWordAttempt({
            wordId,
            tuteeId: tutee.id,
            studentName: selectedStudent,
            isCorrect: correct,
          });
        } catch (error) {
          console.error('Error recording word attempt:', error);
        }
      }
    }
    
    if (correct) {
      // Correct answer - stop timer and show success
      setTimerActive(false);
      setFeedbackMsg('✓ Correct! Well done!');
      setShowFeedback(true);
      setScore(score + 1);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        // Final attempt - stop timer and record incorrect
        setTimerActive(false);
        setFeedbackMsg(`✗ The correct answer is: ${questions[currentQ].answer}`);
        setShowFeedback(true);
        
        // Record final incorrect attempt
        if (selectedStudent && wordIdMap.size > 0) {
          const answer = questions[currentQ].answer.toLowerCase();
          const wordId = wordIdMap.get(answer);
          if (wordId) {
            try {
              await recordWordAttempt({
                wordId,
                tuteeId: tutee.id,
                studentName: selectedStudent,
                isCorrect: false,
              });
            } catch (error) {
              console.error('Error recording word attempt:', error);
            }
          }
        }
      } else {
        // Wrong but can retry - timer continues, just show feedback
        setFeedbackMsg(`✗ Not quite right. You have ${3 - newAttempts} ${3 - newAttempts === 1 ? 'try' : 'tries'} left!`);
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setUserAnswer('');
          // Timer continues running - don't reset it
        }, 1500);
      }
    }
  };

  const nextQuestion = () => {
    setTimerActive(false); // Stop current timer
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setShowHint(false);
      setAttempts(0);
      setFeedbackMsg('');
      setTimeLeft(30); // Reset timer for next question
      setTimerActive(true); // Start timer for next question
      clearCanvas(); // Clear handwriting canvas
    } else if (selectedStudent) {
      const percentage = Math.round((score / questions.length) * 100);
      const newRecords = { ...records };
      const studentKey = selectedStudent;
      if (!newRecords[studentKey]) newRecords[studentKey] = [];
      newRecords[studentKey].push({
        date: new Date().toLocaleString(),
        timestamp: new Date().toISOString(),
        score: score,
        total: questions.length,
        percentage: percentage
      });
      setRecords(newRecords);
      localStorage.setItem(`spellingRecords_${tutee.id}`, JSON.stringify(newRecords));
      setCompleted(true);
    }
  };

  const restart = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback if no callback provided
      setSelectedStudent(null);
      setCurrentQ(0);
      setUserAnswer('');
      setScore(0);
      setAttempts(0);
      setShowFeedback(false);
      setShowHint(false);
      setCompleted(false);
      setFeedbackMsg('');
    }
  };

  if (!selectedStudent || questions.length === 0) {
    if (selectedStudent && questions.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 sm:p-6 md:p-8 flex items-center justify-center safe-area-inset">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full text-center mx-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing your quiz...</p>
            <p className="text-xs text-gray-400 mt-2">If this takes too long, ensure words are added in the config.</p>
            <button 
              onClick={() => setSelectedStudent(null)}
              className="mt-4 text-purple-600 font-bold text-sm"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 sm:p-6 md:p-8 flex items-center justify-center safe-area-inset">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-5 sm:p-6 md:p-8 max-w-2xl w-full mx-2">
          <div className="text-center mb-6 sm:mb-8">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-purple-600 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-700 mb-2 px-2">Science Spelling Quiz</h1>
            <p className="text-sm sm:text-base text-gray-600 px-2">Choose your student to start!</p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {studentNames.map((name, idx) => {
              const key = name.toLowerCase();
              const studentRecord = records[key] || [];
              const bestScore = studentRecord.length > 0 ? Math.max(...studentRecord.map(r => r.percentage)) : 0;
              const isPink = idx % 2 === 0;
              
              return (
                <button
                  key={name}
                  onClick={() => selectStudent(name)}
                  className={`bg-gradient-to-br ${isPink ? 'from-pink-400 to-purple-500' : 'from-blue-400 to-indigo-500'} text-white p-5 sm:p-6 md:p-8 rounded-lg sm:rounded-xl active:scale-95 transition-transform shadow-lg min-h-[140px] touch-manipulation text-left`}
                >
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">{name}'s Quiz</h2>
                  <p className={`mb-3 sm:mb-4 text-sm sm:text-base ${isPink ? 'text-pink-100' : 'text-blue-100'}`}>
                    Customized for your level
                  </p>
                  {studentRecord.length > 0 && (
                    <div className="bg-white/20 rounded-lg p-2 sm:p-3 text-xs sm:text-sm">
                      <p className="font-semibold">Best Score:</p>
                      <p className="text-xl sm:text-2xl">{bestScore}%</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {Object.values(records).some(r => r.length > 0) && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-yellow-300">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700">🏆 Recent Performance</h3>
              </div>
              
              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {studentNames.map((name, idx) => {
                  const key = name.toLowerCase();
                  const studentRecord = records[key] || [];
                  const bestScore = studentRecord.length > 0 ? Math.max(...studentRecord.map(r => r.percentage)) : 0;
                  const isPink = idx % 2 === 0;
                  
                  if (studentRecord.length === 0) return null;

                  return (
                    <div key={name} className={`bg-white rounded-lg p-3 sm:p-4 border-2 ${isPink ? 'border-pink-300' : 'border-blue-300'}`}>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <h4 className={`font-bold ${isPink ? 'text-pink-600' : 'text-blue-600'} text-base sm:text-lg`}>{name}</h4>
                        <span className={`text-xl sm:text-2xl font-bold ${isPink ? 'text-pink-600' : 'text-blue-600'}`}>
                          {bestScore}%
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">Best Score</p>
                      <p className="text-xs text-gray-500">Total Attempts: {studentRecord.length}</p>
                      <div className="mt-2 text-xs text-gray-600">
                        Latest: {studentRecord[studentRecord.length - 1].percentage}%
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
  }

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 sm:p-6 md:p-8 flex items-center justify-center safe-area-inset">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full text-center mx-2">
          <Award className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 px-2" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
            {selectedStudent === 'rayne' ? 'Rayne' : 'Jeffrey'}'s Result
          </h2>
          <p className="text-5xl sm:text-6xl font-bold text-gray-700 mb-2">{score}/{questions.length}</p>
          <p className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
            {percentage}%
          </p>
          <div className="mb-4 sm:mb-6 px-2">
            {percentage === 100 && <p className="text-lg sm:text-xl text-green-600">🌟 Perfect Score! You're a spelling superstar!</p>}
            {percentage >= 80 && percentage < 100 && <p className="text-lg sm:text-xl text-blue-600">🎉 Excellent work! Keep it up!</p>}
            {percentage >= 60 && percentage < 80 && <p className="text-lg sm:text-xl text-purple-600">👍 Good job! Practice makes perfect!</p>}
            {percentage < 60 && <p className="text-lg sm:text-xl text-orange-600">💪 Keep practicing! You're improving!</p>}
          </div>
          <button
            onClick={restart}
            className="bg-purple-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-purple-700 active:scale-95 transition-all flex items-center gap-2 mx-auto min-h-[44px] touch-manipulation"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-3 sm:p-4 md:p-8 safe-area-inset">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Circular Timer - Left Side */}
              {timerActive && !(showFeedback && (feedbackMsg.includes('Correct') || attempts >= 3)) && (
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex-shrink-0">
                  <svg className="transform -rotate-90 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - timeLeft / 30)}`}
                      className={`transition-all duration-1000 ${
                        timeLeft > 20 ? 'text-green-500' :
                        timeLeft > 10 ? 'text-yellow-500' :
                        'text-red-500'
                      }`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm sm:text-base md:text-lg font-bold ${
                      timeLeft > 20 ? 'text-green-600' :
                      timeLeft > 10 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {timeLeft}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }} />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
                  {selectedStudent === 'rayne' ? 'Rayne' : 'Jeffrey'}'s Quiz
                </h1>
              </div>
            </div>
            <div className="text-right flex-shrink-0 w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-600">Question {currentQ + 1}/{questions.length}</p>
              <p className="text-base sm:text-lg font-bold" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
                Score: {score}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((currentQ + 1) / questions.length) * 100}%`,
                  background: selectedStudent === 'rayne' 
                    ? 'linear-gradient(to right, #ec4899, #a855f7)' 
                    : 'linear-gradient(to right, #3b82f6, #6366f1)'
                }}
              ></div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
            <p className="text-base sm:text-lg md:text-xl text-gray-800 leading-relaxed">
              {questions[currentQ].sentence}
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Input Mode Toggle */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setInputMode('keyboard')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'keyboard'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } min-h-[44px] touch-manipulation`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  <span>Keyboard</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setInputMode('handwriting');
                  clearCanvas();
                }}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'handwriting'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } min-h-[44px] touch-manipulation`}
              >
                <div className="flex items-center justify-center gap-2">
                  <PenTool className="w-4 h-4" />
                  <span>Handwriting</span>
                </div>
              </button>
            </div>

            {/* Keyboard Input Mode */}
            {inputMode === 'keyboard' && (
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && userAnswer && !showFeedback && checkAnswer()}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-lg text-gray-900 !text-gray-900 bg-white !bg-white border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 min-h-[44px] touch-manipulation dark:!text-gray-900 dark:!bg-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                autoFocus
                disabled={showFeedback && (feedbackMsg.includes('Correct') || attempts >= 3)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                inputMode="text"
              />
            )}

            {/* Handwriting Canvas Mode */}
            {inputMode === 'handwriting' && (
              <div className="space-y-2">
                <div className="bg-white border-2 border-purple-300 rounded-lg p-2 relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full h-32 sm:h-40 md:h-48 border border-gray-200 rounded touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ touchAction: 'none' }}
                  />
                  <button
                    onClick={clearCanvas}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all touch-manipulation"
                    aria-label="Clear drawing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs sm:text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Draw your answer above. On iPad, you can also use the handwriting keyboard by long-pressing the globe key on your keyboard.
                  </p>
                </div>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && userAnswer && !showFeedback && checkAnswer()}
                  placeholder="Type what you drew (or use iPad handwriting keyboard)"
                  className="w-full px-4 py-3.5 sm:py-3 text-base sm:text-lg text-gray-900 !text-gray-900 bg-white !bg-white border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 min-h-[44px] touch-manipulation dark:!text-gray-900 dark:!bg-white placeholder:text-gray-500 dark:placeholder:text-gray-500"
                  disabled={showFeedback && (feedbackMsg.includes('Correct') || attempts >= 3)}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  inputMode="text"
                />
              </div>
            )}
            
            {showFeedback && (
              <div className={`rounded-xl p-4 ${
                feedbackMsg.includes('Correct') ? 'bg-green-50 border-2 border-green-300' : 
                attempts >= 3 ? 'bg-red-50 border-2 border-red-300' : 'bg-orange-50 border-2 border-orange-300'
              }`}>
                <p className={`font-bold ${
                  feedbackMsg.includes('Correct') ? 'text-green-700' : 
                  attempts >= 3 ? 'text-red-700' : 'text-orange-700'
                }`}>
                  {feedbackMsg}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {(!showFeedback || (showFeedback && attempts < 3 && !feedbackMsg.includes('Correct'))) && (
                <button
                  onClick={checkAnswer}
                  disabled={!userAnswer}
                  className="flex-1 text-white px-4 sm:px-6 py-3.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-95 transition-all min-h-[44px] touch-manipulation"
                  style={{ 
                    backgroundColor: userAnswer ? (selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6') : undefined
                  }}
                >
                  Check Answer
                </button>
              )}
              
              {(showFeedback && (feedbackMsg.includes('Correct') || attempts >= 3)) && (
                <button
                  onClick={nextQuestion}
                  className="flex-1 bg-green-600 text-white px-4 sm:px-6 py-3.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-700 active:scale-95 transition-all min-h-[44px] touch-manipulation"
                >
                  {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
                </button>
              )}
              
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-4 sm:px-6 py-3.5 sm:py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 active:scale-95 transition-all min-h-[44px] touch-manipulation"
              >
                {showHint ? 'Hide' : 'Hint'}
              </button>
            </div>

            {showHint && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-800">💡 <strong>Hint:</strong> {questions[currentQ].hint}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScienceSpellingQuiz;

