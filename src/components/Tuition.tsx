import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Clock, Trophy, BarChart3 } from 'lucide-react';
import ScienceSpellingQuiz from './ScienceSpellingQuiz';
import IBChemistryQuiz from './IBChemistryQuiz';

type QuizType = 'menu' | 'spelling' | 'chemistry';

const Tuition = () => {
  const [currentQuiz, setCurrentQuiz] = useState<QuizType>('menu');
  const [allRecords, setAllRecords] = useState({
    spelling: { rayne: [], jeffrey: [] },
    chemistry: []
  });

  useEffect(() => {
    // Load all quiz records
    const spellingRecords = localStorage.getItem('spellingRecords');
    const chemistryRecords = localStorage.getItem('ibChemistryRecords');
    
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
  }, []);

  const getBestScore = (quizType: 'spelling' | 'chemistry') => {
    if (quizType === 'spelling') {
      const rayneScores = allRecords.spelling.rayne.map((r: any) => r.percentage);
      const jeffreyScores = allRecords.spelling.jeffrey.map((r: any) => r.percentage);
      const allScores = [...rayneScores, ...jeffreyScores];
      return allScores.length > 0 ? Math.max(...allScores) : null;
    } else {
      const scores = allRecords.chemistry.map((r: any) => r.percentage);
      return scores.length > 0 ? Math.max(...scores) : null;
    }
  };

  const getTotalAttempts = (quizType: 'spelling' | 'chemistry') => {
    if (quizType === 'spelling') {
      return allRecords.spelling.rayne.length + allRecords.spelling.jeffrey.length;
    } else {
      return allRecords.chemistry.length;
    }
  };

  const getRecentAttempts = (quizType: 'spelling' | 'chemistry', limit: number = 5) => {
    if (quizType === 'spelling') {
      const allAttempts = [
        ...allRecords.spelling.rayne.map((r: any) => ({ ...r, student: 'Rayne' })),
        ...allRecords.spelling.jeffrey.map((r: any) => ({ ...r, student: 'Jeffrey' }))
      ];
      return allAttempts
        .sort((a, b) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime())
        .slice(0, limit);
    } else {
      return allRecords.chemistry
        .sort((a: any, b: any) => new Date(b.timestamp || b.date).getTime() - new Date(a.timestamp || a.date).getTime())
        .slice(0, limit);
    }
  };

  const refreshRecords = () => {
    const spellingRecords = localStorage.getItem('spellingRecords');
    const chemistryRecords = localStorage.getItem('ibChemistryRecords');
    
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

  if (currentQuiz === 'spelling') {
    return <ScienceSpellingQuiz onBack={() => {
      refreshRecords();
      setCurrentQuiz('menu');
    }} />;
  }

  if (currentQuiz === 'chemistry') {
    return <IBChemistryQuiz onBack={() => {
      refreshRecords();
      setCurrentQuiz('menu');
    }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <GraduationCap className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 mb-2">Tuition Center</h1>
          <p className="text-gray-600 text-lg">Practice and improve your knowledge!</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Spelling Quiz Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Science Spelling Quiz</h2>
                <p className="text-gray-600">Rayne & Jeffrey's Quizzes</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Practice spelling science-related words with interactive quizzes designed for Rayne and Jeffrey.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Best Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {getBestScore('spelling') ? `${getBestScore('spelling')}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-2xl font-bold text-pink-600">{getTotalAttempts('spelling')}</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentQuiz('spelling')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition transform hover:scale-105"
            >
              Start Spelling Quiz
            </button>
          </div>

          {/* IB Chemistry Quiz Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">IB Chemistry Quiz</h2>
                <p className="text-gray-600">International Baccalaureate</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Test your knowledge of IB Chemistry concepts with multiple-choice questions and detailed explanations.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-teal-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Best Score</p>
                <p className="text-2xl font-bold text-teal-600">
                  {getBestScore('chemistry') ? `${getBestScore('chemistry')}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-2xl font-bold text-green-600">{getTotalAttempts('chemistry')}</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentQuiz('chemistry')}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-teal-700 transition transform hover:scale-105"
            >
              Start Chemistry Quiz
            </button>
          </div>
        </div>

        {/* Spelling Quiz Leaderboard - Always show if there are attempts */}
        {getTotalAttempts('spelling') > 0 && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-xl p-8 border-2 border-yellow-300 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h3 className="text-2xl font-bold text-purple-700">🏆 Spelling Quiz Leaderboard</h3>
            </div>
            
            {/* Side-by-side comparison */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 border-2 border-pink-300 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-pink-600 text-xl">Rayne</h4>
                  {allRecords.spelling.rayne.length > 0 && (
                    <span className="text-3xl font-bold text-pink-600">
                      {Math.max(...allRecords.spelling.rayne.map((r: any) => r.percentage))}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">Best Score</p>
                <p className="text-xs text-gray-500 mb-3">Total Attempts: {allRecords.spelling.rayne.length}</p>
                {allRecords.spelling.rayne.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Latest Score:</p>
                    <p className="text-lg font-semibold text-pink-600">
                      {allRecords.spelling.rayne[allRecords.spelling.rayne.length - 1].percentage}%
                    </p>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl p-6 border-2 border-blue-300 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-blue-600 text-xl">Jeffrey</h4>
                  {allRecords.spelling.jeffrey.length > 0 && (
                    <span className="text-3xl font-bold text-blue-600">
                      {Math.max(...allRecords.spelling.jeffrey.map((r: any) => r.percentage))}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">Best Score</p>
                <p className="text-xs text-gray-500 mb-3">Total Attempts: {allRecords.spelling.jeffrey.length}</p>
                {allRecords.spelling.jeffrey.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Latest Score:</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {allRecords.spelling.jeffrey[allRecords.spelling.jeffrey.length - 1].percentage}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        {(getTotalAttempts('spelling') > 0 || getTotalAttempts('chemistry') > 0) && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              <h3 className="text-2xl font-bold text-gray-800">Recent Activity</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Spelling Recent */}
              {getTotalAttempts('spelling') > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Spelling Quiz History
                  </h4>
                  <div className="space-y-2">
                    {getRecentAttempts('spelling', 5).map((record: any, index: number) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {record.student || 'Student'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.timestamp || record.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">{record.percentage}%</p>
                          <p className="text-xs text-gray-500">{record.score}/{record.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chemistry Recent */}
              {getTotalAttempts('chemistry') > 0 && (
                <div>
                  <h4 className="font-semibold text-teal-700 mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    IB Chemistry
                  </h4>
                  <div className="space-y-2">
                    {getRecentAttempts('chemistry', 5).map((record: any, index: number) => (
                      <div key={index} className="bg-teal-50 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Quiz Attempt</p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.timestamp || record.date).toLocaleString()}
                            {record.timeSpent && ` • ${Math.floor(record.timeSpent / 60)}m ${record.timeSpent % 60}s`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-teal-600">{record.percentage}%</p>
                          <p className="text-xs text-gray-500">{record.score}/{record.total}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tuition;

