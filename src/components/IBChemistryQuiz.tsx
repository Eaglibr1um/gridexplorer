import React, { useState, useEffect } from 'react';
import { Award, RefreshCw, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tutee } from '../types/tuition';

interface IBChemistryQuizProps {
  tutee: Tutee;
  onBack?: () => void;
}

const IBChemistryQuiz = ({ tutee, onBack }: IBChemistryQuizProps) => {
  // Placeholder questions - you can replace these with actual IB Chemistry questions
  const questions = [
    { 
      question: "What is the atomic number of carbon?", 
      options: ["6", "12", "14", "8"], 
      correct: 0,
      explanation: "Carbon has an atomic number of 6, meaning it has 6 protons."
    },
    { 
      question: "What is the chemical formula for water?", 
      options: ["H2O", "CO2", "NaCl", "O2"], 
      correct: 0,
      explanation: "Water is composed of two hydrogen atoms and one oxygen atom, hence H2O."
    },
    { 
      question: "What type of bond is formed between a metal and a non-metal?", 
      options: ["Covalent", "Ionic", "Metallic", "Hydrogen"], 
      correct: 1,
      explanation: "Ionic bonds are formed when electrons are transferred from a metal to a non-metal."
    },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [records, setRecords] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`ibChemistryRecords_${tutee.id}`);
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, [tutee.id]);

  useEffect(() => {
    if (!completed && currentQ === 0 && selectedAnswer === null) {
      setStartTime(new Date().toISOString());
    }
  }, []);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    
    if (index === questions[currentQ].correct) {
      setScore(score + 1);
    }
    
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const endTimeISO = new Date().toISOString();
      setEndTime(endTimeISO);
      const percentage = Math.round((score / questions.length) * 100);
      const timeSpent = startTime ? Math.round((new Date(endTimeISO).getTime() - new Date(startTime).getTime()) / 1000) : 0;
      
      const newRecord = {
        date: new Date().toLocaleString(),
        timestamp: endTimeISO,
        startTime: startTime,
        endTime: endTimeISO,
        timeSpent: timeSpent,
        score: score,
        total: questions.length,
        percentage: percentage
      };
      
      const newRecords = [...records, newRecord];
      setRecords(newRecords);
      localStorage.setItem(`ibChemistryRecords_${tutee.id}`, JSON.stringify(newRecords));
      setCompleted(true);
    }
  };

  const restart = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback if no callback provided
      setCurrentQ(0);
      setSelectedAnswer(null);
      setScore(0);
      setShowResult(false);
      setCompleted(false);
      setStartTime(new Date().toISOString());
      setEndTime(null);
    }
  };

  const primaryColor = tutee.colorScheme.primary;
  const secondaryColor = tutee.colorScheme.secondary;
  const bgPrimary = `bg-${primaryColor}-600`;
  const textPrimary = `text-${primaryColor}-600`;
  const borderPrimary = `border-${primaryColor}-300`;
  const hoverBgPrimary = `hover:bg-${primaryColor}-700`;

  useEffect(() => {
    if (completed) {
      const percentage = Math.round((score / questions.length) * 100);
      if (percentage >= 80) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: [
            primaryColor === 'pink' ? '#ec4899' : primaryColor === 'green' ? '#10b981' : '#3b82f6',
            secondaryColor === 'purple' ? '#a855f7' : secondaryColor === 'teal' ? '#14b8a6' : '#6366f1',
            '#fbbf24'
          ]
        });

        if (percentage === 100) {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: [
                primaryColor === 'pink' ? '#ec4899' : primaryColor === 'green' ? '#10b981' : '#3b82f6',
                secondaryColor === 'purple' ? '#a855f7' : secondaryColor === 'teal' ? '#14b8a6' : '#6366f1',
                '#fbbf24'
              ]
            });
          }, 250);
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: [
                primaryColor === 'pink' ? '#ec4899' : primaryColor === 'green' ? '#10b981' : '#3b82f6',
                secondaryColor === 'purple' ? '#a855f7' : secondaryColor === 'teal' ? '#14b8a6' : '#6366f1',
                '#fbbf24'
              ]
            });
          }, 400);
        }
      }
    }
  }, [completed, score, questions.length, primaryColor, secondaryColor]);

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const timeSpent = startTime && endTime ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000) : 0;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-teal-100 p-4 sm:p-6 md:p-8 flex items-center justify-center safe-area-inset">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-5 sm:p-6 md:p-8 max-w-md w-full text-center mx-2">
          <Award className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-teal-700 px-2">IB Chemistry Quiz Result</h2>
          <p className="text-5xl sm:text-6xl font-bold text-gray-700 mb-2">{score}/{questions.length}</p>
          <p className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-teal-600">{percentage}%</p>
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6 px-2">
            Time: {minutes}m {seconds}s
          </p>
          <div className="mb-4 sm:mb-6 px-2">
            {percentage === 100 && <p className="text-lg sm:text-xl text-green-600">🌟 Perfect Score! Excellent work!</p>}
            {percentage >= 80 && percentage < 100 && <p className="text-lg sm:text-xl text-blue-600">🎉 Great job! Keep studying!</p>}
            {percentage >= 60 && percentage < 80 && <p className="text-lg sm:text-xl text-purple-600">👍 Good effort! Review the topics!</p>}
            {percentage < 60 && <p className="text-lg sm:text-xl text-orange-600">💪 Keep practicing! You'll improve!</p>}
          </div>
          <button
            onClick={restart}
            className="bg-teal-600 text-white px-6 sm:px-8 py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-2 mx-auto min-h-[44px] touch-manipulation"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-${primaryColor}-100 to-${secondaryColor}-100 p-3 sm:p-4 md:p-8 safe-area-inset`}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[2rem] sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-row justify-between items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className={`w-5 h-5 sm:w-6 sm:h-6 ${textPrimary} flex-shrink-0`} />
              <h1 className={`text-lg sm:text-xl md:text-2xl font-bold text-${primaryColor}-700 truncate`}>IB Chemistry Quiz</h1>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] sm:text-sm text-gray-600 font-bold uppercase tracking-wider">Q {currentQ + 1}/{questions.length}</p>
              <p className={`text-sm sm:text-lg font-black ${textPrimary}`}>Score: {score}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 bg-gradient-to-r from-${primaryColor}-400 to-${secondaryColor}-500`}
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className={`bg-${primaryColor}-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-4 sm:mb-6`}>
            <p className="text-base sm:text-lg md:text-xl text-gray-800 font-semibold">
              {questions[currentQ].question}
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {questions[currentQ].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={showResult}
                className={`w-full text-left px-4 sm:px-6 py-3.5 sm:py-4 rounded-lg border-2 transition-all min-h-[44px] touch-manipulation ${
                  showResult
                    ? index === questions[currentQ].correct
                      ? 'bg-green-100 border-green-500 text-green-800'
                      : selectedAnswer === index
                      ? 'bg-red-100 border-red-500 text-red-800'
                      : 'bg-gray-50 border-gray-300 text-gray-600'
                    : selectedAnswer === index
                    ? `bg-${primaryColor}-100 border-${primaryColor}-500 text-${primaryColor}-800`
                    : `bg-white border-gray-300 text-gray-700 active:border-${primaryColor}-300 active:bg-${primaryColor}-50`
                } ${showResult ? '' : 'active:scale-[0.98]'}`}
              >
                <span className="text-sm sm:text-base">{option}</span>
              </button>
            ))}
          </div>

          {showResult && (
            <div className="mb-4 sm:mb-6">
              <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 ${
                selectedAnswer === questions[currentQ].correct
                  ? 'bg-green-50 border-2 border-green-300'
                  : 'bg-red-50 border-2 border-red-300'
              }`}>
                <p className={`text-sm sm:text-base font-bold ${
                  selectedAnswer === questions[currentQ].correct
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}>
                  {selectedAnswer === questions[currentQ].correct
                    ? '✓ Correct!'
                    : '✗ Incorrect'}
                </p>
                <p className="text-xs sm:text-sm text-gray-700 mt-2">
                  {questions[currentQ].explanation}
                </p>
              </div>
            </div>
          )}

          {showResult && (
            <button
              onClick={nextQuestion}
              className={`w-full ${bgPrimary} text-white px-4 sm:px-6 py-3.5 sm:py-3 rounded-lg text-base sm:text-lg font-semibold hover:${hoverBgPrimary.replace('hover:bg-', 'hover:bg-')} active:scale-95 transition-all min-h-[44px] touch-manipulation`}
            >
              {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IBChemistryQuiz;

