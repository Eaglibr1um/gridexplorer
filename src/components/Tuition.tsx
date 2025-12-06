import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, GraduationCap, Clock, Trophy, BarChart3 } from 'lucide-react';
import ScienceSpellingQuiz from './ScienceSpellingQuiz';
import IBChemistryQuiz from './IBChemistryQuiz';

type QuizType = 'menu' | 'spelling' | 'chemistry';

interface QuizRecord {
  date: string;
  timestamp?: string;
  score: number;
  total: number;
  percentage: number;
  student?: string;
  timeSpent?: number;
}

const Tuition = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const quizParam = searchParams.get('quiz') as QuizType | null;
  const currentQuiz: QuizType = (quizParam && ['spelling', 'chemistry'].includes(quizParam)) ? quizParam : 'menu';
  const [allRecords, setAllRecords] = useState<{
    spelling: { rayne: QuizRecord[]; jeffrey: QuizRecord[] };
    chemistry: QuizRecord[];
  }>({
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
      const rayneScores = allRecords.spelling.rayne.map((r) => r.percentage);
      const jeffreyScores = allRecords.spelling.jeffrey.map((r) => r.percentage);
      const allScores = [...rayneScores, ...jeffreyScores];
      return allScores.length > 0 ? Math.max(...allScores) : null;
    } else {
      const scores = allRecords.chemistry.map((r) => r.percentage);
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

  const getRecentAttempts = (quizType: 'spelling' | 'chemistry', limit: number = 5): QuizRecord[] => {
    if (quizType === 'spelling') {
      const allAttempts: QuizRecord[] = [
        ...allRecords.spelling.rayne.map((r) => ({ ...r, student: 'Rayne' })),
        ...allRecords.spelling.jeffrey.map((r) => ({ ...r, student: 'Jeffrey' }))
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

  const navigateToQuiz = (quiz: 'spelling' | 'chemistry') => {
    setSearchParams({ quiz });
  };

  const navigateToMenu = () => {
    refreshRecords();
    setSearchParams({});
  };

  if (currentQuiz === 'spelling') {
    return <ScienceSpellingQuiz onBack={navigateToMenu} />;
  }

  if (currentQuiz === 'chemistry') {
    return <IBChemistryQuiz onBack={navigateToMenu} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 sm:p-6 md:p-8 safe-area-inset">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-indigo-700 mb-2 px-2">Tuition Homepage</h1>
          <p className="text-gray-600 text-base sm:text-lg px-2">Practice and improve your knowledge!</p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Spelling Quiz Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg sm:rounded-xl flex-shrink-0">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Science Spelling Quiz</h2>
                <p className="text-sm sm:text-base text-gray-600">Rayne & Jeffrey's Quizzes</p>
              </div>
            </div>
            
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
              Practice spelling science-related words with interactive quizzes designed for Rayne and Jeffrey.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-purple-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Best Score</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {getBestScore('spelling') ? `${getBestScore('spelling')}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-xl sm:text-2xl font-bold text-pink-600">{getTotalAttempts('spelling')}</p>
              </div>
            </div>

            <button
              onClick={() => navigateToQuiz('spelling')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg hover:from-pink-600 hover:to-purple-700 active:scale-95 transition-all min-h-[44px] touch-manipulation"
            >
              Start Spelling Quiz
            </button>
          </div>

          {/* IB Chemistry Quiz Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg sm:rounded-xl flex-shrink-0">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">IB Chemistry Quiz</h2>
                <p className="text-sm sm:text-base text-gray-600">International Baccalaureate</p>
              </div>
            </div>
            
            <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
              Test your knowledge of IB Chemistry concepts with multiple-choice questions and detailed explanations.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-teal-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Best Score</p>
                <p className="text-xl sm:text-2xl font-bold text-teal-600">
                  {getBestScore('chemistry') ? `${getBestScore('chemistry')}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Attempts</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{getTotalAttempts('chemistry')}</p>
              </div>
            </div>

            <button
              onClick={() => navigateToQuiz('chemistry')}
              className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3.5 sm:py-3 rounded-lg font-semibold text-base sm:text-lg hover:from-green-600 hover:to-teal-700 active:scale-95 transition-all min-h-[44px] touch-manipulation"
            >
              Start Chemistry Quiz
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        {(getTotalAttempts('spelling') > 0 || getTotalAttempts('chemistry') > 0) && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-5 sm:p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 flex-shrink-0" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Recent Activity</h3>
            </div>

            <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Spelling Recent */}
              {getTotalAttempts('spelling') > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Spelling Quiz History
                  </h4>
                  <div className="space-y-2">
                    {getRecentAttempts('spelling', 5).map((record, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-3 sm:p-4 flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium text-gray-700 truncate">
                            {record.student || 'Student'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {new Date(record.timestamp || record.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base sm:text-lg font-bold text-purple-600">{record.percentage}%</p>
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
                    {getRecentAttempts('chemistry', 5).map((record, index) => (
                      <div key={index} className="bg-teal-50 rounded-lg p-3 sm:p-4 flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-medium text-gray-700">Quiz Attempt</p>
                          <p className="text-xs text-gray-500 truncate">
                            {new Date(record.timestamp || record.date).toLocaleString()}
                            {record.timeSpent && ` • ${Math.floor(record.timeSpent / 60)}m ${record.timeSpent % 60}s`}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base sm:text-lg font-bold text-teal-600">{record.percentage}%</p>
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

