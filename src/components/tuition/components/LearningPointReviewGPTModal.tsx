import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle, Send, ArrowRight, Brain, BookOpen, RotateCcw } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { generateReviewQuestions, verifyReviewAnswers, VerificationResult } from '../../../services/learningPointReviewService';

interface LearningPointReviewGPTModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (history: Array<{ question: string; answer: string; feedback: string }>) => void;
  tutee: Tutee;
  sessionDate: string;
  learningPoints: string[];
}

const LearningPointReviewGPTModal = ({
  isOpen,
  onClose,
  onSuccess,
  tutee,
  sessionDate,
  learningPoints,
}: LearningPointReviewGPTModalProps) => {
  const [step, setStep] = useState<'loading' | 'questions' | 'verifying' | 'result'>('loading');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadQuestions();
    }
  }, [isOpen]);

  const loadQuestions = async () => {
    try {
      setStep('loading');
      setError('');
      const generated = await generateReviewQuestions(tutee.name, tutee.description, learningPoints);
      setQuestions(generated);
      setAnswers(new Array(generated.length).fill(''));
      setStep('questions');
    } catch (err: any) {
      setError(err.message || 'Failed to generate review questions. Please try again.');
      console.error(err);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const isAllAnswered = answers.every(a => a.trim().length > 0);

  const handleVerify = async () => {
    if (!isAllAnswered) return;

    try {
      setStep('verifying');
      setError('');
      const result = await verifyReviewAnswers(tutee.name, tutee.description, questions, answers);
      setVerification(result);
      setStep('result');
      
      if (result.canMarkAsReviewed) {
        // We wait for user to click "Done" to trigger onSuccess, 
        // or we could do it automatically. Let's let user see feedback first.
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify answers. Please try again.');
      setStep('questions');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const gradientClass = tutee.colorScheme.gradient;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-modal-backdrop">
      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-2xl w-full my-auto animate-modal-content border border-white/20 relative">
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${gradientClass} text-white flex items-center justify-between shadow-lg rounded-t-[2.5rem] -mx-6 -mt-6 sm:-mx-10 sm:-mt-10 mb-8`}>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-sm">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Review Session</h3>
              <p className="text-xs text-white/80 font-bold uppercase tracking-widest">{sessionDate}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {step === 'loading' && (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">Generating Questions...</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">AI is analyzing your points</p>
              </div>
            </div>
          )}

          {step === 'questions' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium">
                  Answer the following questions to prove your understanding. GPT will review your answers!
                </p>
              </div>

              <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                {questions.map((q, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center mt-1 text-white font-black text-sm`}>
                        {i + 1}
                      </div>
                      <p className="text-gray-800 font-bold leading-relaxed pt-1">{q}</p>
                    </div>
                    <textarea
                      value={answers[i]}
                      onChange={(e) => handleAnswerChange(i, e.target.value)}
                      placeholder="Type your explanation here..."
                      className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 outline-none transition-all text-sm font-medium resize-none min-h-[100px] shadow-inner"
                      rows={3}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest rounded-2xl border-2 border-red-100 flex items-center gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'verifying' && (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <div>
                <p className="text-lg font-bold text-gray-800">Reviewing Your Answers...</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Checking for understanding</p>
              </div>
            </div>
          )}

          {step === 'result' && verification && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className={`p-6 rounded-[2rem] border-2 flex flex-col items-center text-center space-y-3 ${
                verification.canMarkAsReviewed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                {verification.canMarkAsReviewed ? (
                  <div className="w-16 h-16 bg-green-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-green-100 mb-2">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-100 mb-2">
                    <RotateCcw className="w-10 h-10" />
                  </div>
                )}
                <h4 className={`text-2xl font-black tracking-tight ${verification.canMarkAsReviewed ? 'text-green-800' : 'text-amber-800'}`}>
                  {verification.canMarkAsReviewed ? 'Excellent Work!' : 'Almost There!'}
                </h4>
                <p className="text-sm font-medium opacity-80 max-w-md">
                  {verification.canMarkAsReviewed 
                    ? 'You have successfully reviewed these points. Keep up the great work!' 
                    : 'Your answers were a bit thin. GPT has some feedback to help you improve. Try again!'}
                </p>
              </div>

              <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GPT's Feedback & Add-ons</h5>
                {questions.map((q, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-[10px] font-black text-gray-400">Q</div>
                      <p className="text-xs font-bold text-gray-500 italic">"{q}"</p>
                    </div>
                    <div className="flex gap-3">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white bg-gradient-to-br ${gradientClass}`}>A</div>
                      <p className="text-sm font-bold text-gray-800">{answers[i]}</p>
                    </div>
                    <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">AI Insight</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{verification.feedback[i]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-8 flex gap-4">
          {step === 'questions' && (
            <button
              onClick={handleVerify}
              disabled={!isAllAnswered || step === 'verifying'}
              className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                !isAllAnswered 
                  ? 'bg-gray-200 shadow-none grayscale cursor-not-allowed' 
                  : `bg-gradient-to-r ${gradientClass} hover:shadow-2xl`
              }`}
            >
              <span>Submit for Review</span>
              <Send className="w-5 h-5" />
            </button>
          )}

          {step === 'result' && (
            <>
              {!verification?.canMarkAsReviewed ? (
                <button
                  onClick={() => setStep('questions')}
                  className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] bg-gradient-to-r ${gradientClass} hover:shadow-2xl`}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const history = questions.map((q, i) => ({
                      question: q,
                      answer: answers[i],
                      feedback: verification?.feedback[i] || ''
                    }));
                    onSuccess(history);
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] bg-gradient-to-r ${gradientClass} hover:shadow-2xl`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Mark as Completed</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LearningPointReviewGPTModal;
