import React, { useState, useEffect } from 'react';
import { Sparkles, Award, RefreshCw, Trophy, Users } from 'lucide-react';

interface ScienceSpellingQuizProps {
  onBack?: () => void;
}

const ScienceSpellingQuiz = ({ onBack }: ScienceSpellingQuizProps) => {
  const rayneQuestions = [
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

  const jeffreyQuestions = [
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

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [records, setRecords] = useState({ rayne: [], jeffrey: [] });

  useEffect(() => {
    const saved = localStorage.getItem('spellingRecords');
    if (saved) {
      setRecords(JSON.parse(saved));
    }
  }, []);

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setQuestions(student === 'rayne' ? rayneQuestions : jeffreyQuestions);
  };

  const checkAnswer = () => {
    const correct = userAnswer.toLowerCase().trim() === questions[currentQ].answer.toLowerCase();
    
    if (correct) {
      setFeedbackMsg('✓ Correct! Well done!');
      setShowFeedback(true);
      setScore(score + 1);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setFeedbackMsg(`✗ The correct answer is: ${questions[currentQ].answer}`);
        setShowFeedback(true);
      } else {
        setFeedbackMsg(`✗ Not quite right. You have ${3 - newAttempts} ${3 - newAttempts === 1 ? 'try' : 'tries'} left!`);
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          setUserAnswer('');
        }, 1500);
      }
    }
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setShowHint(false);
      setAttempts(0);
      setFeedbackMsg('');
    } else {
      const percentage = Math.round((score / questions.length) * 100);
      const newRecords = { ...records };
      const studentKey = selectedStudent === 'rayne' ? 'rayne' : 'jeffrey';
      newRecords[studentKey].push({
        date: new Date().toLocaleString(),
        timestamp: new Date().toISOString(),
        score: score,
        total: questions.length,
        percentage: percentage
      });
      setRecords(newRecords);
      localStorage.setItem('spellingRecords', JSON.stringify(newRecords));
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

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-purple-700 mb-2">Science Spelling Quiz</h1>
            <p className="text-gray-600">Choose your quiz!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => selectStudent('rayne')}
              className="bg-gradient-to-br from-pink-400 to-purple-500 text-white p-8 rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              <h2 className="text-3xl font-bold mb-2">Rayne's Quiz</h2>
              <p className="text-pink-100 mb-4">30 Questions</p>
              {records.rayne.length > 0 && (
                <div className="bg-white/20 rounded-lg p-3 text-sm">
                  <p className="font-semibold">Best Score:</p>
                  <p className="text-2xl">{Math.max(...records.rayne.map(r => r.percentage))}%</p>
                </div>
              )}
            </button>

            <button
              onClick={() => selectStudent('jeffrey')}
              className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white p-8 rounded-xl hover:scale-105 transition-transform shadow-lg"
            >
              <h2 className="text-3xl font-bold mb-2">Jeffrey's Quiz</h2>
              <p className="text-blue-100 mb-4">26 Questions</p>
              {records.jeffrey.length > 0 && (
                <div className="bg-white/20 rounded-lg p-3 text-sm">
                  <p className="font-semibold">Best Score:</p>
                  <p className="text-2xl">{Math.max(...records.jeffrey.map(r => r.percentage))}%</p>
                </div>
              )}
            </button>
          </div>

          {(records.rayne.length > 0 || records.jeffrey.length > 0) && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <h3 className="text-2xl font-bold text-purple-700">🏆 Leaderboard - Who's Winning?</h3>
              </div>
              
              {/* Side-by-side comparison */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border-2 border-pink-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-pink-600 text-lg">Rayne</h4>
                    {records.rayne.length > 0 && (
                      <span className="text-2xl font-bold text-pink-600">
                        {Math.max(...records.rayne.map(r => r.percentage))}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Best Score</p>
                  <p className="text-xs text-gray-500">Total Attempts: {records.rayne.length}</p>
                  {records.rayne.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      Latest: {records.rayne[records.rayne.length - 1].percentage}%
                    </div>
                  )}
                </div>
                
                <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-blue-600 text-lg">Jeffrey</h4>
                    {records.jeffrey.length > 0 && (
                      <span className="text-2xl font-bold text-blue-600">
                        {Math.max(...records.jeffrey.map(r => r.percentage))}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Best Score</p>
                  <p className="text-xs text-gray-500">Total Attempts: {records.jeffrey.length}</p>
                  {records.jeffrey.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      Latest: {records.jeffrey[records.jeffrey.length - 1].percentage}%
                    </div>
                  )}
                </div>
              </div>

              {/* Recent attempts */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-pink-600 mb-2">Rayne's Recent Attempts</p>
                  {records.rayne.slice(-3).reverse().map((r, i) => (
                    <div key={i} className="bg-white/60 rounded p-2 mb-1 flex justify-between">
                      <span className="text-sm text-gray-700">{r.percentage}%</span>
                      <span className="text-xs text-gray-500">{r.score}/{r.total}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="font-semibold text-blue-600 mb-2">Jeffrey's Recent Attempts</p>
                  {records.jeffrey.slice(-3).reverse().map((r, i) => (
                    <div key={i} className="bg-white/60 rounded p-2 mb-1 flex justify-between">
                      <span className="text-sm text-gray-700">{r.percentage}%</span>
                      <span className="text-xs text-gray-500">{r.score}/{r.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / questions.length) * 100);
    const studentColor = selectedStudent === 'rayne' ? 'pink' : 'blue';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
            {selectedStudent === 'rayne' ? 'Rayne' : 'Jeffrey'}'s Result
          </h2>
          <p className="text-6xl font-bold text-gray-700 mb-2">{score}/{questions.length}</p>
          <p className="text-4xl font-bold mb-6" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
            {percentage}%
          </p>
          <div className="mb-6">
            {percentage === 100 && <p className="text-xl text-green-600">🌟 Perfect Score! You're a spelling superstar!</p>}
            {percentage >= 80 && percentage < 100 && <p className="text-xl text-blue-600">🎉 Excellent work! Keep it up!</p>}
            {percentage >= 60 && percentage < 80 && <p className="text-xl text-purple-600">👍 Good job! Practice makes perfect!</p>}
            {percentage < 60 && <p className="text-xl text-orange-600">💪 Keep practicing! You're improving!</p>}
          </div>
          <button
            onClick={restart}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }} />
              <h1 className="text-2xl font-bold" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
                {selectedStudent === 'rayne' ? 'Rayne' : 'Jeffrey'}'s Quiz
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Question {currentQ + 1}/{questions.length}</p>
              <p className="text-lg font-bold" style={{ color: selectedStudent === 'rayne' ? '#ec4899' : '#3b82f6' }}>
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

          <div className="bg-purple-50 rounded-xl p-6 mb-6">
            <p className="text-xl text-gray-800 leading-relaxed">
              {questions[currentQ].sentence}
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && userAnswer && !showFeedback && checkAnswer()}
              placeholder="Type your answer here..."
              className="w-full px-4 py-3 text-lg text-gray-900 bg-white border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
              autoFocus
              disabled={showFeedback && (feedbackMsg.includes('Correct') || attempts >= 3)}
            />
            
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

            <div className="flex gap-3">
              {(!showFeedback || (showFeedback && attempts < 3 && !feedbackMsg.includes('Correct'))) && (
                <button
                  onClick={checkAnswer}
                  disabled={!userAnswer}
                  className="flex-1 text-white px-6 py-3 rounded-lg text-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed transition"
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
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
                >
                  {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
                </button>
              )}
              
              <button
                onClick={() => setShowHint(!showHint)}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition"
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

