import React, { useState, useMemo } from 'react';
import { FileText, Sparkles, Send, Copy, Check, ChevronDown, User, Calendar, Loader2, ArrowRight, MessageSquare, MessageCircle } from 'lucide-react';
import { Tutee } from '../../../types/tuition';
import { fetchReportData, generateAIReport, ProgressReportData } from '../../../services/progressReportService';
import { messagingService } from '../../../services/messagingService';
import { format } from 'date-fns';

interface ProgressReportAdminProps {
  tutees: Tutee[];
}

const ProgressReportAdmin = ({ tutees }: ProgressReportAdminProps) => {
  const [selectedTuteeId, setSelectedTuteeId] = useState<string>('');
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [report, setReport] = useState<string>('');
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState<'setup' | 'generated'>('setup');

  const selectedTutee = useMemo(() => tutees.find(t => t.id === selectedTuteeId), [tutees, selectedTuteeId]);

  const handleGenerate = async () => {
    if (!selectedTuteeId) return;
    
    setLoading(true);
    try {
      const data = await fetchReportData(selectedTuteeId, days);
      const generatedReport = await generateAIReport(data, customNotes);
      setReport(generatedReport);
      setStep('generated');
      setSent(false);
    } catch (error) {
      console.error(error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async () => {
    if (!selectedTuteeId || !report) return;

    setSendingMessage(true);
    try {
      await messagingService.sendMessage('admin', selectedTuteeId, report, 'Admin');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send the report to the student chat.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReset = () => {
    setStep('setup');
    setReport('');
    setCustomNotes('');
    setSent(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in">
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-gray-50 bg-gradient-to-r from-purple-50/50 to-white">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-purple-600 rounded-2xl shadow-lg transform -rotate-3">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">AI Progress Reports</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Professional Parent Updates</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {step === 'setup' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Select Student
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <select
                    value={selectedTuteeId}
                    onChange={(e) => setSelectedTuteeId(e.target.value)}
                    className="w-full pl-11 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 transition-all font-bold text-gray-800 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="">Choose a tutee...</option>
                    {tutees.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Time Range
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="w-full pl-11 pr-10 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 transition-all font-bold text-gray-800 shadow-inner appearance-none cursor-pointer"
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days (Standard)</option>
                    <option value={60}>Last 60 Days</option>
                    <option value={90}>Last 90 Days</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Tutor's Custom Notes (Optional)
              </label>
              <div className="relative group">
                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Any specific observations or behavioral feedback to include..."
                  rows={4}
                  className="w-full pl-11 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 transition-all font-medium text-gray-800 shadow-inner resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedTuteeId}
              className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                !selectedTuteeId || loading 
                  ? 'bg-gray-200 shadow-none grayscale cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-2xl hover:shadow-purple-200'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analyzing Student Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate Report with AI</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedTutee?.colorScheme.gradient} text-white shadow-sm`}>
                  <User className="w-4 h-4" />
                </div>
                <h4 className="font-black text-gray-800">{selectedTutee?.name}'s Report</h4>
              </div>
              <button
                onClick={handleReset}
                className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline"
              >
                Back to Settings
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                Edit Generated Report
              </label>
              <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border-2 border-purple-100 shadow-inner relative group">
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  rows={15}
                  className="w-full bg-transparent border-none focus:ring-0 text-gray-700 leading-relaxed font-medium whitespace-pre-wrap resize-none prose prose-sm max-w-none"
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleCopy}
                    className="p-3 bg-white text-gray-600 rounded-xl shadow-md border border-gray-100 hover:bg-purple-50 hover:text-purple-600 transition-all"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCopy}
                className="flex-1 py-4 bg-white border-2 border-purple-100 text-purple-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || sent}
                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                  sent 
                    ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } ${sendingMessage ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : sent ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                <span>{sendingMessage ? 'Sending...' : sent ? 'Sent to Chat!' : 'Send to Student Chat'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressReportAdmin;

